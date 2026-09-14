import {
  Node,
  Label,
  Sprite,
  UITransform,
  Graphics,
  Color,
  ScrollView,
  Mask,
  BlockInputEvents,
  Vec2,
  view,
  ResolutionPolicy,
  sys,
  native,
  screen,
} from "cc";

/** Empty mobile actions must not cover the battlefield; desktop stays unchanged. */
export function contextInteractionVisible(compact: boolean, playing: boolean, available: boolean) {
  return !compact || (playing && available);
}

type Saved = {
  node: Node;
  parent: Node;
  index: number;
  x: number;
  y: number;
  w: number;
  h: number;
  sx: number;
  sy: number;
  font?: number;
  line?: number;
  overflow?: number;
  wrap?: boolean;
  align?: number;
};
type Page = {
  root: Node;
  originals: Saved[];
  all: Saved[];
  viewport: Node;
  content: Node;
  scroll: ScrollView;
  title: Node;
  footer: () => Node | null;
  signature: string;
  fresh: boolean;
  map: boolean;
};
export function textBlockHeight(
  text: string,
  width: number,
  font = 18,
  line = 26,
) {
  const capacity = Math.max(1, width / font);
  return text
    .split("\n")
    .reduce(
      (sum, row) =>
        sum +
        Math.max(
          1,
          Math.ceil(
            Array.from(row).reduce(
              (n, c) => n + (c.charCodeAt(0) > 255 ? 1 : 0.58),
              0,
            ) / capacity,
          ),
        ) *
          line,
      0,
    );
}
/** Android's Cocos 3.8.8 CommonScreen DPR is 1; use actual Android dp for UI only. */
export function logicalViewport(width: number, height: number, density = 1) {
  const scale = Number.isFinite(density) && density >= 0.5 && density <= 8 ? density : 1;
  return { width: Math.round(width / scale), height: Math.round(height / scale) };
}

export function compactSize(width: number, height: number) {
  return (
    Number.isFinite(width) &&
    Number.isFinite(height) &&
    width > 0 &&
    height > 0 &&
    (width < 900 || height < 600)
  );
}

/** Battle remains the focal surface; fixed controls only occupy its edges. */
export function battleViewport(w: number, h: number) {
  const landscape = w > h;
  const top = h / 2 - 72;
  const bottom = -h / 2 + (landscape ? 24 : 160);
  return {
    w: w - 16,
    h: Math.max(80, top - bottom),
    y: (top + bottom) / 2,
    top,
  };
}

/**
 * Portrait screens need a closer presentation to keep actors, hit silhouettes
 * and attack ranges legible. This is render-only: the combat canvas, camera,
 * collision radii and spawn simulation continue to use the baseline scale.
 */
export function battleRenderScale(w: number, h: number) {
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > w
    ? 0.68
    : 0.525;
}

export type VisualBattleView = {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

/**
 * Render-only camera for a zoomed battle field. The simulation keeps using its
 * baseline canvas/camera; portrait rendering follows the hero and may reveal a
 * small strip outside a chapter wall so the full actor sprite stays visible.
 */
export function visualBattleView(options: {
  playerX: number;
  playerY: number;
  fieldWidth: number;
  fieldHeight: number;
  scale: number;
  runMode: string;
  arenaWidth: number;
  arenaHeight: number;
  logicalCenterX: number;
  logicalCenterY: number;
  followPlayer?: boolean;
  edgeOverscan?:
    | number
    | { left: number; right: number; top: number; bottom: number };
}): VisualBattleView {
  const finite = (value: number, fallback: number) =>
      Number.isFinite(value) ? value : fallback,
    scale = Math.max(0.01, finite(options.scale, 0.525)),
    width = Math.max(1, finite(options.fieldWidth, 1) / scale),
    height = Math.max(1, finite(options.fieldHeight, 1) / scale),
    halfW = width / 2,
    halfH = height / 2,
    playerX = finite(options.playerX, 0),
    playerY = finite(options.playerY, 0),
    logicalCenterX = finite(options.logicalCenterX, playerX),
    logicalCenterY = finite(options.logicalCenterY, playerY);
  let cx = logicalCenterX,
    cy = logicalCenterY;
  // The baseline view is intentionally byte-for-byte compatible with the old
  // camera. Only a closer visual zoom needs an independent framing center.
  if (options.followPlayer || scale > 0.525 + 1e-6) {
    cx = playerX;
    cy = playerY;
    if (options.runMode === "chapter" && !options.followPlayer) {
      const arenaWidth = Math.max(1, finite(options.arenaWidth, width)),
        arenaHeight = Math.max(1, finite(options.arenaHeight, height)),
        rawOverscan = options.edgeOverscan ?? 0,
        edge =
          typeof rawOverscan === "number"
            ? {
                left: rawOverscan,
                right: rawOverscan,
                top: rawOverscan,
                bottom: rawOverscan,
              }
            : rawOverscan,
        left = Math.max(0, finite(edge.left, 0)),
        right = Math.max(0, finite(edge.right, 0)),
        top = Math.max(0, finite(edge.top, 0)),
        bottom = Math.max(0, finite(edge.bottom, 0)),
        minX = halfW - left,
        maxX = arenaWidth - halfW + right,
        minY = halfH - top,
        maxY = arenaHeight - halfH + bottom;
      cx =
        minX <= maxX ? Math.max(minX, Math.min(maxX, playerX)) : arenaWidth / 2;
      cy =
        minY <= maxY
          ? Math.max(minY, Math.min(maxY, playerY))
          : arenaHeight / 2;
    }
  }
  return { x: cx - halfW, y: cy - halfH, width, height, cx, cy };
}

/** Responsive composition of the existing native nodes, never duplicate game state/actions. */
export class ResponsiveLayout {
  compact = false;
  width = 960;
  height = 640;
  private frame = "";
  private pages: Page[] = [];
  private originalRoot: Saved[] = [];
  private originalAll: Saved[] = [];
  private focused: Node | null = null;
  private status: Label;
  get battleStatusNode() { return this.status?.node; }
  private battleStats: Label;
  private safe = { x: 0, y: 0, w: 960, h: 640 };
  constructor(private h: any) {
    this.originalRoot = this.capture(h.node, false);
    this.originalAll = this.capture(h.node, true);
    this.battleStats = h.label("", 0, 0, 14);
    this.battleStats.node.active = false;
    const page = (root: Node, footer: () => Node | null, map = false) => {
      const originals = this.capture(root, false),
        all = this.capture(root, true);
      const title = originals
        .filter((s) => s.node.getComponent(Label))
        .sort((a, b) => b.y - a.y)[0]?.node;
      const viewport = h.child("Adaptive scroll", root);
      viewport.addComponent(UITransform);
      viewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
      const content = h.child("Flow content", viewport);
      content.addComponent(UITransform).setAnchorPoint(0.5, 1);
      const scroll = viewport.addComponent(ScrollView);
      scroll.content = content;
      scroll.horizontal = map;
      scroll.vertical = true;
      scroll.inertia = false;
      scroll.elastic = false;
      scroll.cancelInnerEvents = true;
      viewport.active = false;
      if (!root.getComponent(UITransform)) root.addComponent(UITransform);
      if (!root.getComponent(BlockInputEvents))
        root.addComponent(BlockInputEvents);
      this.pages.push({
        root,
        originals,
        all,
        viewport,
        content,
        scroll,
        title,
        footer,
        signature: "",
        fresh: true,
        map,
      });
    };
    const named = (root: Node, re: RegExp) =>
      root.children.find((n) => re.test(n.name)) || null;
    page(h.menu, () => h.startLabel.node.parent);
    page(h.overlay, () =>
      h.resumeButton.active
        ? h.resumeButton
        : h.exitLabel.node.parent.active
          ? h.exitLabel.node.parent
          : null,
    );
    page(h.settingsPanel, () => named(h.settingsPanel, /^返回/));
    page(h.detailsPanel, () => h.detailsClose.node.parent);
    page(h.profilePanel, () => named(h.profilePanel, /^返回/));
    page(h.manager.node, () => named(h.manager.node, /^取消/));
    page(h.guidePanel, () => h.guideBack);
    page(h.mapPanel, () => h.mapCloseLabel.node.parent, true);
    this.status = h.label("", 0, 0, 15);
    this.status.node.active = false;
  }
  private capture(root: Node, deep: boolean): Saved[] {
    const result: Saved[] = [];
    for (const n of root.children) {
      const ui = n.getComponent(UITransform),
        l = n.getComponent(Label);
      result.push({
        node: n,
        parent: root,
        index: n.getSiblingIndex(),
        x: n.position.x,
        y: n.position.y,
        w: ui?.width || 0,
        h: ui?.height || 0,
        sx: n.scale.x,
        sy: n.scale.y,
        font: l?.fontSize,
        line: l?.lineHeight,
        overflow: l?.overflow,
        wrap: l?.enableWrapText,
        align: l?.horizontalAlign,
      });
      if (deep) result.push(...this.capture(n, true));
    }
    return result;
  }
  private restore(list: Saved[]) {
    for (const s of list) {
      const n = s.node;
      this.parent(n, s.parent);
      n.setSiblingIndex(s.index);
      n.setPosition(s.x, s.y);
      n.setScale(s.sx, s.sy, 1);
      const l = n.getComponent(Label);
      if (l) {
        l.fontSize = s.font;
        l.lineHeight = s.line;
        l.overflow = s.overflow as any;
        l.enableWrapText = s.wrap;
        l.horizontalAlign = s.align as any;
      }
      n.getComponent(UITransform)?.setContentSize(s.w, s.h);
      if (n.name === "Panel") this.box(n, s.w, s.h);
      if (n.name === "ControllerFocus") {
        const parent = n.parent.getComponent(UITransform);
        this.box(n, parent.width + 4, parent.height + 4, true);
      }
    }
  }
  private box(n: Node, w: number, h: number, ring = false) {
    const g = n.getComponent(Graphics);
    if (!g) return;
    const ui = n.getComponent(UITransform);
    if ((n as any).__boxSize === `${w},${h}`) return;
    (n as any).__boxSize = `${w},${h}`;
    ui?.setContentSize(w, h);
    g.clear();
    if (!ring) {
      g.fillColor = n.parent?.getChildByName("ControllerFocus")
        ? new Color(34, 49, 40, 255)
        : new Color(22, 32, 29, 255);
      g.rect(-w / 2, -h / 2, w, h);
      g.fill();
    }
    g.strokeColor = new Color(ring ? "#eed493" : "#6e866c");
    g.lineWidth = ring ? 3 : 1;
    g.rect(-w / 2, -h / 2, w, h);
    g.stroke();
  }
  private parent(n: Node, target: Node) {
    if (n.parent === target) return;
    // Cocos 3.8 reattaches masks on reparent but does not invalidate pointer
    // ordering when both parents are active. Public deactivate/reactivate also
    // refreshes native render/event state without private engine hooks.
    const active = n.active;
    n.active = false;
    n.setParent(target);
    n.active = active;
  }
  private label(n: Node, w: number, font = 18): number {
    const l = n.getComponent(Label);
    if (!l) return 0;
    l.fontSize = font;
    l.lineHeight = font + 8;
    l.enableWrapText = true;
    l.overflow = Label.Overflow.CLAMP;
    const height = textBlockHeight(l.string, w, font, font + 8);
    n.getComponent(UITransform).setContentSize(w, height);
    return height;
  }
  private button(n: Node, w: number): number {
    const l = n.getChildByName("Label")?.getComponent(Label);
    if (!l) return 52;
    const icons = n.children.filter((c) => c.getComponent(Sprite));
    const tw = w - (icons.length ? 76 : 24),
      height = Math.max(52, this.label(l.node, tw, 18) + 20);
    l.node.setPosition(icons.length ? 24 : 0, 0);
    n.getComponent(UITransform).setContentSize(w, height);
    for (const c of icons) {
      c.setPosition(-w / 2 + 30, 0);
      c.getComponent(UITransform).setContentSize(36, 36);
    }
    const bg = n.getChildByName("Panel"),
      ring = n.getChildByName("ControllerFocus");
    if (bg) this.box(bg, w, height);
    if (ring) this.box(ring, w + 4, height + 4, true);
    return height;
  }
  tick() {
    const frame = view.getFrameSize(),
      key = `${Math.round(frame.width)},${Math.round(frame.height)}`;
    if (key !== this.frame) {
      let f = frame;
      if (sys.isNative && sys.os === sys.OS.ANDROID) {
        let density = 1;
        try {
          density = native.reflection.callStaticMethod("com/cocos/game/AppActivity", "getUiDensity", "()F");
        } catch { /* Older host: retain valid pixel geometry rather than stopping the game. */ }
        const physical = screen.windowSize;
        f = logicalViewport(physical.width, physical.height, density) as any;
      }
      const was = this.frame;
      this.frame = key;
      this.focused = null;
      this.compact = compactSize(f.width, f.height);
      this.width = this.compact ? Math.round(f.width) : 960;
      this.height = this.compact ? Math.round(f.height) : 640;
      view.setDesignResolutionSize(
        this.width,
        this.height,
        ResolutionPolicy.SHOW_ALL,
      );
      this.restore(this.originalAll);
      for (const p of this.pages) {
        this.restore(p.all);
        p.viewport.active = this.compact;
        p.signature = "";
        p.fresh = true;
        p.root.setPosition(0, 0);
      }
      if (was && this.h.session) {
        this.h.session.pause();
        this.h.clearInput();
        this.h.renderOverlay(this.h.session);
      }
      const safe = sys.getSafeAreaRect(false);
      this.safe = {
        x: safe.x + safe.width / 2 - this.width / 2,
        y: safe.y + safe.height / 2 - this.height / 2,
        w: Math.min(this.width, safe.width),
        h: Math.min(this.height, safe.height),
      };
      if (!this.compact) {
        this.h.joystick.setVisible(false);
        this.h.movementToggle.active = false;
        for (const d of this.h.directionButtons) d.node.active = true;
        this.h.battle.getComponent(UITransform).setContentSize(630, 420);
        this.status.node.active = false;
        this.battleStats.node.active = false;
        for (const n of [
          this.h.miniMap.node,
          this.h.markers.node,
          this.h.routeLabel.node,
          this.h.controlsHint.node,
          ...this.h.weaponLabels.map((l: any) => l.node),
        ])
          n.active = true;
        this.originalRoot.find((s) =>
          /^收起 \/ 显示地图/.test(s.node.name),
        ).node.active = true;
        if (this.h.session) {
          this.h.session.canvas.width = 1200;
          this.h.session.canvas.height = 800;
          this.h.session._updateCamera();
        }
      }
    }
    if (!this.compact) {
      if (this.h.menu.activeInHierarchy) this.menuDesktop();
      // Long pause/settlement copy needs the same readable flow as mobile.
      // Keep choice/interaction screens on their existing desktop geometry.
      const p = this.pages.find((page) => page.root === this.h.overlay);
      const reading = p.root.activeInHierarchy && this.h.pauseDetail.node.active;
      if (reading) {
        p.viewport.active = true;
        this.flow(p, { x: 0, y: 0, w: 870, h: 560 });
      } else {
        if (p.viewport.active) {
          this.restore(p.all);
          p.viewport.active = false;
          p.root.setPosition(0, 0);
        }
        p.fresh = true;
        p.signature = "";
      }
      return;
    }
    for (const p of this.pages) {
      if (!p.root.activeInHierarchy) {
        p.fresh = true;
        continue;
      }
      this.flow(p);
    }
    this.battle();
  }
  private menuDesktop() {
    const h = this.h,
      p = this.pages.find((p) => p.root === h.menu);
    const signature =
      "desktop:" +
      h.editingNew +
      p.originals
        .map(
          (s) =>
            `${s.node.active}:${s.node.getComponent(Label)?.string || s.node.getChildByName("Label")?.getComponent(Label)?.string || ""}`,
        )
        .join("|");
    if (p.signature === signature) return;
    p.signature = signature;
    const text = (
      l: Label,
      x: number,
      y: number,
      w: number,
      height: number,
      font: number,
    ) => {
      l.node.setPosition(x, y);
      l.node.getComponent(UITransform).setContentSize(w, height);
      l.fontSize = font;
      l.lineHeight = font + 7;
      l.enableWrapText = true;
      l.overflow = Label.Overflow.CLAMP;
    };
    const button = (n: Node, x: number, y: number, w: number) => {
      if (!n) return;
      this.button(n, w);
      n.setPosition(x, y);
    };
    const named = (name: string) =>
      p.originals.find((s) => s.node.name === name)?.node;
    this.box(h.menu.getChildByName("Panel"), 944, 636);
    text(p.title.getComponent(Label), -270, 275, 320, 48, 34);
    const caption = p.originals
      .find((s) => s.y === 201)
      ?.node.getComponent(Label);
    if (caption) text(caption, 170, 280, 510, 28, 14);
    h.slotLabels.forEach((l: Label, i: number) => {
      button(l.node.parent, (i - 1) * 292, 209, 278);
      l.fontSize = 15;
      l.lineHeight = 20;
      l.node.getComponent(UITransform).setContentSize(254, 42);
    });
    h.portrait.node.setPosition(-292, 66);
    h.portrait.node.getComponent(UITransform).setContentSize(196, 196);
    text(h.journeySummary, -292, -42, 278, 44, 15);
    text(h.title, 135, 140, 506, 46, 32);
    text(h.detail, 135, 91, 506, 62, 17);
    h.kitLabels.forEach((l: Label, i: number) => {
      text(l, 163, 36 - i * 34, 392, 29, 17);
      l.horizontalAlign = Label.HorizontalAlign.LEFT;
      h.kitIcons[i].node.setPosition(-232, 0);
    });
    text(h.talentText, 135, -88, 506, 76, 16);
    button(named("上一位"), -366, -91, 132);
    button(named("下一位"), -220, -91, 132);
    button(named("切换初始天赋"), 5, -147, 238);
    button(h.difficultyLabel.node.parent, 265, -147, 238);
    button(h.modeLabel.node.parent, 5, -208, 238);
    button(h.stageLabel.node.parent, 265, -208, 238);
    button(named("命契管理"), -366, -151, 132);
    button(named("设置"), -220, -151, 132);
    const profile = named("命府 · 等级 / 天赋 / 图鉴");
    profile.getChildByName("Label").getComponent(Label).string = "命府 / 图鉴";
    button(profile, -366, -211, 132);
    button(named("操作指南"), -220, -211, 132);
    button(
      h.startLabel.node.parent,
      h.editingNew ? 286 : 135,
      -275,
      h.editingNew ? 240 : 498,
    );
    button(
      h.newButton,
      h.editingNew ? 25 : -292,
      -275,
      h.editingNew ? 240 : 278,
    );
    button(h.cancelNew, -292, -275, 278);
    text(h.notice, 0, -310, 900, 24, 12);
  }
  private flow(p: Page, area = this.safe) {
    const { w, h, x, y } = area;
    p.root.setPosition(x, y);
    p.root.getComponent(UITransform).setContentSize(w, h);
    const background = p.root.getChildByName("Panel");
    if (background) this.box(background, w, h);
    const footer = p.footer();
    const signature =
      p.originals
        .map(
          (s) =>
            `${s.node.active}:${s.node.getComponent(Label)?.string || s.node.getChildByName("Label")?.getComponent(Label)?.string || ""}`,
        )
        .join("|") +
      footer?.uuid +
      `${w},${h}`;
    if (!p.fresh && signature === p.signature) return;
    const previous = p.scroll.getScrollOffset();
    p.signature = signature;
    const landscape = w > h,
      portrait = p.root === this.h.menu ? this.h.portrait.node : null;
    const sidePortrait = portrait && landscape;
    const flowW = Math.min(720, w - 32 - (sidePortrait ? 164 : 0)),
      centerX = sidePortrait ? 82 : 0;
    // Saving must acknowledge success/failure without another scroll gesture.
    const notice = p.root === this.h.overlay && this.h.pauseDetail.node.active
      ? this.h.saveNotice.node : null;
    const noticeHeight = notice ? this.label(notice, flowW, 14) : 0;
    const noticeSpace = notice ? noticeHeight + 8 : 0;
    const viewportH = Math.max(100, h - 144 - noticeSpace);
    p.viewport.setPosition(centerX, noticeSpace / 2);
    p.viewport.getComponent(UITransform).setContentSize(flowW, viewportH);
    p.content.setPosition(0, viewportH / 2);
    if (p.title) {
      this.parent(p.title, p.root);
      this.label(p.title, w - 32, 24);
      p.title.setPosition(0, h / 2 - 42);
    }
    if (footer) {
      this.parent(footer, p.root);
      const bh = this.button(footer, Math.min(w - 32, 480));
      footer.setPosition(0, -h / 2 + bh / 2 + 12);
      if (notice) {
        this.parent(notice, p.root);
        notice.setPosition(0, -h / 2 + 12 + bh + 8 + noticeHeight / 2);
      }
    }
    const guideNav =
      p.root === this.h.guidePanel
        ? p.originals
            .filter((s) => ["上一页", "下一页"].includes(s.node.name))
            .map((s) => s.node)
        : [];
    if (guideNav.length && footer) {
      const width = Math.min(180, (w - 48) / 3);
      for (const [i, n] of [guideNav[0], footer, guideNav[1]].entries()) {
        this.parent(n, p.root);
        const bh = this.button(n, width);
        n.setPosition((i - 1) * (width + 8), -h / 2 + bh / 2 + 12);
      }
    }
    if (sidePortrait) {
      this.parent(portrait, p.root);
      portrait.setPosition(-w / 2 + 90, 0);
      portrait.getComponent(UITransform).setContentSize(148, 148);
    }
    const items = p.originals.filter(
      (s) =>
        s.node !== p.title &&
        s.node !== footer &&
        s.node !== notice &&
        !guideNav.includes(s.node) &&
        s.node !== background &&
        s.node.active &&
        (s.node.getComponent(Label)?.string ||
          s.node.getChildByName("Label") ||
          s.node.getComponent(Sprite) ||
          (p.map && s.node === this.h.mapGraphics.node)) &&
        !(sidePortrait && s.node === portrait),
    );
    let height = 0;
    if (p.map) {
      for (const s of items) {
        this.parent(s.node, p.content);
        s.node.setPosition(s.x, s.y - 220);
      }
      height = 1000;
      p.content.getComponent(UITransform).setContentSize(780, height);
    } else {
      const priority = (s: Saved) => {
        if (p.root !== this.h.menu) return -s.y;
        if (s.node === portrait) return -1000;
        if (s.node === this.h.title.node) return -990;
        if (s.node === this.h.detail.node) return -980;
        if (s.node === this.h.talentText.node) return -970;
        if (s.node === this.h.journeySummary.node) return -979;
        if (this.h.kitLabels.some((l: Label) => l.node === s.node))
          return (
            -975 + this.h.kitLabels.findIndex((l: Label) => l.node === s.node)
          );
        if (this.h.slotLabels.some((l: Label) => l.node.parent === s.node))
          return -1100;
        if (["上一位", "下一位", "切换初始天赋"].includes(s.node.name))
          return -960;
        return -s.y;
      };
      items.sort((a, b) => priority(a) - priority(b) || a.x - b.x);
      for (let i = 0; i < items.length; ) {
        const s = items[i],
          n = s.node;
        this.parent(n, p.content);
        const isButton = !!n.getChildByName("ControllerFocus");
        if (isButton) {
          const group = [s];
          let j = i + 1;
          while (
            j < items.length &&
            Math.abs(items[j].y - s.y) < 2 &&
            items[j].node.getChildByName("ControllerFocus")
          ) {
            group.push(items[j++]);
          }
          const short = group.every((v) => {
            const t = v.node.getChildByName("Label").getComponent(Label).string;
            return !t.includes("\n") && t.length <= 12;
          });
          const cols = short ? Math.min(group.length, flowW >= 600 ? 3 : 2) : 1,
            bw = (flowW - (cols - 1) * 8) / cols;
          for (let k = 0; k < group.length; k += cols) {
            const row = group.slice(k, k + cols),
              heights = row.map((v) => {
                this.parent(v.node, p.content);
                return this.button(v.node, bw);
              }),
              rh = Math.max(...heights);
            row.forEach((v, c) =>
              v.node.setPosition(
                -flowW / 2 + bw / 2 + c * (bw + 8),
                -height - rh / 2,
              ),
            );
            height += rh + 12;
          }
          i = j;
          continue;
        }
        const l = n.getComponent(Label);
        let rh = 0;
        if (l) {
          rh = this.label(n, flowW, s.node === this.h.title.node ? 26 : 18);
          if (this.h.kitLabels.some((l: Label) => l.node === n)) {
            rh = this.label(n, flowW - 46, 18);
            n.children
              .filter((c) => c.getComponent(Sprite))
              .forEach((c) => c.setPosition(-flowW / 2 + 12, 0));
          }
        } else if (n.getComponent(Sprite)) {
          rh = n === portrait ? 124 : 48;
          n.getComponent(UITransform).setContentSize(rh, rh);
        }
        n.setPosition(0, -height - rh / 2);
        height += rh + 12;
        i++;
      }
      p.content
        .getComponent(UITransform)
        .setContentSize(flowW, Math.max(viewportH, height));
    }
    if (p.fresh) p.scroll.scrollToTopLeft(0);
    else
      p.scroll.scrollToOffset(
        new Vec2(
          Math.max(0, previous.x),
          Math.min(Math.max(0, height - viewportH), Math.max(0, previous.y)),
        ),
        0,
      );
    p.fresh = false;
  }
  private battle() {
    const h = this.h,
      { w, height } = { w: this.safe.w, height: this.safe.h },
      landscape = w > height,
      cx = this.safe.x,
      cy = this.safe.y;
    const rootButton = (re: RegExp) =>
      this.originalRoot.find(
        (s) => re.test(s.node.name) && s.node.getChildByName("ControllerFocus"),
      )?.node;
    const place = (n: Node, x: number, y: number, width: number) => {
      if (!n) return;
      if (n === h.skillLabel.node.parent || n === h.ultimateLabel.node.parent) {
        const l = n.getChildByName("Label"),
          lh = this.label(l, width - 12, 16),
          bh = Math.max(88, lh + 40);
        l.setPosition(0, -14);
        n.getComponent(UITransform).setContentSize(width, bh);
        for (const icon of n.children.filter((c) => c.getComponent(Sprite))) {
          icon.setPosition(0, bh / 2 - 17);
          icon.getComponent(UITransform).setContentSize(24, 24);
        }
        this.box(n.getChildByName("Panel"), width, bh);
        this.box(n.getChildByName("ControllerFocus"), width + 4, bh + 4, true);
      } else this.button(n, width);
      n.setPosition(cx + x, cy + y);
    };
    const pause = rootButton(/^暂停/);
    pause.getChildByName("Label").getComponent(Label).string =
      h.session?.state === "paused" ? "继续" : "暂停";
    place(pause, -w / 2 + 44, height / 2 - 36, 64);
    place(
      this.h.routeButtonLabel.node.parent,
      w / 2 - 56,
      height / 2 - 36,
      100,
    );
    const hud = this.h.hud.node;
    this.label(hud, w - 188, 14);
    hud.setPosition(cx - 12, cy + height / 2 - 36);
    this.battleStats.node.active = !!h.session && !h.controllerScope();
    this.label(this.battleStats.node, w - 24, 14);
    this.battleStats.node.setPosition(cx, cy + height / 2 - 76);
    if (h.session) {
      const s = h.session,
        seconds = Math.floor(s.gameTime);
      this.battleStats.string = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}  ·  ${s.kills} 斩  ·  ${s.runCoins} 铜钱`;
    }
    const bottom = -height / 2 + 16;
    const dirs = [
      [/^↑$/, -w / 2 + 92, bottom + 146],
      [/^←$/, -w / 2 + 36, bottom + 82],
      [/^↓$/, -w / 2 + 92, bottom + 82],
      [/^→$/, -w / 2 + 148, bottom + 82],
    ] as any[];
    const controlsVisible = !!h.session && !h.controllerScope();
    for (const [re, x, y] of dirs) {
      const n = rootButton(re);
      n.active = controlsVisible && h.directionMode;
      place(n, x, y, 48);
    }
    h.joystick.setVisible(controlsVisible && !h.directionMode);
    h.joystick.node.setPosition(cx - w / 2 + 94, cy + bottom + 126);
    h.movementToggle.active = controlsVisible;
    place(h.movementToggle, -w / 2 + 94, bottom + 16, 156);
    place(h.skillLabel.node.parent, w / 2 - 72, bottom + 164, 120);
    place(h.ultimateLabel.node.parent, w / 2 - 72, bottom + 64, 120);
    place(
      h.interactLabel.node.parent,
      landscape ? 0 : 0,
      landscape ? bottom + 40 : bottom + 248,
      landscape ? Math.max(160, w - 392) : w - 32,
    );
    const field = battleViewport(w, height),
      top = field.top,
      bh = field.h,
      bw = field.w;
    h.battleRenderScale = battleRenderScale(w, height);
    h.battle.setPosition(cx, cy + field.y);
    h.battle.getComponent(UITransform).setContentSize(bw, bh);
    if (h.session) {
      h.session.canvas.width = bw / 0.525;
      h.session.canvas.height = bh / 0.525;
      h.session._updateCamera();
    }
    const mapPage = this.pages.find((p) => p.map);
    if (h.mapOpen) {
      this.parent(h.miniMap.node, mapPage.content);
      h.miniMap.node.setScale(1, 1, 1);
      h.miniMap.node.setPosition(-280, -650);
      this.parent(h.markers.node, mapPage.content);
      this.label(h.markers.node, 470, 18);
      h.markers.node.setPosition(80, -690);
      h.miniMap.node.active = true;
      h.markers.node.active = true;
    } else {
      this.parent(h.miniMap.node, h.node);
      h.miniMap.node.setScale(0.5, 0.5, 1);
      h.miniMap.node.setPosition(
        cx + bw / 2 - (landscape ? 180 : 40),
        cy + height / 2 - 166,
      );
      h.miniMap.node.active = !!h.session && !h.controllerScope();
      h.markers.node.active = false;
    }
    h.routeLabel.node.active = false;
    rootButton(/^收起 \/ 显示地图/).active = false;
    for (let i = 0; i < h.weaponIcons.length; i++) {
      h.weaponIcons[i].node.setPosition(
        cx - w / 2 + 24 + i * 32,
        cy + height / 2 - 140,
      );
      h.weaponLabels[i].node.active = false;
    }
    h.controlsHint.node.active = !!h.coachText && controlsVisible;
    this.label(
      h.controlsHint.node,
      landscape ? Math.max(120, w - 425) : w - 112,
      13,
    );
    h.controlsHint.node
      .getComponent(UITransform)
      .setContentSize(landscape ? Math.max(120, w - 425) : w - 112, 40);
    h.controlsHint.lineHeight = 18;
    h.controlsHint.node.setPosition(
      cx + (landscape ? -8 : -44),
      cy + height / 2 - (landscape ? 140 : 180),
    );
    this.status.node.active = !!h.session && !h.controllerScope();
    this.label(this.status.node, w - 24, 14);
    this.status.node.setPosition(cx, cy + height / 2 - 106);
    this.status.string = h.session
      ? h.routeLabel.string.split("\n").filter(Boolean).join(" · ")
      : "";
    h.padHint.node.setPosition(cx, cy + height / 2 - 8);
    h.padHint.fontSize = 10;
    h.fpsLabel.node.setPosition(cx + w / 2 - 32, cy + height / 2 - 10);
  }
  reveal(n: Node) {
    if (!n) return;
    const p = this.pages.find((p) => p.viewport.active && n.isChildOf(p.content));
    if (!p) return;
    const pos = n.position,
      ui = n.getComponent(UITransform),
      vh = p.viewport.getComponent(UITransform).height;
    const top = -pos.y - ui.height / 2,
      bottom = -pos.y + ui.height / 2,
      offset = p.scroll.getScrollOffset();
    if (top < offset.y) p.scroll.scrollToOffset(new Vec2(offset.x, top), 0);
    else if (bottom > offset.y + vh)
      p.scroll.scrollToOffset(new Vec2(offset.x, Math.max(0, bottom - vh)), 0);
  }
  readingStart(root: Node) {
    const p = this.pages.find((p) => p.root === root);
    if (!p) return;
    p.scroll.stopAutoScroll();
    p.fresh = true;
    p.signature = "";
  }
  followFocus(n: Node) {
    if (n !== this.focused) {
      this.focused = n;
      this.reveal(n);
    }
  }
  legacyButton(x: number, y: number): Node | null {
    const scope = this.h.controllerScope();
    const all = scope
      ? this.pages.find((p) => p.root === scope)?.originals || []
      : this.originalRoot;
    const buttons = all.filter(
      (s) =>
        s.node.activeInHierarchy && s.node.getChildByName("ControllerFocus"),
    );
    return (
      buttons.find(
        (s) =>
          s.node.activeInHierarchy &&
          s.node.getChildByName("ControllerFocus") &&
          Math.abs(s.x - x) < 2 &&
          Math.abs(s.y - y) < 2,
      )?.node ||
      buttons.find(
        (s) => Math.abs(s.x - x) <= s.w / 2 && Math.abs(s.y - y) <= s.h / 2,
      )?.node ||
      null
    );
  }
  snapshot() {
    return {
      compact: this.compact,
      movement: this.compact && !this.h.directionMode ? "joystick" : "buttons",
      joystick: this.h.joystick?.state.value,
      battleViewport: this.compact
        ? battleViewport(this.safe.w, this.safe.h)
        : null,
      battleRenderScale: this.h.battleRenderScale,
      width: this.width,
      height: this.height,
      safe: this.safe,
      pages: this.pages
        .filter((p) => p.root.activeInHierarchy)
        .map((p) => ({
          name: p.root.name,
          offset: p.scroll.getScrollOffset(),
          height: p.content.getComponent(UITransform).height,
        })),
    };
  }
}

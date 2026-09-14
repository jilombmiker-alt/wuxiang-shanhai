import {
  _decorator,
  Component,
  BlockInputEvents,
  Node,
  Label,
  Sprite,
  SpriteFrame,
  Texture2D,
  UITransform,
  Graphics,
  Color,
  input,
  Input,
  EventKeyboard,
  KeyCode,
  resources,
  JsonAsset,
  view,
  ResolutionPolicy,
  game,
  Game,
  profiler,
  Mask,
  sys,
  EventGamepad,
  EventTouch,
} from "cc";
import { TouchState } from "./TouchState";
import { CocosJoystick } from "./CocosJoystick";
import { PanelInk } from "./PanelInk";
import { CocosTerrain } from "./CocosTerrain";
import { CombatCoach, coachCopy } from "./CombatCoach";
import {
  heroKit,
  guidePages,
  difficultyIds,
  difficultyLabel,
  healthText,
  pauseLoadout,
  skillCooldownText,
} from "./MenuCopy";
import { ControllerState, neighbour, PadFrame } from "./ControllerState";
import { ResponsiveLayout, visualBattleView, contextInteractionVisible } from "./ResponsiveLayout";
import { CombatSession, CombatCore as C } from "./CombatSession";
import { GraphicsPainter } from "./GraphicsPainter";
import { hazardLabels, HazardRect } from "./HazardLabels";
import { incomingThreats } from "./IncomingThreats";
import { EnemyFeedback, renderEnemyHit } from "./EnemyFeedback";
import { CovenantStore } from "./CovenantStore";
import { ProfileStore } from "./ProfileStore";
import { BackupVault } from "./BackupVault";
import { BackupPanel } from "./BackupPanel";
import { CocosAudio } from "./CocosAudio";
import {
  SettingsStore,
  ACTIONS,
  ACTION_NAMES,
  SETTING_KEYS,
} from "./SettingsStore";
const { ccclass } = _decorator;

/** Cocos combat migration slice; complete browser product and saves remain separate. */
@ccclass("GameBoot")
export class GameBoot extends Component {
  private enemyFeedback = new EnemyFeedback();
  private enemyPose(e: any) {
    const ritual = "ritual-" + e.id + "-" + C.ritualActionFrame(e, this.reducedMotion());
    return { key: this.frames.has(ritual) ? ritual : `${this.session.stageId}-${C.enemyArchetypeSlot(e.type)}-${this.reducedMotion() ? 1 : (e.walkFrame ?? 1)}`,
      x: e.x, y: e.y, size: e.visualDiameter, facing: e.walkFacing === 1 ? -1 : 1 };
  }
  private observeEnemyFeedback(s: CombatSession) {
    this.enemyFeedback.observe(s, `${s.stageId}:${s.runMode}:${s.chapterRoute.current()?.id || ""}`,
      s.enemies, s.gameTime, this.reducedMotion(), e => this.enemyPose(e));
  }
  private frames = new Map<string, SpriteFrame>();
  private vault: BackupVault;
  private manager: BackupPanel;
  private sound: CocosAudio;
  private audioMinus: Node[] = [];
  private settings: SettingsStore;
  private settingsPanel: Node;
  private settingsButton: Node;
  private settingsTab = "display";
  private settingsPage = 0;
  private settingsRows: Label[] = [];
  private settingsActions: Label[] = [];
  private settingsTabs: Label[] = [];
  private settingsNav: Node[] = [];
  private lastSystemMotion = false;
  private settingsFooter: Label;
  private settingsReset: Label;
  private settingsMessage = "";
  private bindingAction: string | null = null;
  private resetSettingsConfirmed = false;
  private controlsHint: Label;
  private coach = new CombatCoach();
  private coachText = "";
  private controlsText = "";
  private routeButtonLabel: Label;
  private mapCloseLabel: Label;
  private fpsLabel: Label;
  private fpsTime = 0;
  private fpsFrames = 0;
  private keys = new Set<number>();
  private controller = new ControllerState();
  private responsive: ResponsiveLayout;
  private padDevices = new Map<number, EventGamepad["gamepad"]>();
  private padMove = { x: 0, y: 0 };
  private padScope: Node | null = null;
  private padFocus: Node | null = null;
  private padVisible = false;
  private padNotice = "";
  private padHint: Label;
  private padButtons: { node: Node; action: () => void; ring: Node }[] = [];
  private selected = 0;
  private talent = 0;
  private ready = false;
  private heroes: any[] = Object.values(C.HEROES);
  private session: CombatSession | null = null;
  private menu: Node;
  private editingNew = false;
  private menuChoices: Node[] = [];
  private kitLabels: Label[] = [];
  private kitIcons: Sprite[] = [];
  private cancelNew: Node;
  private guidePanel: Node;
  private guideTitle: Label;
  private guideBody: Label;
  private guidePage = 0;
  private guideBack: Node;
  private guidePause: Node;
  private overlay: Node;
  private battle: Node;
  /** Visual-only zoom; gameplay canvas and all combat coordinates stay fixed. */
  private battleRenderScale = 0.525;
  private terrain: CocosTerrain;
  private actors: Node;
  private ground: Graphics;
  private front: Graphics;
  private hazardInk: Graphics;
  private hazardTexts: Label[] = [];
  private dangerLayout: { session: CombatSession; key: string;
    annotations: (HazardRect & { text: string; fontSize: number })[] } | null = null;
  private title: Label;
  private detail: Label;
  private talentText: Label;
  private hud: Label;
  private build: Label;
  private skillLabel: Label;
  private ultimateLabel: Label;
  private overlayTitle: Label;
  private choiceButtons: Node[] = [];
  private choiceLabels: Label[] = [];
  private resumeButton: Node;
  private portrait: Sprite;
  private skillIcon: Sprite;
  private ultimateIcon: Sprite;
  private pauseDetail: Label;
  private choiceIcons: Sprite[] = [];
  private weaponIcons: Sprite[] = [];
  private weaponLabels: Label[] = [];
  private sprites: Node[] = [];
  private lastState = "";
  private mode = "chapter";
  private stageIndex = 0;
  private difficulty = "normal";
  private difficultyLabel: Label;
  private journeySummary: Label;
  private modeLabel: Label;
  private stageLabel: Label;
  private interactLabel: Label;
  private routeLabel: Label;
  private mapPanel: Node;
  private mapGraphics: Graphics;
  private mapLabels: Label[] = [];
  private mapOpen = false;
  private miniMap: Graphics;
  private markers: Label;
  private mapVisible = true;
  private worldTexts: Label[] = [];
  private touch = new TouchState();
  private directionButtons: { node: Node; x: number; y: number }[] = [];
  private joystick: CocosJoystick;
  private directionMode = false;
  private movementToggle: Node;
  private store: CovenantStore;
  private slot = 1;
  private slotLabels: Label[] = [];
  private startLabel: Label;
  private saveButton: Node;
  private exitLabel: Label;
  private notice: Label;
  private saveNotice: Label;
  private confirmNew = false;
  private newButton: Node;
  private profile: ProfileStore;
  private profilePanel: Node;
  private profileTitle: Label;
  private profileSummary: Label;
  private profileNotice: Label;
  private profileRows: Label[] = [];
  private profileIcons: Sprite[] = [];
  private profileActions: Node[] = [];
  private profileGroupButton: Node;
  private profilePageLabel: Label;
  private profileTab = "talents";
  private profilePage = 0;
  private profileGroup = 0;
  private profileEntries: any[] = [];
  private profileMessage = "";
  private detailsPanel: Node;
  private detailsTitle: Label;
  private detailsBody: Label;
  private detailsFooter: Label;
  private detailsIcon: Sprite;
  private detailsButton: Node;
  private detailsToggle: Label;
  private detailsClose: Label;
  private detailsPage = 0;
  private detailsExit: Label;
  private detailsItems = false;
  private detailsPinned = false;
  private detailsTabs: Label[] = [];
  private detailsNav: Node[] = [];

  async onLoad() {
    view.setDesignResolutionSize(960, 640, ResolutionPolicy.SHOW_ALL);
    profiler.hideStats();
    this.vault = new BackupVault(sys.localStorage);
    this.store = new CovenantStore(this.vault);
    this.profile = new ProfileStore(this.store.storage);
    this.settings = new SettingsStore(this.store.storage);
    this.battle = this.child("Battle");
    this.battle.addComponent(UITransform).setContentSize(630, 420);
    this.battle.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.terrain = new CocosTerrain(this.battle);
    this.ground = this.child("Ground", this.battle).addComponent(Graphics);
    this.actors = this.child("Actors", this.battle);
    this.front = this.child("Skill effects", this.battle).addComponent(
      Graphics,
    );
    this.hazardInk = this.child("Danger annotations", this.battle).addComponent(Graphics);
    this.miniMap = this.child("Local map").addComponent(Graphics);
    this.miniMap.node.setPosition(-390, 110);
    this.markers = this.label("", -390, -55, 13);
    this.markers.node.getComponent(UITransform).setContentSize(140, 230);
    this.markers.overflow = Label.Overflow.SHRINK;
    this.routeLabel = this.label("", 391, 95, 14);
    this.routeLabel.node.getComponent(UITransform).setContentSize(135, 200);
    this.routeLabel.overflow = Label.Overflow.SHRINK;
    const routeButton = this.button(
      "M 路线图",
      391,
      -55,
      () => this.toggleMap(),
      this.node,
      132,
      46,
    );
    this.routeButtonLabel = routeButton
      .getChildByName("Label")
      .getComponent(Label);
    this.button(
      "收起 / 显示地图",
      -390,
      196,
      () => {
        this.mapVisible = !this.mapVisible;
      },
      this.node,
      145,
      36,
    );
    const interact = this.button(
      "F 附近交互",
      0,
      -250,
      () => this.interact(),
      this.node,
      182,
    );
    this.interactLabel = interact.getChildByName("Label").getComponent(Label);
    this.interactLabel.fontSize = 15;
    this.hud = this.label("", 80, 273, 20);
    this.build = this.label("", 0, 235, 16);
    const skill = this.button("E 主动", 200, -250, () => this.session?.cast());
    this.skillLabel = skill.getChildByName("Label").getComponent(Label);
    const ult = this.button("Q 终极", 388, -250, () =>
      this.session?.cast(true),
    );
    this.ultimateLabel = ult.getChildByName("Label").getComponent(Label);
    this.skillIcon = this.icon(skill, -65, 0, 28);
    this.ultimateIcon = this.icon(ult, -65, 0, 28);
    for (const label of [this.skillLabel, this.ultimateLabel]) {
      label.fontSize = 16;
      label.lineHeight = 23;
      label.node.setPosition(16, 0);
    }
    for (let i = 0; i < 6; i++) {
      this.weaponIcons.push(this.icon(this.node, -432 + i * 146, 235, 24));
      this.weaponLabels.push(this.label("", -361 + i * 146, 235, 13));
    }
    this.button(
      "暂停 / 继续",
      -350,
      273,
      () => this.togglePause(),
      this.node,
      156,
    );
    this.controlsHint = this.label(
      "WASD 移动 · F 交互 · M 地图 · E / Q 技能 · Esc 暂停",
      0,
      -306,
      16,
    );
    for (const [text, x, y, dx, dy] of [
      ["↑", -290, -224, 0, -1],
      ["←", -354, -275, -1, 0],
      ["↓", -290, -275, 0, 1],
      ["→", -226, -275, 1, 0],
    ] as any[]) {
      const b = this.button(text, x, y, () => {}, this.node, 58, 46);
      this.directionButtons.push({ node: b, x: dx, y: dy });
      b.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
        if (this.canTouch(b) && this.session?.state === C.GameState.PLAYING)
          this.touch.beginMove(e.getID(), dx, dy);
      });
      b.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => {
        const target = this.directionButtons.find(
          ({ node }) =>
            this.canTouch(node) &&
            node.getComponent(UITransform).hitTest(e.getLocation(), e.windowId),
        );
        this.touch.move(e.getID(), target?.x || 0, target?.y || 0);
      });
      for (const event of [
        Node.EventType.TOUCH_END,
        Node.EventType.TOUCH_CANCEL,
      ])
        b.on(event, (e: EventTouch) => {
          this.touch.endMove(e.getID());
        });
    }
    this.menu = this.child("Selection");
    this.panel(this.menu, 900, 600);
    this.label("无相山海", 0, 244, 40, this.menu);
    this.label("邪潮 · A10.37 融合详值版", 0, 201, 17, this.menu);
    const actor = this.child("Portrait", this.menu);
    for (let i = 1; i <= 3; i++) {
      const b = this.button(
        "",
        (i - 2) * 274,
        158,
        () => {
          this.slot = i;
          this.editingNew = false;
          this.confirmNew = false;
          const saved = this.store.slots()[i - 1];
          if (saved) {
            this.selected = Math.max(
              0,
              this.heroes.findIndex((h) => h.id === saved.selectedHeroId),
            );
            this.talent = Math.max(
              0,
              this.heroes[this.selected].talents.findIndex(
                (t) => t.id === saved.selectedHeroTalentId,
              ),
            );
            this.mode = saved.runMode;
            this.stageIndex = Math.max(
              0,
              ["forest", "crypt", "tundra"].indexOf(saved.stageId),
            );
          }
          this.describe();
        },
        this.menu,
        258,
        46,
      );
      const l = b.getChildByName("Label").getComponent(Label);
      l.fontSize = 14;
      l.lineHeight = 18;
      l.node.getComponent(UITransform).setContentSize(246, 44);
      l.overflow = Label.Overflow.SHRINK;
      this.slotLabels.push(l);
    }
    actor.setPosition(-255, 32);
    actor.addComponent(UITransform).setContentSize(256, 256);
    this.portrait = actor.addComponent(Sprite);
    this.portrait.sizeMode = Sprite.SizeMode.CUSTOM;
    this.portrait.trim = false;
    this.title = this.label("正在载入已有像素素材…", 125, 112, 29, this.menu);
    this.detail = this.label("", 125, 62, 18, this.menu);
    this.talentText = this.label("", 125, -12, 17, this.menu);
    this.talentText.node.getComponent(UITransform).setContentSize(420, 90);
    this.talentText.overflow = Label.Overflow.SHRINK;
    this.menuChoices.push(
      this.button("上一位", -307, -131, () => this.cycle(-1), this.menu, 150),
    );
    this.menuChoices.push(
      this.button("下一位", -129, -131, () => this.cycle(1), this.menu, 150),
    );
    this.menuChoices.push(
      this.button(
        "切换初始天赋",
        152,
        -131,
        () => {
          if (this.ready) {
            this.talent = (this.talent + 1) % 3;
            this.describe();
          }
        },
        this.menu,
        240,
      ),
    );
    const modeButton = this.button(
      "",
      -198,
      -188,
      () => {
        this.mode = this.mode === "chapter" ? "endless" : "chapter";
        this.describe();
      },
      this.menu,
      340,
      38,
    );
    this.modeLabel = modeButton.getChildByName("Label").getComponent(Label);
    this.menuChoices.push(modeButton);
    const stageButton = this.button(
      "",
      198,
      -188,
      () => {
        this.stageIndex = (this.stageIndex + 1) % 3;
        this.describe();
      },
      this.menu,
      340,
      38,
    );
    this.stageLabel = stageButton.getChildByName("Label").getComponent(Label);
    this.menuChoices.push(stageButton);
    const difficultyButton = this.button(
      "切换难度",
      395,
      -131,
      () => {
        this.difficulty =
          difficultyIds[
            (difficultyIds.indexOf(this.difficulty) + 1) % difficultyIds.length
          ];
        this.describe();
      },
      this.menu,
      180,
    );
    this.difficultyLabel = difficultyButton
      .getChildByName("Label")
      .getComponent(Label);
    this.menuChoices.push(difficultyButton);
    this.journeySummary = this.label("", -255, -85, 15, this.menu);
    const startButton = this.button(
      "进入战斗",
      0,
      -244,
      () => this.startCombat(),
      this.menu,
      260,
      56,
    );
    this.startLabel = startButton.getChildByName("Label").getComponent(Label);
    this.newButton = this.button(
      "重新开始…",
      300,
      -244,
      () => {
        if (!this.confirmNew) {
          this.editingNew = true;
          this.describe();
          this.confirmNew = true;
          this.notice.string =
            "再次点击“确认覆盖”才会放弃当前命契；其余两份保留。";
          this.newButton.getChildByName("Label").getComponent(Label).string =
            "确认覆盖";
          return;
        }
        this.confirmNew = false;
        this.startCombat(true);
      },
      this.menu,
      210,
      48,
    );
    this.newButton.active = false;
    this.button(
      "命契管理",
      -300,
      -80,
      () => this.manager.open(),
      this.menu,
      180,
      42,
    );
    this.button(
      "设置",
      300,
      -80,
      () => this.openSettings(),
      this.menu,
      180,
      42,
    );
    this.button(
      "命府 · 等级 / 天赋 / 图鉴",
      0,
      -80,
      () => this.openProfile(),
      this.menu,
      360,
      42,
    );
    this.notice = this.label("", 0, -286, 14, this.menu);
    this.notice.node.getComponent(UITransform).setContentSize(830, 32);
    for (let i = 0; i < 3; i++) {
      const l = this.label("", 130, 45 - i * 34, 17, this.menu);
      this.kitLabels.push(l);
      this.kitIcons.push(this.icon(l.node, -190, 0, 24));
    }
    this.cancelNew = this.button(
      "取消新局配置",
      -320,
      -280,
      () => this.cancelNewRun(),
      this.menu,
      210,
    );
    this.button("操作指南", -320, -210, () => this.openGuide(), this.menu, 180);
    this.notice.overflow = Label.Overflow.SHRINK;
    this.overlay = this.child("Pause / Upgrade");
    this.panel(this.overlay, 870, 430);
    this.overlay.active = false;
    this.overlayTitle = this.label("", 0, 165, 26, this.overlay);
    this.pauseDetail = this.label("", 0, 30, 18, this.overlay);
    this.pauseDetail.node.getComponent(UITransform).setContentSize(780, 220);
    this.pauseDetail.overflow = Label.Overflow.SHRINK;
    for (let i = 0; i < 3; i++) {
      const b = this.button(
        "",
        0,
        85 - i * 70,
        () => {
          this.chooseOption(i);
        },
        this.overlay,
        790,
        58,
      );
      this.choiceButtons.push(b);
      this.choiceLabels.push(b.getChildByName("Label").getComponent(Label));
      this.choiceLabels[i].fontSize = 17;
      this.choiceIcons.push(this.icon(b, -361, 0, 36));
    }
    this.resumeButton = this.button(
      "继续战斗",
      -180,
      -163,
      () => this.closeOverlay(),
      this.overlay,
      210,
    );
    const exitButton = this.button(
      "保存并退出",
      180,
      -163,
      () => this.toMenu(),
      this.overlay,
      260,
    );
    this.exitLabel = exitButton.getChildByName("Label").getComponent(Label);
    this.saveButton = this.button(
      "保存命契",
      0,
      -111,
      () => {
        this.session?.saveCurrentCovenant();
        if (this.session) this.renderOverlay(this.session);
      },
      this.overlay,
      180,
      38,
    );
    this.detailsButton = this.button(
      "行囊 · 物品详情",
      290,
      -111,
      () => this.openDetails(),
      this.overlay,
      230,
      38,
    );
    this.settingsButton = this.button(
      "设置",
      -290,
      -111,
      () => this.openSettings(),
      this.overlay,
      200,
      38,
    );
    this.saveNotice = this.label("", 0, -204, 13, this.overlay);
    this.guidePause = this.button(
      "操作指南",
      0,
      -57,
      () => this.openGuide(),
      this.overlay,
      210,
      44,
    );
    this.mapPanel = this.child("Route map");
    this.panel(this.mapPanel, 870, 560);
    this.label("山海道途 · 当前房高亮", 0, 235, 26, this.mapPanel);
    this.label(
      "沿方向门前进；已清房可返回。地图打开时暂停。",
      0,
      -196,
      16,
      this.mapPanel,
    );
    this.mapGraphics = this.child("Connections", this.mapPanel).addComponent(
      Graphics,
    );
    for (let i = 0; i < 9; i++) {
      const l = this.label(
        "",
        ((i % 3) - 1) * 250,
        130 - Math.floor(i / 3) * 125,
        16,
        this.mapPanel,
      );
      l.node.getComponent(UITransform).setContentSize(218, 88);
      l.overflow = Label.Overflow.SHRINK;
      this.mapLabels.push(l);
    }
    const mapClose = this.button(
      "关闭地图 · M / Esc",
      0,
      -246,
      () => this.toggleMap(),
      this.mapPanel,
      250,
      44,
    );
    this.mapCloseLabel = mapClose.getChildByName("Label").getComponent(Label);
    this.mapPanel.active = false;
    this.buildProfilePanel();
    this.buildDetailsPanel();
    this.buildSettingsPanel();
    this.buildGuide();
    this.manager = new BackupPanel(this);
    this.fpsLabel = this.label("", 398, 305, 12);
    this.padHint = this.label("", 0, 310, 12);
    this.sound = new CocosAudio(this.node);
    void this.sound.load();
    this.applySettings();
    this.joystick = new CocosJoystick(this);
    this.movementToggle = this.button(
      "使用方向键",
      -290,
      -172,
      () => {
        this.clearInput();
        this.directionMode = !this.directionMode;
        this.movementToggle.getChildByName("Label").getComponent(Label).string =
          this.directionMode ? "使用摇杆" : "使用方向键";
      },
      this.node,
      156,
      48,
    );
    this.movementToggle.active = false;
    this.responsive = new ResponsiveLayout(this);
    input.on(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.on(Input.EventType.KEY_UP, this.keyUp, this);
    input.on(Input.EventType.GAMEPAD_CHANGE, this.gamepadEvent, this);
    input.on(Input.EventType.GAMEPAD_INPUT, this.gamepadEvent, this);
    game.on(Game.EVENT_HIDE, this.hide, this);
    (globalThis as any).__cocosCheck = () => ({
      ready: this.ready,
      resources: this.frames.size,
      selection: this.heroes[this.selected].id,
      selectedTalent: this.heroes[this.selected].talents[this.talent].id,
      menu: this.menu.active,
      editingNew: this.editingNew,
      guideOpen: this.guidePanel.active,
      guideText: this.guidePanel.active ? this.guideBody.string : null,
      mode: this.mode,
      stage: ["forest", "crypt", "tundra"][this.stageIndex],
      mapOpen: this.mapOpen,
      slot: this.slot,
      slots: this.store.slots().map((v: any) => C.covenantSummary(v)),
      saveHealth: this.store.health(),
      profileOpen: this.profilePanel.active,
      profileTab: this.profileTab,
      profilePage: this.profilePage,
      profileGroup: C.COLLECTION_KINDS[this.profileGroup],
      profile: JSON.parse(JSON.stringify(this.profile.data)),
      profileHealth: this.profile.code,
      detailsOpen: this.detailsPanel.active,
      detailsNumbers:
        this.detailsPinned ||
        this.keys.has(KeyCode.SHIFT_LEFT) ||
        this.keys.has(KeyCode.SHIFT_RIGHT),
      detailsPage: this.detailsPage,
      detailsText: this.detailsPanel.active ? this.detailsBody.string : null,
      settingsOpen: this.settingsPanel.active,
      managerOpen: this.manager.node.active,
      managerPending: this.manager.pending?.kind || null,
      managerMessage: this.manager.message,
      vaultHealth: this.vault.code,
      settings: JSON.parse(JSON.stringify(this.settings.data)),
      settingsHealth: this.settings.code,
      settingsMessage: this.settingsMessage,
      bindingAction: this.bindingAction,
      controller: {
        id: this.controller.id,
        blocked: this.controller.blocked,
        scope: this.padScope?.name || "battle",
        focus:
          this.padFocus?.getChildByName("Label")?.getComponent(Label)?.string ||
          null,
        focusName: this.padFocus?.name || null,
        notice: this.padNotice,
      },
      audio: this.sound.snapshot(),
      layout: this.responsive.snapshot(),
      terrain: this.terrain.snapshot(),
      reducedMotion: this.reducedMotion(),
      engine: "3.8.8",
      session: this.session?.snapshot() || null,
    });
    try {
      for (const group of ["heroes", "enemies", "icons", "world"]) {
        const manifest: any = await this.load(`${group}/manifest`, JsonAsset);
        await Promise.all(
          manifest.json.files.map(async (file: any) => {
            const name = file.filename.replace(/\.png$/, "");
            const texture: any = await this.load(
              `${group}/${name}/texture`,
              Texture2D,
            );
            texture.setFilters(
              Texture2D.Filter.NEAREST,
              Texture2D.Filter.NEAREST,
            );
            const frame = new SpriteFrame();
            frame.texture = texture;
            this.frames.set(name, frame);
          }),
        );
      }
      if (this.frames.size !== 194)
        throw new Error("英雄、邪物与技能图标未完整加载");
      this.ready = true;
      this.describe();
      void this.terrain.load().then(() => {
        if (
          this.isValid &&
          this.menu.active &&
          this.terrain.status === "unavailable"
        )
          this.detail.string +=
            "\n地面素材不可用：已回退基础地面，可继续游玩。";
      });
    } catch (error) {
      this.title.string = "素材加载失败";
      this.detail.string = "请刷新重试；原版不受影响。";
      console.error(error);
    }
  }
  private reloadDataStores() {
    this.store = new CovenantStore(this.vault);
    this.profile = new ProfileStore(this.store.storage);
    this.settings = new SettingsStore(this.store.storage);
    this.applySettings();
    this.describe();
  }
  private keyName(action: string) {
    return String.fromCharCode(this.settings.data.bindings[action]);
  }
  private buildGuide() {
    this.guidePanel = this.child("操作指南");
    this.panel(this.guidePanel, 870, 560);
    this.guideTitle = this.label("操作指南", 0, 226, 28, this.guidePanel);
    this.guideBody = this.label("", 0, 25, 20, this.guidePanel);
    this.guideBody.node.getComponent(UITransform).setContentSize(760, 330);
    this.guideBody.overflow = Label.Overflow.CLAMP;
    this.guideBody.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.button(
      "上一页",
      -260,
      -210,
      () => this.turnGuide(-1),
      this.guidePanel,
      180,
    );
    this.button(
      "下一页",
      260,
      -210,
      () => this.turnGuide(1),
      this.guidePanel,
      180,
    );
    this.guideBack = this.button(
      "返回",
      0,
      -210,
      () => this.closeGuide(),
      this.guidePanel,
      180,
    );
    this.guidePanel.active = false;
  }
  private openGuide() {
    if (!this.ready) return;
    if (this.session && this.session.state !== C.GameState.PAUSED) return;
    this.clearInput();
    this.guidePage = 0;
    this.guidePanel.active = true;
    this.turnGuide(0);
  }
  private turnGuide(delta: number) {
    const keys = Object.fromEntries(
      Object.keys(this.settings.data.bindings).map((k) => [k, this.keyName(k)]),
    );
    const current = this.menu.active ? null : this.session;
    const pages = guidePages(
      keys,
      current?.runMode || this.mode,
      current?.stageId || ["forest", "crypt", "tundra"][this.stageIndex],
      current?.save.settings.difficulty || this.difficulty,
    );
    this.guidePage = (this.guidePage + delta + pages.length) % pages.length;
    this.guideTitle.string = `${pages[this.guidePage].title} · ${this.guidePage + 1} / ${pages.length}`;
    this.guideBody.string = pages[this.guidePage].text;
    this.responsive?.readingStart(this.guidePanel);
  }
  private closeGuide() {
    this.guidePanel.active = false;
    this.clearInput();
  }
  private cancelNewRun() {
    this.editingNew = false;
    this.confirmNew = false;
    this.clearInput();
    this.describe();
  }
  private reducedMotion() {
    return this.settings.data.reducedMotion || C.heroPrefersReducedMotion();
  }
  private applySettings() {
    this.coach = new CombatCoach(this.settings.data.hintHistory);
    this.coachText = "";
    this.sound?.mixer.configure(this.settings.data.audio);
    if (this.session)
      Object.assign(this.session.save.settings, this.settings.data, {
        criticalFlash: false,
        difficulty: this.session.save.settings.difficulty,
      });
    this.clearInput();
    this.controlsText = `${["up", "left", "down", "right"].map((a) => this.keyName(a)).join("")} / 方向键移动 · ${this.keyName("interact")} 交互 · ${this.keyName("map")} 地图 · ${this.keyName("skill")} / ${this.keyName("ultimate")} 技能 · Esc 暂停`;
    this.controlsHint.string = this.controlsText;
    this.routeButtonLabel.string = this.keyName("map") + " 路线图";
    this.mapCloseLabel.string = "关闭地图 · " + this.keyName("map") + " / Esc";
    this.fpsLabel.node.active = this.settings.data.showFPS;
  }
  private buildSettingsPanel() {
    this.settingsPanel = this.child("设置");
    this.settingsPanel.addComponent(UITransform).setContentSize(960, 640);
    this.settingsPanel.addComponent(BlockInputEvents);
    this.panel(this.settingsPanel, 960, 640);
    this.label("设置 · 显示、声音与操作", 0, 252, 28, this.settingsPanel);
    for (const [name, id, x] of [
      ["显示与反馈", "display", -280],
      ["声音", "audio", 0],
      ["键盘操作", "keys", 280],
    ] as any[]) {
      const b = this.button(
        name,
        x,
        194,
        () => {
          this.settingsTab = id;
          this.settingsPage = 0;
          this.bindingAction = null;
          this.resetSettingsConfirmed = false;
          this.renderSettings();
        },
        this.settingsPanel,
        250,
        44,
      );
      this.settingsTabs.push(b.getChildByName("Label").getComponent(Label));
    }
    for (let i = 0; i < 4; i++) {
      const y = 116 - i * 80,
        l = this.label("", -96, y, 18, this.settingsPanel);
      l.node.getComponent(UITransform).setContentSize(560, 64);
      l.horizontalAlign = Label.HorizontalAlign.LEFT;
      l.overflow = Label.Overflow.SHRINK;
      this.settingsRows.push(l);
      const b = this.button(
        "",
        315,
        y,
        () => this.changeSetting(i),
        this.settingsPanel,
        160,
        48,
      );
      this.settingsActions.push(b.getChildByName("Label").getComponent(Label));
      this.audioMinus.push(
        this.button(
          "减少",
          175,
          y,
          () => {
            this.settingResult(
              this.settings.sound(["muted", "master", "sfx", "music"][i], -20),
            );
            this.renderSettings();
          },
          this.settingsPanel,
          64,
          48,
        ),
      );
    }
    this.settingsFooter = this.label("", 0, -180, 14, this.settingsPanel);
    this.settingsFooter.node.getComponent(UITransform).setContentSize(800, 44);
    this.settingsFooter.overflow = Label.Overflow.SHRINK;
    const previous = this.button(
      "上一页",
      -310,
      -224,
      () => {
        if (this.settingsTab === "audio") {
          this.sound.mixer.gesture();
          const played = this.sound.mixer.play("bossWarn", true);
          this.settingsMessage = played
            ? "试听首领预警。实际音量还受系统音量与输出设备影响。"
            : "未播放：请检查静音、总音量、音效音量或音频加载状态。";
          this.renderSettings();
          return;
        }
        this.settingsPage = 0;
        this.bindingAction = null;
        this.renderSettings();
      },
      this.settingsPanel,
      180,
      40,
    );
    const reset = this.button(
      "恢复默认",
      0,
      -224,
      () => {
        if (!this.resetSettingsConfirmed) {
          this.resetSettingsConfirmed = true;
          this.settingsMessage = "再次点击恢复默认；不会删除命契或局外进度。";
        } else {
          this.resetSettingsConfirmed = false;
          this.settingResult(this.settings.reset());
        }
        this.renderSettings();
      },
      this.settingsPanel,
      260,
      40,
    );
    this.settingsReset = reset.getChildByName("Label").getComponent(Label);
    const next = this.button(
      "下一页",
      310,
      -224,
      () => {
        if (this.settingsTab !== "audio") this.settingsPage = 1;
        this.bindingAction = null;
        this.renderSettings();
      },
      this.settingsPanel,
      180,
      40,
    );
    this.settingsNav = [previous, next];
    this.button(
      "返回 · Esc",
      -175,
      -273,
      () => this.closeSettings(),
      this.settingsPanel,
      300,
      40,
    );
    this.button(
      "重读本地设置",
      175,
      -273,
      () => {
        this.bindingAction = null;
        this.resetSettingsConfirmed = false;
        const ok = this.settings.reload();
        if (ok) this.applySettings();
        this.settingsMessage = ok
          ? "已重新读取本地设置。"
          : "读取失败：保留当前设置，未覆盖原记录。";
        this.renderSettings();
      },
      this.settingsPanel,
      300,
      40,
    );
    this.settingsPanel.active = false;
  }
  private openSettings() {
    if (this.detailsPanel.active || this.profilePanel.active || this.mapOpen)
      return;
    this.session?.pause();
    this.sound.mixer.mode(false);
    this.sound.mixer.stopEffects();
    this.clearInput();
    this.settingsTab = "display";
    this.settingsPage = 0;
    this.bindingAction = null;
    this.resetSettingsConfirmed = false;
    this.settingsMessage = "";
    this.settingsPanel.active = true;
    this.overlay.active = false;
    this.renderSettings();
  }
  private closeSettings() {
    this.sound.mixer.stopEffects();
    this.settingsPanel.active = false;
    this.bindingAction = null;
    this.resetSettingsConfirmed = false;
    this.clearInput();
    if (this.session) this.renderOverlay(this.session);
  }
  private settingResult(ok: boolean) {
    if (ok) this.applySettings();
    this.settingsMessage = ok
      ? "已保存并应用；不改变本局战斗数值。"
      : "保存失败，新设置未生效。原设置保留，请重试或返回。";
  }
  private changeSetting(i: number) {
    this.resetSettingsConfirmed = false;
    if (this.settingsTab === "keys") {
      this.bindingAction = ACTIONS[this.settingsPage * 4 + i];
      this.settingsMessage =
        "请按 A–Z 中的一个字母；Esc 取消，重复键会被拒绝。";
    } else if (this.settingsTab === "audio") {
      this.settingResult(
        this.settings.sound(["muted", "master", "sfx", "music"][i]),
      );
    } else if (this.settingsPage === 1 && i === 1) {
      this.settingResult(this.settings.rememberHints([]));
    } else
      this.settingResult(
        this.settings.toggle(SETTING_KEYS[this.settingsPage * 4 + i]),
      );
    this.renderSettings();
  }
  private renderSettings() {
    this.settingsNav[0].active =
      (this.settingsTab !== "audio" && this.settingsPage === 1) ||
      this.settingsTab === "audio";
    this.settingsNav[0].getChildByName("Label").getComponent(Label).string =
      this.settingsTab === "audio" ? "试听预警" : "上一页";
    this.settingsNav[1].active =
      this.settingsTab !== "audio" && this.settingsPage === 0;
    const names = [
        "减少动效",
        "伤害数字",
        "轮廓辅助",
        "显示 FPS",
        "战场操作提示",
        "重新显示提示",
      ],
      copy = [
        "固定角色与邪物姿态，保留真实危险范围。",
        "显示伤害和恢复数值；关闭不影响实际效果。",
        "为人物与敌人标记稳定边缘，不使用闪白。",
        "每秒更新实际渲染帧率，非原生性能认证。",
        "按当前情境简短提示，不暂停、不遮挡操作。",
        "清除已读提示记录；不改变命契、物品或成长。",
      ];
    this.settingsTabs.forEach(
      (l, i) =>
        (l.color = new Color(
          ["display", "audio", "keys"][i] === this.settingsTab
            ? "#eed493"
            : "#c9d4c2",
        )),
    );
    for (let i = 0; i < 4; i++) {
      const isAudio = this.settingsTab === "audio";
      const displayIndex = this.settingsPage * 4 + i;
      const visible =
        this.settingsTab !== "display" || displayIndex < names.length;
      this.settingsRows[i].node.active = visible;
      this.settingsActions[i].node.parent.active = visible;
      this.audioMinus[i].active = isAudio && i > 0;
      this.settingsRows[i].node
        .getComponent(UITransform)
        .setContentSize(isAudio ? 460 : 560, 64);
      if (this.settingsTab === "keys") {
        const index = this.settingsPage * 4 + i,
          action = ACTIONS[index];
        this.settingsRows[i].string =
          ACTION_NAMES[index] + "\n当前按键 " + this.keyName(action);
        this.settingsActions[i].string =
          this.bindingAction === action ? "等待按键…" : "更改";
      } else if (isAudio) {
        const a = this.settings.data.audio,
          key = ["muted", "master", "sfx", "music"][i];
        this.settingsRows[i].string = [
          "全部静音\n保留音量值，取消静音后恢复。",
          `总音量 ${a.master}%\n共同控制音效与音乐。`,
          `音效 ${a.sfx}%\n武器、受击、拾取和首领预警。`,
          `音乐 ${a.music}%\n0% 关闭；仅战斗中循环。`,
        ][i];
        this.settingsActions[i].string =
          i === 0
            ? a.muted
              ? "已静音"
              : "声音开启"
            : a[key] === 100
              ? "已最大"
              : "增加";
      } else {
        this.settingsRows[i].string = visible
          ? names[displayIndex] + "\n" + copy[displayIndex]
          : "";
        this.settingsActions[i].string =
          displayIndex === 5
            ? "重新提示"
            : this.settings.data[SETTING_KEYS[displayIndex]]
              ? "已开启"
              : "已关闭";
      }
    }
    this.settingsFooter.string =
      this.settingsMessage ||
      (!["ok", "recovered"].includes(this.settings.code)
        ? "设置读取异常，使用页内配置；可重读本地，不会清空命契。"
        : this.settingsTab === "audio"
          ? this.sound.status === "ready"
            ? "声音就绪 · 暂停/后台停音；试听不会恢复战斗。"
            : this.sound.status === "loading"
              ? "音频加载中；不阻止游玩。稍后重新进入此页查看。"
              : "音频加载失败，当前静音游玩；刷新可重试，存档不受影响。"
          : this.settingsTab === "keys"
            ? `第 ${this.settingsPage + 1} / 2 页 · Esc 暂停 / 返回，Shift 详值、1–3 选择和方向键保留。`
            : C.heroPrefersReducedMotion()
              ? "系统已启用减少动效，优先于游戏开关；返回后仍保持暂停。"
              : `显示第 ${this.settingsPage + 1} / 2 页 · 提示可关闭，返回后仍保持暂停。`);
    this.settingsFooter.color = new Color(
      this.settings.code === "write-failed" ? "#edaa92" : "#c9d4c2",
    );
    if (C.heroPrefersReducedMotion())
      this.settingsFooter.string += "\n系统减少动效已开启，优先于游戏开关。";
    this.settingsReset.string = this.resetSettingsConfirmed
      ? "确认恢复默认"
      : "恢复默认";
  }
  private buildDetailsPanel() {
    this.detailsPanel = this.child("行囊详情");
    this.detailsPanel.addComponent(UITransform).setContentSize(960, 640);
    this.detailsPanel.addComponent(BlockInputEvents);
    this.panel(this.detailsPanel, 900, 590);
    this.label("行囊 · 外界时间静止", 0, 252, 28, this.detailsPanel);
    const attributesTab = this.button(
      "人物属性",
      -235,
      202,
      () => {
        this.detailsItems = false;
        this.detailsPage = 0;
        this.renderDetails();
      },
      this.detailsPanel,
      230,
      42,
    );
    const itemsTab = this.button(
      "功法 / 装备 / 天赋",
      120,
      202,
      () => {
        this.detailsItems = true;
        this.detailsPage = 0;
        this.renderDetails();
      },
      this.detailsPanel,
      360,
      42,
    );
    this.detailsTabs = [attributesTab, itemsTab].map((n) =>
      n.getChildByName("Label").getComponent(Label),
    );
    this.detailsTitle = this.label("", 25, 153, 22, this.detailsPanel);
    this.detailsTitle.node.getComponent(UITransform).setContentSize(720, 40);
    this.detailsTitle.overflow = Label.Overflow.SHRINK;
    this.detailsIcon = this.icon(this.detailsPanel, -390, 153, 44);
    this.detailsBody = this.label("", 0, -15, 18, this.detailsPanel);
    this.detailsBody.node.getComponent(UITransform).setContentSize(760, 292);
    this.detailsBody.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.detailsBody.lineHeight = 29;
    this.detailsBody.overflow = Label.Overflow.SHRINK;
    this.detailsFooter = this.label("", 0, -188, 14, this.detailsPanel);
    const previous = this.button(
      "上一项",
      -305,
      -224,
      () => this.turnDetails(-1),
      this.detailsPanel,
      180,
      40,
    );
    const toggle = this.button(
      "",
      0,
      -224,
      () => {
        this.detailsPinned = !this.detailsPinned;
        this.renderDetails();
      },
      this.detailsPanel,
      350,
      40,
    );
    this.detailsToggle = toggle.getChildByName("Label").getComponent(Label);
    const next = this.button(
      "下一项",
      305,
      -224,
      () => this.turnDetails(1),
      this.detailsPanel,
      180,
      40,
    );
    this.detailsNav = [previous, next];
    const close = this.button(
      "返回暂停 · Esc",
      -175,
      -273,
      () => this.closeDetails(),
      this.detailsPanel,
      300,
      40,
    );
    this.detailsClose = close.getChildByName("Label").getComponent(Label);
    const detailsExit = this.button(
      "保存并返回菜单",
      175,
      -273,
      () => {
        this.closeDetails();
        this.toMenu();
      },
      this.detailsPanel,
      300,
      40,
    );
    this.detailsExit = detailsExit.getChildByName("Label").getComponent(Label);
    this.detailsPanel.active = false;
  }
  private openDetails() {
    const s = this.session;
    if (!s || ![C.GameState.PAUSED, C.GameState.BUILD_CHOICE, C.GameState.GAMEOVER].includes(s.state))
      return;
    this.detailsItems = false;
    this.detailsPage = 0;
    this.detailsPinned = false;
    this.clearInput();
    this.detailsPanel.active = true;
    this.overlay.active = false;
    this.renderDetails();
  }
  private closeDetails() {
    this.detailsPanel.active = false;
    this.detailsPinned = false;
    this.clearInput();
    if (this.session) this.renderOverlay(this.session);
  }
  private detailsModel() {
    const s = this.session;
    if (!s) return { attributes: [], cards: [] };
    (s.save as any).collection = this.profile.data.collection;
    const model = C.buildPauseCodex(s);
    for (const id of s.runMetaTalents || []) {
      const def = C.META_TALENTS[id];
      if (def)
        model.cards.push({
          category: "局外天赋",
          artId: s.player.heroId,
          artKind: "hero",
          name: def.name,
          level: "本局开局装配",
          lore: "命府留下的前尘，随行者带入这一场试炼。",
          effect: `${def.branch}路线天赋；本局保持开局时的效果，不随命府后续装配改变。`,
          attackMode:
            "被动生效；复起次数等消耗以人物当前属性为准，不会读档补回。",
          numbers: def.description,
        });
    }
    return model;
  }
  private turnDetails(direction: number) {
    if (!this.detailsItems) return;
    const count = this.detailsModel().cards.length;
    if (count)
      this.detailsPage = (this.detailsPage + direction + count) % count;
    this.renderDetails();
  }
  private renderDetails() {
    if (!this.detailsPanel?.active || !this.session) return;
    const model = this.detailsModel(),
      numbers =
        this.detailsPinned ||
        this.keys.has(KeyCode.SHIFT_LEFT) ||
        this.keys.has(KeyCode.SHIFT_RIGHT);
    this.detailsExit.string = this.session.state === C.GameState.GAMEOVER ? "返回菜单" : "保存并返回菜单";
    this.detailsToggle.string = numbers
      ? "详值已展开 · 点击切换"
      : "按住 Shift / 点击查看详值";
    this.detailsTabs.forEach(
      (label, index) =>
        (label.color = new Color(
          (index === 1) === this.detailsItems ? "#eed493" : "#c9d4c2",
        )),
    );
    this.detailsNav.forEach(
      (node) => (node.active = this.detailsItems && model.cards.length > 1),
    );
    this.detailsClose.string =
      this.session.state === C.GameState.GAMEOVER
        ? "返回结算 · Esc"
        : this.session.state === C.GameState.BUILD_CHOICE
        ? "返回抉择 · Esc"
        : "返回暂停 · Esc";
    this.detailsIcon.node.active = false;
    if (!this.detailsItems) {
      this.detailsTitle.string = "人物属性 · 当前构筑";
      this.detailsBody.string = model.attributes
        .map((a: any) => a.name + " · " + (numbers ? a.numbers : a.summary))
        .join("\n");
      this.detailsFooter.string =
        "物品页包含当前持有的武器、功法、遗物、诅咒与融合。";
      return;
    }
    this.detailsPage = Math.min(
      this.detailsPage,
      Math.max(0, model.cards.length - 1),
    );
    const item = model.cards[this.detailsPage];
    if (!item) {
      this.detailsTitle.string = "尚无记录";
      this.detailsBody.string = "探索与成长后，已获得的物品会在这里显示。";
      return;
    }
    this.detailsTitle.string = item.category + " · " + item.name;
    this.detailsBody.string = numbers
      ? `具体数值\n${item.numbers || "无独立数值"}\n\n攻击 / 生效方式\n${item.attackMode || "被动生效"}`
      : `世界背景\n${item.lore || "来历尚待探索"}\n\n作用功效\n${item.effect || "见当前属性"}\n\n攻击 / 生效方式\n${item.attackMode || "被动生效"}`;
    this.detailsIcon.spriteFrame =
      item.artKind === "hero"
        ? this.frames.get(item.artId + "-walk-1")
        : this.frames.get(item.artKind + "-" + item.artId);
    this.detailsIcon.node.active = !!this.detailsIcon.spriteFrame;
    this.detailsFooter.string = `${this.detailsPage + 1} / ${model.cards.length} · ${item.level || ""} · ← / → 切换物品`;
  }
  private buildProfilePanel() {
    this.profilePanel = this.child("命府");
    this.panel(this.profilePanel, 900, 590);
    this.profileTitle = this.label(
      "命府 · 三命契共享",
      0,
      254,
      28,
      this.profilePanel,
    );
    this.profileSummary = this.label("", 0, 207, 18, this.profilePanel);
    this.button(
      "局外天赋",
      -260,
      153,
      () => {
        this.profileTab = "talents";
        this.profilePage = 0;
        this.profileMessage = "";
        this.renderProfile();
      },
      this.profilePanel,
      180,
      44,
    );
    this.button(
      "图鉴与融合",
      -50,
      153,
      () => {
        this.profileTab = "codex";
        this.profilePage = 0;
        this.profileMessage = "";
        this.renderProfile();
      },
      this.profilePanel,
      180,
      44,
    );
    this.profileGroupButton = this.button(
      "",
      240,
      153,
      () => {
        this.profileGroup = (this.profileGroup + 1) % C.COLLECTION_KINDS.length;
        this.profilePage = 0;
        this.renderProfile();
      },
      this.profilePanel,
      290,
      44,
    );
    for (let i = 0; i < 3; i++) {
      const y = 65 - i * 91,
        icon = this.child("Catalogue icon", this.profilePanel);
      icon.setPosition(-380, y);
      icon.addComponent(UITransform).setContentSize(48, 48);
      this.profileIcons.push(icon.addComponent(Sprite));
      const row = this.label("", -88, y, 16, this.profilePanel);
      row.node.getComponent(UITransform).setContentSize(525, 82);
      row.overflow = Label.Overflow.SHRINK;
      row.horizontalAlign = Label.HorizontalAlign.LEFT;
      row.lineHeight = 23;
      this.profileRows.push(row);
      this.profileActions.push(
        this.button(
          "",
          300,
          y,
          () => this.actProfile(i),
          this.profilePanel,
          190,
          48,
        ),
      );
    }
    this.button(
      "上一页",
      -300,
      -206,
      () => this.turnProfile(-1),
      this.profilePanel,
      180,
      44,
    );
    this.profilePageLabel = this.label("", 0, -206, 16, this.profilePanel);
    this.button(
      "下一页",
      300,
      -206,
      () => this.turnProfile(1),
      this.profilePanel,
      180,
      44,
    );
    this.profileNotice = this.label("", 0, -238, 14, this.profilePanel);
    this.profileNotice.node.getComponent(UITransform).setContentSize(820, 25);
    this.profileNotice.overflow = Label.Overflow.SHRINK;
    this.button(
      "返回选人 · Esc",
      -155,
      -273,
      () => this.closeProfile(),
      this.profilePanel,
      260,
      40,
    );
    this.button(
      "重读本地记录",
      155,
      -273,
      () => {
        this.profile.reload();
        this.profileMessage = "";
        this.renderProfile();
      },
      this.profilePanel,
      260,
      40,
    );
    this.profilePanel.active = false;
  }
  private openProfile() {
    if (!this.ready || !this.menu.active) return;
    this.menu.active = false;
    this.profilePanel.active = true;
    this.profileMessage = "";
    this.renderProfile();
    this.clearInput();
  }
  private closeProfile() {
    this.profilePanel.active = false;
    this.menu.active = true;
    this.clearInput();
    this.describe();
  }
  private turnProfile(direction: number) {
    const pages = Math.max(
      1,
      Math.ceil(
        this.profileEntries.length / (this.profileTab === "talents" ? 3 : 1),
      ),
    );
    this.profilePage = (this.profilePage + direction + pages) % pages;
    this.renderProfile();
  }
  private actProfile(index: number) {
    if (this.profileTab !== "talents") return;
    const def = this.profileEntries[this.profilePage * 3 + index];
    if (!def) return;
    const owned = this.profile.data.meta.purchasedTalents.includes(def.id),
      result = this.profile.talent(def.id);
    const errors = {
      storage: "保存失败，未扣命砂或更改装备；请重试。",
      locked: "尚未达到该天赋的解锁等级。",
      currency: "命砂不足，继续试炼积累。",
      slots: "最多装备 3 个天赋，请先卸下一个。",
      unowned: "请先购买天赋。",
    };
    this.profileMessage = result.ok
      ? owned
        ? result.equipped
          ? "已装备，下次新局生效。"
          : "已卸下，下次新局生效。"
        : "已购买；再点“装备”才会用于新局。"
      : errors[result.reason] || "操作未完成。";
    this.renderProfile();
  }
  private renderProfile() {
    const meta = this.profile.data.meta,
      talents = this.profileTab === "talents";
    const pageSize = talents ? 3 : 1;
    const names = {
      heroes: "行者",
      monsters: "邪物",
      weapons: "武器",
      passives: "功法",
      relics: "遗物",
      curses: "诅咒",
      fusions: "融合",
      reactions: "反应",
      events: "事件",
    };
    const group = C.COLLECTION_KINDS[this.profileGroup];
    this.profileTitle.string = talents
      ? "命府 · 局外天赋"
      : "山海图鉴 · 三命契共享";
    this.profileSummary.string = `等级 ${meta.level} / ${C.META_LEVEL_CAP} · 阅历 ${meta.xp} / ${C.metaXpForNext(meta.level)} · 命砂 ${meta.currency} · 天赋 ${meta.equippedTalents.length} / 3`;
    this.profileGroupButton.active = !talents;
    this.profileGroupButton.getChildByName("Label").getComponent(Label).string =
      "切换分类：" + names[group];
    this.profileEntries = talents
      ? Object.values(C.META_TALENTS)
      : C.collectionView(this.profile.data).find((g: any) => g.kind === group)
          .entries;
    this.profilePage = Math.min(
      this.profilePage,
      Math.max(0, Math.ceil(this.profileEntries.length / pageSize) - 1),
    );
    this.profilePageLabel.string = `${this.profilePage + 1} / ${Math.max(1, Math.ceil(this.profileEntries.length / pageSize))} · ← / → 翻页`;
    const icons = {
      tempered_body: "passive-max_hp",
      spirit_purse: "relic-coin_sword_tassel",
      paper_rebirth: "relic-paper_heart",
      warding_bone: "passive-armor",
      blood_contract: "passive-hungry_soul",
      echo_weapon: "weapon-whip",
      mirror_thorns: "relic-bone_mirror",
      swift_star: "passive-star_step",
      void_focus: "passive-ritual_focus",
    };
    for (let i = 0; i < 3; i++) {
      const d =
          i < pageSize
            ? this.profileEntries[this.profilePage * pageSize + i]
            : null,
        row = this.profileRows[i],
        button = this.profileActions[i],
        icon = this.profileIcons[i];
      row.node.active = !!d;
      button.active = !!d && talents;
      icon.node.active = !!d;
      if (!d) continue;
      row.node.setPosition(talents ? -88 : 10, talents ? 65 - i * 91 : 0);
      row.node
        .getComponent(UITransform)
        .setContentSize(talents ? 525 : 670, talents ? 82 : 250);
      row.fontSize = talents ? 16 : 20;
      row.lineHeight = talents ? 23 : 32;
      let frame: string;
      if (talents) {
        const owned = meta.purchasedTalents.includes(d.id),
          equipped = meta.equippedTalents.includes(d.id),
          locked = meta.level < d.unlockLevel;
        const action = equipped
          ? "卸下"
          : owned
            ? "装备"
            : locked
              ? `等级 ${d.unlockLevel} 解锁`
              : `购买 · ${d.cost} 命砂`;
        button.getChildByName("Label").getComponent(Label).string = action;
        row.string = `${d.name} · ${d.branch} · ${equipped ? "已装备" : owned ? "已拥有" : locked ? "未解锁" : "可购买"}\n${d.description}\n等级 ${d.unlockLevel} 解锁 · ${d.cost} 命砂 · 已有命契不受改动`;
        row.color = new Color(
          equipped ? "#eed493" : locked ? "#b6c5b0" : "#e2e6cf",
        );
        frame = icons[d.id];
      } else {
        row.string = `${d.name} · ${d.obtained ? "已发现" : "未发现"}\n${d.description || d.role || d.condition || "随探索记录于山海。"}${d.recipe ? "\n" + (group === "fusions" ? "融合条件：" : "可融合：") + d.recipe : ""}${d.heroId ? "\n专属行者：" + C.getHero(d.heroId).name : ""}`;
        row.color = new Color(d.obtained ? "#eed493" : "#b6c5b0");
        frame =
          ({ weapons: "weapon-", passives: "passive-", relics: "relic-" }[
            group
          ] || "") + d.id;
        if (group === "fusions") {
          const requirement = d.requirements?.find(
            (r: any) => r.kind === "weapon",
          );
          frame = "weapon-" + requirement?.id;
        }
        if (group === "monsters")
          frame = /^(forest|crypt|tundra)_\d$/.test(d.id)
            ? d.id.replace("_", "-") + "-0"
            : "ritual-" + d.id + "-0";
        if (group === "heroes")
          row.string += `\n初始武器：${Object.values(C.WEAPONS).find((w: any) => w.id === d.startingWeapon)?.["name"]}\n主动：${d.skillName} · 终式：${d.ultimateName}\n${d.talentDescription}`;
      }
      icon.spriteFrame =
        group === "heroes" && !talents
          ? this.frames.get(d.id + "-walk-1")
          : this.frames.get(frame);
      icon.node.active = !!icon.spriteFrame;
    }
    this.profileNotice.string = !["ok", "recovered"].includes(this.profile.code)
      ? "命府存储异常：操作未入账，请重试或重读本地记录，暂勿关闭。"
      : this.profileMessage ||
        (this.profile.recovered
          ? "已回退有效备份，进度可能回退；请检查后继续。"
          : talents
            ? "命砂用于永久购买，最多携带 3 个天赋；装备只影响新局，不叠加到旧档。"
            : "未发现条目也可查看配方，实际获得后才点亮；不同命契共同记录。");
  }
  private child(name: string, parent = this.node) {
    const n = new Node(name);
    n.layer = this.node.layer;
    parent.addChild(n);
    return n;
  }
  private icon(parent: Node, x: number, y: number, size: number) {
    const n = this.child("Pixel icon", parent);
    n.setPosition(x, y);
    n.addComponent(UITransform).setContentSize(size, size);
    const s = n.addComponent(Sprite);
    s.sizeMode = Sprite.SizeMode.CUSTOM;
    return s;
  }
  private label(
    text: string,
    x: number,
    y: number,
    size: number,
    parent = this.node,
  ) {
    const n = this.child("Label", parent);
    n.setPosition(x, y);
    const l = n.addComponent(Label);
    l.string = text;
    l.fontSize = size;
    l.lineHeight = size + 8;
    l.color = new Color(226, 230, 207);
    return l;
  }
  private panel(parent: Node, w: number, h: number) {
    const g = this.child("Panel", parent).addComponent(Graphics);
    g.node.getComponent(UITransform).setContentSize(w, h);
    g.fillColor = new Color(22, 32, 29, 255);
    g.rect(-w / 2, -h / 2, w, h);
    g.fill();
    g.strokeColor = new Color(110, 134, 108);
    g.lineWidth = 1;
    g.rect(-w / 2, -h / 2, w, h);
    g.stroke();
    g.node.addComponent(PanelInk);
  }
  private button(
    text: string,
    x: number,
    y: number,
    action: () => void,
    parent = this.node,
    w = 170,
    h = 52,
  ) {
    const n = this.child(text || "Choice", parent);
    n.setPosition(x, y);
    n.addComponent(UITransform).setContentSize(w, h);
    this.panel(n, w, h);
    this.label(text, 0, 0, 18, n);
    const ring = this.child("ControllerFocus", n);
    const ink = ring.addComponent(Graphics);
    ink.strokeColor = new Color("#eed493");
    ink.lineWidth = 3;
    ink.rect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);
    ink.stroke();
    ring.active = false;
    this.padButtons.push({ node: n, action, ring });
    const press = this.child("TouchPress", n);
    const pressInk = press.addComponent(Graphics);
    pressInk.strokeColor = new Color("#eed493");
    pressInk.lineWidth = 3;
    pressInk.rect(-w / 2, -h / 2, w, h);
    pressInk.stroke();
    press.getComponent(UITransform).setContentSize(w, h);
    press.active = false;
    n.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
      if (this.canTouch(n)) this.touch.beginPress(e.getID(), n.uuid);
    });
    n.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => {
      if (!n.getComponent(UITransform).hitTest(e.getLocation(), e.windowId))
        this.touch.cancelPress(e.getID(), n.uuid);
    });
    n.on(Node.EventType.TOUCH_CANCEL, (e: EventTouch) => {
      this.touch.cancelPress(e.getID(), n.uuid);
    });
    n.on(Node.EventType.TOUCH_END, (e: EventTouch) => {
      if (!this.touch.endPress(e.getID(), n.uuid, this.canTouch(n))) return;
      this.padVisible = false;
      this.sound?.mixer.gesture();
      action();
    });
    return n;
  }
  private canTouch(n: Node) {
    const scope = this.controllerScope();
    return (
      n.activeInHierarchy &&
      (scope ? n.isChildOf(scope) : n.parent === this.node)
    );
  }
  private load(path: string, type: any): Promise<any> {
    return new Promise((resolve, reject) =>
      resources.load(path, type, (e, a) => (e ? reject(e) : resolve(a))),
    );
  }
  private describe() {
    this.confirmNew = false;
    const slots = this.store.slots(),
      health = this.store.health();
    const saved = slots[this.slot - 1];
    if (saved && !this.editingNew) {
      this.selected = Math.max(
        0,
        this.heroes.findIndex((h) => h.id === saved.selectedHeroId),
      );
      this.talent = Math.max(
        0,
        this.heroes[this.selected].talents.findIndex(
          (t) => t.id === saved.selectedHeroTalentId,
        ),
      );
      this.mode = saved.runMode;
      this.difficulty = difficultyIds.includes(saved.cocosDifficulty)
        ? saved.cocosDifficulty
        : "normal";
      this.stageIndex = Math.max(
        0,
        ["forest", "crypt", "tundra"].indexOf(saved.stageId),
      );
    }
    for (const n of this.menuChoices) n.active = !saved || this.editingNew;
    this.cancelNew.active = !!saved && this.editingNew;
    for (let i = 0; i < 3; i++) {
      const summary = C.covenantSummary(slots[i]);
      this.slotLabels[i].string =
        (this.slot === i + 1 ? "● " : "") +
        "命契" +
        (i + 1) +
        " · " +
        summary.title +
        "\n" +
        summary.detail;
      this.slotLabels[i].color = new Color(
        this.slot === i + 1 ? "#eed493" : "#c9d4c2",
      );
    }
    this.startLabel.string = slots[this.slot - 1]
      ? "继续命契" + this.slot
      : "开始命契" + this.slot;
    this.newButton.active = !!slots[this.slot - 1];
    this.newButton.getChildByName("Label").getComponent(Label).string = this
      .editingNew
      ? "准备覆盖此命契"
      : "重新开始…";
    this.notice.string = !["ok", "recovered"].includes(health.code)
      ? "本地存储不可用或记录损坏；写入失败会保留本次进度，请勿直接关闭。"
      : health.recovered
        ? "已读取上一份有效备份，进度可能回退；原异常记录会保留。"
        : slots[this.slot - 1]
          ? this.editingNew
            ? "正在配置新局；确认覆盖前旧进度保留。点击继续仍恢复原命契。"
            : "已保存的角色与地图如下。继续恢复旧局；重新开始才修改新局选项。"
          : "三份局内进度互不覆盖 · 当前为此浏览器 / 此设备本地保存";
    const h = this.heroes[this.selected],
      t = h.talents[this.talent];
    this.modeLabel.string =
      this.mode === "chapter" ? "切换模式：章节道途" : "切换模式：无尽大荒";
    this.stageLabel.string =
      "切换主题：" + (Object.values(C.STAGES)[this.stageIndex] as any).name;
    this.difficultyLabel.string = "难度：" + difficultyLabel(this.difficulty);
    this.journeySummary.string =
      (Object.values(C.STAGES)[this.stageIndex] as any).name +
      "\n" +
      (this.mode === "chapter" ? "章节道途" : "无尽大荒") +
      " · " +
      difficultyLabel(this.difficulty);
    this.title.string = h.name;
    this.detail.string = `${h.epithet}\n${h.role}`;
    if (this.terrain.status === "unavailable")
      this.detail.string += "\n地面素材不可用：已回退基础地面，可继续游玩。";
    this.talentText.string = `${t.name}\n${t.description}`;
    this.portrait.spriteFrame = this.frames.get(`${h.id}-walk-1`);
    heroKit(h.id).forEach((entry, i) => {
      this.kitLabels[i].string = entry.text;
      this.kitIcons[i].spriteFrame = this.frames.get(entry.icon);
    });
  }
  private cycle(delta: number) {
    if (!this.ready || !this.menu.active) return;
    if (this.store.slots()[this.slot - 1] && !this.editingNew) return;
    this.selected = (this.selected + delta + 4) % 4;
    this.talent = 0;
    this.describe();
  }
  private startCombat(fresh = false) {
    if (!this.ready || !this.menu.active) return;
    const saved = fresh ? null : this.store.slots()[this.slot - 1];
    const maxSerial = Math.max(
      0,
      ...this.store
        .slots()
        .map((s: any) =>
          Number.isSafeInteger(s?.cocosRunSerial) ? s.cocosRunSerial : 0,
        ),
    );
    if (!this.profile.ensureSerial(maxSerial)) {
      this.notice.string =
        "命府存储异常，旧命契保留。请进入命府重读本地记录后重试。";
      return;
    }
    if (
      saved?.cocosRunSerial &&
      this.profile.isSettled(this.slot, saved.cocosRunSerial)
    ) {
      if (this.store.write(this.slot, null)) {
        this.describe();
        this.notice.string = "这份命契已结算入账，旧续玩记录已关闭。";
      } else this.notice.string = "结算已入账，但关闭旧命契失败；请重试。";
      return;
    }
    const serial = saved?.cocosRunSerial || this.profile.allocate();
    if (!serial) {
      this.notice.string =
        "命府保存失败，未开始新局。进入命府重读或重试；旧命契保留。";
      return;
    }
    const h = saved
      ? C.getHero(saved.selectedHeroId)
      : this.heroes[this.selected];
    this.session = new CombatSession(
      h.id,
      saved?.selectedHeroTalentId || h.talents[this.talent].id,
      {
        mode: saved?.runMode || this.mode,
        stage: saved?.stageId || ["forest", "crypt", "tundra"][this.stageIndex],
        difficulty: this.difficulty,
        snapshot: saved,
        store: this.store,
        slot: this.slot,
        profile: this.profile,
        serial,
      },
    );
    this.applySettings();
    for (const id of Object.keys(this.session.audio))
      this.session.audio[id] = () => this.sound.mixer.play(id);
    if (saved?.cocosCompletion) this.session.finishCovenant();
    else if (
      (!saved || !saved.cocosRunSerial) &&
      !this.session.saveCurrentCovenant()
    )
      this.session.pause();
    this.menu.active = false;
    this.editingNew = false;
    this.lastState = this.session.state;
    this.clearInput();
    this.renderOverlay(this.session);
  }
  private toMenu() {
    const s = this.session;
    if (s) {
      if (s.state === C.GameState.LEVEL_UP) return;
      const done = s.state === C.GameState.GAMEOVER;
      if (!done) s.pause();
      const saved = done ? s.finishCovenant() : s.saveCurrentCovenant();
      if (!saved) {
        s.saveMessage = "保存失败，仍留在本局。请重试，暂勿刷新或关闭。";
        s.saveFailed = true;
        this.clearInput();
        this.renderOverlay(s);
        return;
      }
    }
    this.mapOpen = false;
    this.detailsPanel.active = false;
    this.mapPanel.active = false;
    this.session = null;
    this.sound.mixer.mode(false);
    this.sound.mixer.stopEffects();
    this.sound.music.stop();
    this.menu.active = true;
    this.overlay.active = false;
    this.clearInput();
    this.describe();
  }
  private gamepadEvent(event: EventGamepad) {
    const d = event.gamepad;
    if (d.connected) this.padDevices.set(d.deviceId, d);
    else this.padDevices.delete(d.deviceId);
  }
  private controllerScope(): Node | null {
    for (const n of [
      this.manager?.node,
      this.guidePanel,
      this.settingsPanel,
      this.detailsPanel,
      this.profilePanel,
      this.mapPanel,
      this.menu,
      this.overlay,
    ])
      if (n?.activeInHierarchy) return n;
    return null;
  }
  private pollController(dt: number) {
    const scope = this.controllerScope();
    if (scope !== this.padScope) {
      this.padScope = scope;
      this.padFocus = null;
      this.controller.block();
    }
    const devices: PadFrame[] = [];
    for (const d of Array.from(this.padDevices.values())) {
      if (!d.connected) continue;
      try {
        const stick = d.leftStick.getValue(),
          arrows = d.dpad.getValue();
        const value = (button: any) => (button?.getValue() || 0) > 0.5;
        devices.push({
          id: d.deviceId,
          x: arrows.x || stick.x,
          y: -(arrows.y || stick.y),
          buttons: {
            confirm: value(d.buttonSouth),
            back: value(d.buttonEast),
            skill: value(d.buttonWest),
            ultimate: value(d.buttonNorth),
            previous: value(d.buttonL1),
            next: value(d.buttonR1),
            map: value(d.buttonShare),
            pause: value(d.buttonOptions) || value(d.buttonStart),
          },
        });
      } catch {
        /* A missing/unreadable active device follows disconnect safety. */
      }
    }
    const frame = this.controller.step(devices, dt);
    this.padMove = { x: frame.x, y: frame.y };
    if (frame.lost) {
      this.session?.pause();
      this.clearInput();
      if (this.session) this.renderOverlay(this.session);
      this.padNotice = "手柄已断开 · 战斗已暂停，请重新连接或用键鼠手动继续";
    }
    if (frame.actions.length || frame.x || frame.y) {
      // Cocos Web keyboard events target the canvas, not document/window.
      // A controller-only start must still allow a later keyboard takeover.
      if (!this.padVisible && sys.isBrowser)
        game.canvas?.focus({ preventScroll: true });
      this.padVisible = true;
      this.padNotice = "";
      this.sound?.mixer.gesture();
    }
    const buttons = this.padButtons.filter(
      (b) => b.node.activeInHierarchy && !!scope && b.node.isChildOf(scope),
    );
    if (!buttons.some((b) => b.node === this.padFocus)) {
      const preferred =
        scope === this.menu
          ? this.startLabel?.node.parent
          : scope === this.overlay
            ? this.resumeButton
            : null;
      this.padFocus =
        buttons.find((b) => b.node === preferred)?.node ||
        buttons[0]?.node ||
        null;
    }
    // One UI action per frame; a held confirm never selects the next modal too.
    for (const action of frame.actions) {
      if (action === "back" || action === "pause") {
        this.keyDown({ keyCode: KeyCode.ESCAPE } as EventKeyboard);
        this.keyUp({ keyCode: KeyCode.ESCAPE } as EventKeyboard);
        this.padVisible = true;
        break;
      }
      if (scope) {
        if (this.bindingAction) break; // Keyboard rebinding deliberately needs a keyboard; B cancels.
        const i = buttons.findIndex((b) => b.node === this.padFocus);
        if (action === "confirm" && i >= 0) {
          if (this.padFocus.name === "选择备份文件")
            this.padNotice = "系统文件选择器需要鼠标/触摸点击「选择备份文件」";
          else buttons[i].action();
          break;
        }
        if ((action === "next" || action === "previous") && buttons.length)
          this.padFocus =
            buttons[
              (i + (action === "next" ? 1 : -1) + buttons.length) %
                buttons.length
            ].node;
        if (["up", "down", "left", "right"].includes(action) && i >= 0) {
          const positions = buttons.map((b) => ({
            node: b.node,
            x: b.node.worldPosition.x,
            y: b.node.worldPosition.y,
          }));
          this.padFocus = neighbour(positions, positions[i], action).node;
        }
      } else if (this.session?.state === C.GameState.PLAYING) {
        if (action === "confirm") this.interact();
        if (action === "skill") this.session.cast();
        if (action === "ultimate") this.session.cast(true);
        if (action === "map") this.toggleMap();
        if (["confirm", "skill", "ultimate", "map"].includes(action)) break;
      }
    }
    for (const b of this.padButtons)
      b.ring.active =
        this.padVisible &&
        this.controller.id !== null &&
        b.node === this.padFocus &&
        scope === this.controllerScope();
    this.padHint.string =
      this.padNotice ||
      (this.controller.id === null
        ? ""
        : this.controller.blocked
          ? "手柄就绪 · 请先松开所有按键与摇杆"
          : this.bindingAction
            ? "改键需要键盘输入 · B 取消"
            : scope
              ? "手柄：方向/摇杆选择 · A 确认 · B 返回 · LB / RB 遍历选项"
              : "手柄：左摇杆移动 · A 交互 · X / Y 技能 · View 地图 · Start 暂停");
    this.padHint.node.setSiblingIndex(this.node.children.length - 1);
    if (this.padVisible) this.responsive?.followFocus(this.padFocus);
  }
  private clearInput() {
    this.controller.block();
    this.padMove = { x: 0, y: 0 };
    this.keys.clear();
    this.touch.clear();
    this.joystick?.clear();
    this.session?.setMove(0, 0);
  }
  private togglePause() {
    if (this.settingsPanel.active) {
      this.closeSettings();
      return;
    }
    if (!this.session) return;
    if (this.detailsPanel.active) {
      this.closeDetails();
      return;
    }
    if (this.mapOpen) {
      this.toggleMap();
      return;
    }
    if (this.session.state === C.GameState.INTERACTION) {
      this.closeOverlay();
      return;
    }
    if (this.session.state === C.GameState.PLAYING) this.session.pause();
    else this.session.resume();
    this.clearInput();
    this.lastState = this.session.state;
    this.renderOverlay(this.session);
  }
  private hide() {
    this.sound.mixer.hide();
    this.session?.pause();
    if (this.session && !this.session.pendingLevelUps)
      this.session.saveCurrentCovenant();
    this.clearInput();
    this.renderDetails();
    if (this.settingsPanel.active) {
      this.bindingAction = null;
      this.settingsMessage = "已暂停并清空按住状态；返回后手动继续。";
      this.renderSettings();
    }
  }
  private keyDown(event: EventKeyboard) {
    // The native MOBILE_BACK signal is distinct from desktop Escape.
    // Android OS/gesture delivery is verified separately from this UI route.
    // Reuse the same modal/paused navigation without mutating the input event.
    if (event.keyCode === KeyCode.MOBILE_BACK)
      event = new EventKeyboard(KeyCode.ESCAPE, Input.EventType.KEY_DOWN);
    this.padVisible = false;
    this.sound?.mixer.gesture();
    if (this.keys.has(event.keyCode)) return;
    this.keys.add(event.keyCode);
    if (this.guidePanel.active) {
      if (event.keyCode === KeyCode.ESCAPE) this.closeGuide();
      if (event.keyCode === KeyCode.ARROW_LEFT) this.turnGuide(-1);
      if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnGuide(1);
      return;
    }
    if (this.manager.node.active) {
      if (event.keyCode === KeyCode.ESCAPE) this.manager.close();
      return;
    }
    if (this.settingsPanel.active) {
      if (event.keyCode === KeyCode.ESCAPE) {
        if (this.bindingAction) {
          this.bindingAction = null;
          this.settingsMessage = "已取消改键。";
          this.renderSettings();
        } else this.closeSettings();
        return;
      }
      if (this.bindingAction) {
        const result = this.settings.bind(this.bindingAction, event.keyCode);
        if (result === "ok") {
          this.bindingAction = null;
          this.settingResult(true);
        } else if (result === "conflict")
          this.settingsMessage = "该按键已用于其他动作，请选另一个字母。";
        else if (result === "unsupported")
          this.settingsMessage =
            "仅可绑定 A–Z；Esc / Shift / 数字 / 方向键保留。";
        else {
          this.bindingAction = null;
          this.settingResult(false);
        }
        this.renderSettings();
      }
      return;
    }
    if (this.detailsPanel.active) {
      if (event.keyCode === KeyCode.ESCAPE) this.closeDetails();
      if (event.keyCode === KeyCode.ARROW_LEFT) this.turnDetails(-1);
      if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnDetails(1);
      if (
        event.keyCode === KeyCode.SHIFT_LEFT ||
        event.keyCode === KeyCode.SHIFT_RIGHT
      )
        this.renderDetails();
      return;
    }
    if (this.profilePanel.active) {
      if (event.keyCode === KeyCode.ESCAPE) this.closeProfile();
      if (event.keyCode === KeyCode.ARROW_LEFT) this.turnProfile(-1);
      if (event.keyCode === KeyCode.ARROW_RIGHT) this.turnProfile(1);
      return;
    }
    if (this.menu.active) {
      if (event.keyCode === KeyCode.ESCAPE && this.editingNew)
        this.cancelNewRun();
      if (event.keyCode === KeyCode.KEY_H) this.cycle(1);
      if (event.keyCode === KeyCode.ENTER) this.startCombat();
      return;
    }
    if (event.keyCode === KeyCode.ESCAPE) this.togglePause();
    if (event.keyCode === this.settings.data.bindings.map) this.toggleMap();
    if (event.keyCode === this.settings.data.bindings.interact) this.interact();
    if (event.keyCode === this.settings.data.bindings.skill)
      this.session?.cast();
    if (event.keyCode === this.settings.data.bindings.ultimate)
      this.session?.cast(true);
    if (event.keyCode >= KeyCode.DIGIT_1 && event.keyCode <= KeyCode.DIGIT_3) {
      this.chooseOption(event.keyCode - KeyCode.DIGIT_1);
    }
  }
  private keyUp(event: EventKeyboard) {
    if (event.keyCode === KeyCode.MOBILE_BACK)
      event = new EventKeyboard(KeyCode.ESCAPE, Input.EventType.KEY_UP);
    this.keys.delete(event.keyCode);
    if (
      event.keyCode === KeyCode.SHIFT_LEFT ||
      event.keyCode === KeyCode.SHIFT_RIGHT
    )
      this.renderDetails();
  }
  lateUpdate() {
    this.responsive?.tick();
    this.refreshInteractionVisibility();
    this.joystick?.draw();
    for (const { node } of this.padButtons) {
      const mark = node.getChildByName("TouchPress");
      if (!mark) continue;
      const direction = this.directionButtons.find((d) => d.node === node);
      mark.active =
        this.canTouch(node) &&
        (this.touch.pressed(node.uuid) ||
          (!!direction && this.touch.moving(direction.x, direction.y)));
      if (mark.active) {
        const ui = node.getComponent(UITransform),
          own = mark.getComponent(UITransform);
        if (own.width !== ui.width || own.height !== ui.height) {
          own.setContentSize(ui.width, ui.height);
          const g = mark.getComponent(Graphics);
          g.clear();
          g.rect(-ui.width / 2, -ui.height / 2, ui.width, ui.height);
          g.stroke();
        }
      }
    }
  }
  update(dt: number) {
    if (this.ready) this.pollController(dt);
    this.sound?.mixer.tick(dt);
    const systemMotion = C.heroPrefersReducedMotion();
    if (systemMotion !== this.lastSystemMotion) {
      this.lastSystemMotion = systemMotion;
      if (this.settingsPanel.active) this.renderSettings();
    }
    if (Number.isFinite(dt) && dt > 0) {
      this.fpsTime += dt;
      this.fpsFrames++;
      if (this.fpsTime >= 1) {
        this.fpsLabel.string =
          Math.round(this.fpsFrames / this.fpsTime) + " FPS";
        this.fpsTime = 0;
        this.fpsFrames = 0;
      }
    }
    const s = this.session;
    this.sound?.mixer.mode(!!s && s.state === C.GameState.PLAYING);
    if (!s || !this.ready) { this.enemyFeedback.reset(); return; }
    const touch = this.touch.vector;
    s.setMove(
      Number(
        this.keys.has(this.settings.data.bindings.right) ||
          this.keys.has(KeyCode.ARROW_RIGHT),
      ) -
        Number(
          this.keys.has(this.settings.data.bindings.left) ||
            this.keys.has(KeyCode.ARROW_LEFT),
        ) +
        touch.x +
        this.padMove.x,
      Number(
        this.keys.has(this.settings.data.bindings.down) ||
          this.keys.has(KeyCode.ARROW_DOWN),
      ) -
        Number(
          this.keys.has(this.settings.data.bindings.up) ||
            this.keys.has(KeyCode.ARROW_UP),
        ) +
        touch.y +
        this.padMove.y,
    );
    if (!s.direction.x && !s.direction.y && this.joystick.node.active) {
      const value = this.joystick.state.value;
      s.setMove(value.x, value.y, true);
    }
    const hp = s.player.hp,
      level = s.player.level,
      state = s.state;
    this.observeEnemyFeedback(s);
    s.update(dt);
    this.observeEnemyFeedback(s);
    this.sound.mixer.mode(s.state === C.GameState.PLAYING);
    if (s.player.hp < hp) this.sound.mixer.play("damage");
    if (
      s.player.level > level ||
      (state !== C.GameState.LEVEL_UP && s.state === C.GameState.LEVEL_UP)
    )
      this.sound.mixer.play("levelUp", true);
    if (state !== C.GameState.GAMEOVER && s.state === C.GameState.GAMEOVER)
      this.sound.mixer.play(s.player.dead ? "death" : "achievement", true);
    this.refreshInteractionVisibility();
    this.renderBattle(s);
    this.renderNavigation(s);
    const a = s.heroSkills.getSnapshot();
    const coaching = this.settings.data.contextHints !== false;
    const id = coaching
      ? this.coach.step({
          time: s.gameTime,
          playing: s.state === C.GameState.PLAYING && !this.controllerScope(),
          x: s.player.x,
          y: s.player.y,
          collected: s.run.orbsCollected || 0,
          level: s.player.level,
          orbs: s.expOrbs.length,
          enemies: s.enemies.length,
          near: !!s.interactions.nearby && !s.interactions.nearby.used,
          interacting: !!s.activeInteraction,
          roomReady: s.runMode === "chapter" && s.chapterRoute.roomReady,
          skillReady: a.skillReady,
          ultimateReady: a.ultimateReady,
        })
      : null;
    if (!coaching) this.coach.suspend();
    const learned = this.coach.historyChange();
    if (coaching && learned) this.settings.rememberHints(learned);
    this.coachText = id
      ? coachCopy(
          id,
          this.controller.id !== null
            ? "pad"
            : this.responsive.compact
              ? "touch"
              : "keys",
          Object.fromEntries(
            Object.keys(this.settings.data.bindings).map((k) => [
              k,
              this.keyName(k),
            ]),
          ),
        )
      : "";
    this.controlsHint.string = this.coachText || this.controlsText;
    this.controlsHint.node.active =
      !this.controllerScope() && (!this.responsive.compact || !!this.coachText);
    this.hud.string = this.responsive.compact
      ? `${healthText(s.player.hp, s.player.maxHp)} 命\nLv.${s.player.level}`
      : `${healthText(s.player.hp, s.player.maxHp)} 命     Lv.${s.player.level}     ${Math.floor(s.gameTime)} 秒     ${s.kills} 斩     ${s.runCoins} 铜钱`;
    this.build.string = "";
    for (let i = 0; i < 6; i++) {
      const w = s.player.weapons[i];
      this.weaponIcons[i].node.active = !!w;
      this.weaponLabels[i].string = w ? `${w.name} ${w.level}` : "";
      if (w)
        this.weaponIcons[i].spriteFrame = this.frames.get(`weapon-${w.id}`);
    }
    this.skillIcon.spriteFrame = this.frames.get(`skill-${a.skillIcon}`);
    this.ultimateIcon.spriteFrame = this.frames.get(
      `fusion-${a.skillIcon}_ultimate`,
    );
    this.skillLabel.string = `${this.keyName("skill")} ${a.skillName}\n${skillCooldownText(a.skillCooldown, a.skillReady)}`;
    this.ultimateLabel.string = `${this.keyName("ultimate")} ${a.ultimateName}\n${a.ultimateEnergy} / 100`;
    if (this.lastState !== s.state) {
      this.lastState = s.state;
      this.clearInput();
      this.renderOverlay(s);
    }
  }
  private interact() {
    if (this.session?.interact()) {
      this.clearInput();
      this.renderOverlay(this.session);
    }
  }
  private chooseOption(index: number) {
    const s = this.session;
    if (
      !s ||
      this.mapOpen ||
      this.detailsPanel.active ||
      this.settingsPanel.active
    )
      return;
    const changed =
      s.state === C.GameState.INTERACTION
        ? s.resolveInteraction(index)
        : s.state === C.GameState.MILESTONE
          ? s.checkpoint(index === 0 ? "continue" : index === 1 ? "settle" : "")
          : s.state === C.GameState.BUILD_CHOICE
            ? s.chooseBuild(index)
            : s.choose(index);
    if (changed) {
      this.clearInput();
      this.lastState = s.state;
      this.renderOverlay(s);
    }
  }
  private closeOverlay() {
    const s = this.session;
    if (!s) return;
    if (s.state === C.GameState.INTERACTION) s.closeWorldInteraction();
    else s.resume();
    this.clearInput();
    this.lastState = s.state;
    this.renderOverlay(s);
  }
  private toggleMap() {
    const s = this.session;
    if (!s) return;
    if (this.mapOpen) {
      this.mapOpen = false;
      this.mapPanel.active = false;
      s.resume();
      this.clearInput();
      this.lastState = s.state;
      this.renderOverlay(s);
      return;
    }
    if (s.state !== C.GameState.PLAYING) return;
    s.pause();
    this.clearInput();
    this.mapOpen = true;
    this.mapPanel.active = true;
    this.overlay.active = false;
    this.lastState = s.state;
    this.mapGraphics.clear();
    const g = this.mapGraphics,
      grid = s.chapterRoute.mapModel().grid;
    for (let i = 0; i < 9; i++) {
      const node =
          s.runMode === "chapter" ? grid[Math.floor(i / 3)][i % 3] : null,
        l = this.mapLabels[i];
      l.string = node
        ? node.id +
          " " +
          node.name +
          "\n" +
          (node.state === "current"
            ? "所在房间"
            : node.state === "cleared"
              ? "已清除"
              : node.label) +
          (node.killTarget ? " · " + node.killTarget + " 目标" : "")
        : i === 4 && s.runMode === "endless"
          ? "无尽大荒无固定房间路线\n使用左侧关键物地图探索"
          : "";
      if (!node) continue;
      const x = ((i % 3) - 1) * 250,
        y = 130 - Math.floor(i / 3) * 125;
      g.strokeColor = new Color(
        node.state === "current" ? "#e4cc8b" : "#637c6b",
      );
      g.lineWidth = 2;
      g.rect(x - 114, y - 49, 228, 98);
      g.stroke();
      for (const target of Object.values(node.links || {})) {
        const other = grid.flat().find((v: any) => v?.id === target);
        if (!other) continue;
        const tx = (other.gridX - 1) * 250,
          ty = 130 - other.gridY * 125;
        g.moveTo(x + (tx - x) * 0.46, y + (ty - y) * 0.4);
        g.lineTo(x + (tx - x) * 0.54, y + (ty - y) * 0.6);
        g.stroke();
      }
    }
  }
  private renderOverlay(s: CombatSession) {
    if (s.state !== C.GameState.PLAYING) {
      this.coachText = "";
      this.controlsHint.node.active = false;
    }
    this.guidePause.active = s.state === C.GameState.PAUSED;
    const level = s.state === C.GameState.LEVEL_UP,
      buildChoice = s.state === C.GameState.BUILD_CHOICE,
      interaction = s.state === C.GameState.INTERACTION,
      milestone = s.state === C.GameState.MILESTONE,
      dead = s.state === C.GameState.GAMEOVER;
    this.overlay.active =
      !this.mapOpen &&
      !this.detailsPanel?.active &&
      !this.settingsPanel?.active &&
      s.state !== C.GameState.PLAYING;
    if (!this.overlay.active) return;
    this.saveButton.active = !level && !dead;
    this.detailsButton.active = s.state === C.GameState.PAUSED || buildChoice || dead;
    this.settingsButton.active = s.state === C.GameState.PAUSED || buildChoice;
    this.exitLabel.node.parent.active = !level;
    this.exitLabel.string = dead ? "返回菜单" : "保存并退出";
    this.saveNotice.string =
      buildChoice && !s.saveFailed
        ? "时间静止 · 请选择一项，或保存退出；退出不会刷新本次选项。"
        : s.saveMessage || "每 15 秒自动保存；手动保存成功后可安全退出";
    this.saveNotice.color = new Color(s.saveFailed ? "#edaa92" : "#bacdb7");
    this.saveNotice.node.getComponent(UITransform).setContentSize(800, 22);
    this.saveNotice.overflow = Label.Overflow.SHRINK;
    this.overlayTitle.string = level
      ? "悟道 · 三选一（1 / 2 / 3）"
      : buildChoice
        ? "异变抉择 · 三选一（1 / 2 / 3）"
        : interaction
          ? s.activeInteraction?.name + " · 时间静止"
          : milestone
            ? "三劫已渡 · 结算或继续无尽"
            : dead
              ? (s.outcome ? "此行告捷" : "此行结束") +
                " · " +
                s.kills +
                " 斩 / " +
                Math.floor(s.gameTime) +
                " 秒"
              : "已暂停 · 外界时间静止";
    this.resumeButton.active = !level && !dead && !milestone && !buildChoice;
    this.resumeButton.getChildByName("Label").getComponent(Label).string =
      interaction ? "关闭 · 继续探索" : "继续战斗";
    this.pauseDetail.node.active =
      !level && !interaction && !milestone && !buildChoice;
    const h = C.getHero(s.player.heroId),
      t = h.talents.find((v: any) => v.id === s.player.heroTalentId);
    this.pauseDetail.string =
      h.name +
      " · " +
      h.role +
      "\n" +
      t.name +
      "：" +
      t.description +
      "\n生命 " +
      healthText(s.player.hp, s.player.maxHp) +
      " · 伤害倍率 " +
      s.player.getDamageMult().toFixed(2) +
      "\n向下滚动查看构筑与操作；详解见行囊。\n\n" +
      pauseLoadout(s.player, Array.from(s.buildSystem.relics).map((id: string) => C.RELICS[id]?.name || id)) +
      "\n\n" +
      "命契" +
      this.slot +
      "独立保存；旧浏览器原型存档不受影响。";
    if (dead && s.metaReward) {
      const r = s.metaReward;
      this.pauseDetail.string = `本次命砂 +${r.currency} · 阅历 +${r.xp}\n共享等级 ${this.profile.data.meta.level} / ${C.META_LEVEL_CAP} · 命砂 ${this.profile.data.meta.currency}\n表现 ${r.score} / 门槛 ${r.threshold} · ${r.qualified ? "已达标" : "未达标，命砂为 0"}\n本日同图第 ${r.repeatIndex} 次 · 收益 ${Math.round(r.repeatMultiplier * 100)}% · 单局命砂上限 30\n三份命契共享成长；返回命府可购买并装备天赋。`;
    }
    if (dead) this.pauseDetail.string += "\n" + C.damageRecap(s);
    for (let i = 0; i < 3; i++) {
      const c = level
        ? s.choices[i]
        : buildChoice
          ? s.buildChoice?.choices[i]
          : interaction
            ? s._interactionOptions[i]
            : milestone
              ? [
                  { name: "继续无尽", description: "继续迎战更强时间首领。" },
                  {
                    name: "结算本次远征",
                    description: "按表现结算共享命砂与阅历；未达门槛不发命砂。",
                  },
                ][i]
              : null;
      this.choiceButtons[i].active = !!c;
      if (!c) continue;
      const data = level ? c.data : c;
      this.choiceLabels[i].string =
        i +
        1 +
        ". " +
        data.name +
        (data.price != null ? " · " + data.price + " 铜钱" : "") +
        (data.disabled ? " · 不可选" : "") +
        "\n" +
        (data.description || data.desc || "装备后自动生效") +
        (data.meta ? " · " + data.meta : "");
      this.choiceLabels[i].color = new Color(
        data.disabled ? "#889486" : "#e2e6cf",
      );
      this.choiceLabels[i].node.setPosition(25, 0);
      this.choiceLabels[i].node
        .getComponent(UITransform)
        .setContentSize(680, 54);
      this.choiceLabels[i].overflow = Label.Overflow.SHRINK;
      this.choiceIcons[i].spriteFrame = level
        ? this.frames.get(c.type + "-" + data.id) || null
        : buildChoice
          ? this.frames.get(s.buildChoice.kind + "-" + data.id) || null
          : this.frames.get(data.artKind + "-" + data.artId) || null;
    }
  }
  private refreshInteractionVisibility() {
    const s = this.session, near = s?.interactions.nearby;
    if (!this.interactLabel || !this.responsive) return;
    this.interactLabel.node.parent.active = contextInteractionVisible(
      this.responsive.compact,
      s?.state === C.GameState.PLAYING && !this.controllerScope(),
      !!near && !near.used,
    );
  }
  private renderNavigation(s: CombatSession) {
    const room = s.chapterRoute.current(),
      near = s.interactions.nearby;
    this.interactLabel.string =
      this.keyName("interact") + (near ? " " + near.name : " 附近暂无交互");
    this.routeLabel.string =
      s.runMode === "chapter"
        ? room.id +
          " " +
          room.name +
          "\n\n" +
          (s.chapterRoute.roomReady
            ? "房间已清除\n沿方向门前进"
            : room.type === "boss"
              ? "击败守关首领"
              : s.chapterRoute.roomKills + " / " + room.killTarget + " 斩")
        : "无尽大荒\n\n下次时间首领\n" +
          Math.max(
            0,
            Math.ceil(
              (s.endlessRun.nextDefinition(s.stageId).spawnAt || 0) -
                s.gameTime,
            ),
          ) +
          " 秒";
    const g = this.miniMap;
    g.clear();
    this.markers.node.active = this.mapVisible;
    if (!this.mapVisible) return;
    const p = s.player,
      objects = s.interactions.objects
        .filter((o: any) => !o.used)
        .concat(
          s.enemies
            .filter((e: any) => e.boss && e.hp > 0)
            .map((e: any) => ({
              x: e.x,
              y: e.y,
              name: e.type.name,
              kind: "boss",
              expiresAt: Infinity,
            })),
        ),
      scale = s.runMode === "chapter" ? 120 / s.arenaWidth : 0.045;
    g.fillColor = new Color("#101b18");
    g.rect(-66, -64, 132, 128);
    g.fill();
    g.strokeColor = new Color("#637c6b");
    g.rect(-66, -64, 132, 128);
    g.stroke();
    const map = (x: number, y: number) => [
      Math.max(-59, Math.min(59, (x - p.x) * scale)),
      Math.max(-56, Math.min(56, -(y - p.y) * scale)),
    ];
    for (const o of objects) {
      const [x, y] = map(o.x, o.y);
      g.fillColor = new Color(
        o.kind === "boss"
          ? "#cf796f"
          : o.kind === "portal"
            ? "#89b5c2"
            : o.kind === "chest"
              ? "#e3c281"
              : "#adba8e",
      );
      g.rect(x - 3, y - 3, 6, 6);
      g.fill();
    }
    g.fillColor = new Color("#f0e8cb");
    g.circle(0, 0, 4);
    g.fill();
    this.markers.string =
      objects
        .sort(
          (a: any, b: any) =>
            Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y),
        )
        .slice(0, 4)
        .map((o: any) => {
          const dx = o.x - p.x,
            dy = o.y - p.y,
            dir =
              Math.abs(dx) > Math.abs(dy)
                ? dx > 0
                  ? "东"
                  : "西"
                : dy > 0
                  ? "南"
                  : "北";
          return (
            o.name +
            "\n" +
            dir +
            " · " +
            Math.round(Math.hypot(dx, dy) / 10) +
            " 步" +
            (Number.isFinite(o.expiresAt)
              ? " · " + Math.max(0, Math.ceil(o.expiresAt - s.gameTime)) + "秒"
              : "")
          );
        })
        .join("\n\n") || "尚无关键物\n随探索逐步出现";
  }
  private renderBattle(s: CombatSession) {
    this.ground.clear();
    this.front.clear();
    let used = 0,
      textUsed = 0;
    const p = s.player,
      scale = this.battleRenderScale,
      field = this.battle.getComponent(UITransform),
      view = visualBattleView({
        playerX: p.x,
        playerY: p.y,
        fieldWidth: field.width,
        fieldHeight: field.height,
        scale,
        runMode: s.runMode,
        arenaWidth: s.arenaWidth,
        arenaHeight: s.arenaHeight,
        logicalCenterX: s.camera.worldX + s.canvas.width / 2,
        logicalCenterY: s.camera.worldY + s.canvas.height / 2,
        // Native compact landscape has touch panels on both sides. Center the
        // visual actor even near room walls; do not mutate simulation camera.
        followPlayer: sys.isNative && sys.os === sys.OS.ANDROID && this.responsive.compact && scale <= 0.525,
        edgeOverscan:
          scale > 0.525 ? { left: 176, right: 240, top: 112, bottom: 240 } : 0,
      }),
      halfW = view.width / 2,
      halfH = view.height / 2,
      cx = view.cx,
      cy = view.cy;
    const drawText = (
      value: string,
      x: number,
      y: number,
      size: number,
      color: Color,
    ) => {
      if (Math.abs(x) > halfW * scale + 24 || Math.abs(y) > halfH * scale + 24)
        return;
      let l = this.worldTexts[textUsed++];
      if (!l) {
        l = this.label("", 0, 0, 12, this.battle);
        this.worldTexts.push(l);
      }
      l.node.active = true;
      l.node.setPosition(x, y);
      l.fontSize = Math.max(9, size);
      l.lineHeight = l.fontSize + 3;
      l.color = color;
      l.string = value;
    };
    const paintViewport = {
      left: -halfW * scale,
      right: halfW * scale,
      bottom: -halfH * scale,
      top: halfH * scale,
    };
    const g = new GraphicsPainter(this.ground, 0, 0, drawText, paintViewport),
      f = new GraphicsPainter(this.front, 0, 0, drawText, paintViewport);
    for (const painter of [g, f]) {
      painter.scale(scale, scale);
      painter.translate(-cx, -cy);
    }
    g.fillStyle =
      s.stageId === "crypt"
        ? "#292330"
        : s.stageId === "tundra"
          ? "#283947"
          : "#202e29";
    const textured = this.terrain.draw(s, scale, view);
    if (!textured) g.fillRect(view.x, view.y, view.width, view.height);
    // Fixed world marks: camera movement never reseeds the floor.
    g.fillStyle =
      s.stageId === "crypt"
        ? "#383041"
        : s.stageId === "tundra"
          ? "#354958"
          : "#2b3c32";
    if (!textured)
      for (let y = Math.floor((cy - halfH) / 96) * 96; y < cy + halfH; y += 96)
        for (
          let x = Math.floor((cx - halfW) / 96) * 96;
          x < cx + halfW;
          x += 96
        )
          g.fillRect(x + (Math.abs(y) % 19), y, 20, 3);
    if (s.runMode === "chapter") {
      g.strokeStyle = "#8c997d";
      g.lineWidth = 8;
      g.strokeRect(4, 4, s.arenaWidth - 8, s.arenaHeight - 8);
    }
    for (const o of s.expOrbs) {
      g.fillStyle = "#86b68b";
      g.fillRect(o.x - 4, o.y - 4, 8, 8);
    }
    s.combatVisuals.render(g, "ground");
    s.hostileFields.render(g, { labels: false });
    for (const mine of s.mines) mine.render(g);
    const sprite = (
      key: string,
      x: number,
      y: number,
      size: number,
      facing: number,
      alpha = 1,
    ) => {
      if (
        Math.abs(x - cx) > halfW + size / 2 ||
        Math.abs(y - cy) > halfH + size / 2
      )
        return;
      let n = this.sprites[used++];
      if (!n) {
        n = this.child("Actor", this.actors);
        n.addComponent(UITransform);
        const sp = n.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.trim = false;
        this.sprites.push(n);
      }
      n.active = true;
      n.setPosition((x - cx) * scale, -(y - cy) * scale);
      n.setScale(facing, 1, 1);
      n.getComponent(UITransform).setContentSize(size * scale, size * scale);
      const sp = n.getComponent(Sprite);
      sp.spriteFrame = this.frames.get(key);
      // Pooled nodes must reset opacity for the next live actor/building.
      const opacity = Math.round(255 * alpha);
      if (sp.color.a !== opacity) sp.color = new Color(255, 255, 255, opacity);
    };
    for (const o of [
      ...s.worldMap.visibleStructures,
      ...s.interactions.objects,
    ]) {
      if (o.used && !C.isRetainedBuilding(o)) continue;
      const box = C.buildingBounds(o);
      if (box) {
        const kind = ["shop", "pavilion"].includes(o.kind)
          ? "shop"
          : ["relic", "ruin", "shrine"].includes(o.kind)
            ? "relic"
            : o.kind === "gate"
              ? "gate"
              : "heal";
        sprite(
          "building-" + s.stageId + "-" + kind,
          o.x,
          o.y,
          ((o.radius || 62) * 192) / 72,
          1,
        );
        if (o === s.interactions.nearby) {
          g.strokeStyle = "#eed493";
          g.lineWidth = 2;
          g.strokeRect(
            box.left - 3,
            box.top - 3,
            box.right - box.left + 6,
            box.bottom - box.top + 6,
          );
        }
      } else {
        g.fillStyle = o.kind === "portal" ? "#87adba" : "#bb9d64";
        if (o.kind === "portal") {
          g.lineWidth = 4;
          g.strokeStyle = "#b6d5d8";
          g.beginPath();
          g.arc(o.x, o.y, o.radius || 48, 0, Math.PI * 2);
          g.stroke();
        } else {
          g.fillRect(o.x - 15, o.y - 12, 30, 24);
          g.strokeStyle = "#e5d1a2";
          g.strokeRect(o.x - 15, o.y - 12, 30, 24);
        }
      }
      f.fillStyle = "#e6dfc2";
      f.font = "20px sans-serif";
      f.fillText(
        o.used ? C.closedBuildingLabel(o) : o.name || "封存遗迹",
        o.x,
        o.y + (o.radius || 48) + 26,
      );
    }
    for (const d of this.enemyFeedback.deaths)
      sprite(d.key, d.x, d.y, d.size, d.facing, this.enemyFeedback.deathAlpha(d.remaining));
    for (const e of s.enemies.filter(e => e.hp > 0).sort((a, b) => a.y - b.y)) {
      const pose = this.enemyPose(e);
      C.renderEnemyCast(f, e);
      sprite(pose.key, pose.x, pose.y, pose.size, pose.facing);
      if (this.enemyFeedback.hits.has(e)) renderEnemyHit(f, e.x, e.y, C.enemyHitRadius(e));
      if (e.hp < e.maxHp) {
        f.fillStyle = "#ad735f";
        f.fillRect(
          e.x - 18,
          e.y - e.visualDiameter / 2 - 6,
          36 * Math.max(0, e.hp / e.maxHp),
          3,
        );
      }
      if (this.settings.data.highContrast) {
        f.strokeStyle = "#e9b19b";
        f.lineWidth = 2;
        f.beginPath();
        f.arc(e.x, e.y, C.enemyHitRadius(e), 0, Math.PI * 2);
        f.stroke();
      }
    }
    const action = this.reducedMotion() ? null : p.heroAction;
    sprite(
      `${p.heroId}-${action ? "action" : "walk"}-${this.reducedMotion() ? 1 : (action?.frame ?? p.walkFrame ?? 1)}`,
      p.x,
      p.y,
      128,
      action?.facing ?? p.walkFacing ?? 1,
    );
    for (let i = used; i < this.sprites.length; i++)
      this.sprites[i].active = false;
    for (const shot of s.projectiles) shot.render(f);
    for (const shot of s.enemyProjectiles) shot.render(f);
    for (const w of p.weapons)
      for (const shard of w._shards || []) shard.render(f);
    s.combatVisuals.render(f, "foreground");
    if (this.settings.data.highContrast) {
      f.strokeStyle = "#f6e4a4";
      f.lineWidth = 3;
      f.beginPath();
      f.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      f.stroke();
    }
    if (this.settings.data.damageNumbers)
      for (const t of s.texts) {
        f.fillStyle = t.color;
        f.font = "22px sans-serif";
        f.fillText(
          t.text,
          t.x,
          t.y - (this.reducedMotion() ? 0 : (0.7 - t.life) * 18),
        );
      }
    for (let i = textUsed; i < this.worldTexts.length; i++)
      this.worldTexts[i].node.active = false;
    // Labels are UI-sized, independent of world zoom. All danger circles still render.
    const blocked: HazardRect[] = [{
      x: (p.x - cx) * scale, y: -(p.y - cy) * scale,
      width: 128 * scale, height: 128 * scale,
    }];
    const origin = this.battle.worldPosition, unit = this.battle.worldScale;
    for (const n of [this.skillLabel.node.parent, this.ultimateLabel.node.parent,
      this.interactLabel.node.parent, this.hud.node, this.controlsHint.node,
      this.routeLabel.node, this.responsive.battleStatusNode,
      this.miniMap.node, this.joystick.node, this.movementToggle,
      ...this.weaponIcons.map(icon => icon.node), ...this.directionButtons.map(b => b.node)]) {
      const ui = n?.getComponent(UITransform);
      if (!n?.activeInHierarchy || !ui) continue;
      const pos = n.worldPosition, ns = n.worldScale;
      blocked.push({ x: (pos.x - origin.x) / unit.x, y: (pos.y - origin.y) / unit.y,
        width: ui.width * ns.x / unit.x, height: ui.height * ns.y / unit.y });
    }
    const labelView = { cx, cy, scale, width: field.width, height: field.height };
    const incoming = incomingThreats(s.enemies, s.enemyProjectiles, p, labelView, blocked,
      (ax, ay, bx, by, radius) => s.worldMap.projectileHit(ax, ay, bx, by, radius));
    let annotations: (HazardRect & { text: string; fontSize: number })[] = [...incoming, ...hazardLabels(s.hostileFields.fields,
      labelView, [...blocked, ...incoming])];
    const layoutKey = `${cx}:${cy}:${scale}:${field.width}:${field.height}`;
    // Hiding controls for a modal must not shuffle a frozen battlefield's cues.
    // Rotation changes the key and deliberately recomposes the new viewport.
    if (s.state !== C.GameState.PLAYING && this.dangerLayout?.session === s && this.dangerLayout.key === layoutKey)
      annotations = this.dangerLayout.annotations;
    else this.dangerLayout = { session: s, key: layoutKey, annotations };
    const ink = this.hazardInk;
    ink.clear();
    for (let i = 0; i < annotations.length; i++) {
      const a = annotations[i];
      ink.fillColor = new Color(23, 23, 25, 255);
      ink.rect(a.x - a.width / 2, a.y - a.height / 2, a.width, a.height); ink.fill();
      ink.strokeColor = new Color(130, 164, 171, 255); ink.lineWidth = 1;
      ink.rect(a.x - a.width / 2, a.y - a.height / 2, a.width, a.height); ink.stroke();
      let l = this.hazardTexts[i];
      if (!l) {
        l = this.label("", 0, 0, 16, ink.node);
        l.node.name = "Danger label"; this.hazardTexts.push(l);
      }
      l.node.active = true; l.node.setPosition(a.x, a.y);
      l.fontSize = a.fontSize; l.lineHeight = 22; l.color = new Color(245, 231, 201);
      l.string = a.text;
    }
    for (let i = annotations.length; i < this.hazardTexts.length; i++) this.hazardTexts[i].node.active = false;
  }
  onDestroy() {
    this.terrain?.destroy();
    this.sound?.destroy();
    input.off(Input.EventType.KEY_DOWN, this.keyDown, this);
    input.off(Input.EventType.KEY_UP, this.keyUp, this);
    input.off(Input.EventType.GAMEPAD_CHANGE, this.gamepadEvent, this);
    input.off(Input.EventType.GAMEPAD_INPUT, this.gamepadEvent, this);
    this.padDevices.clear();
    game.off(Game.EVENT_HIDE, this.hide, this);
    delete (globalThis as any).__cocosCheck;
  }
}

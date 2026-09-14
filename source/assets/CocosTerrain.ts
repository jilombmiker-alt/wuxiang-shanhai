import {
  Node,
  UITransform,
  Sprite,
  SpriteFrame,
  Texture2D,
  Rect,
  Size,
  JsonAsset,
  resources,
} from "cc";
import { planTerrain, TerrainPatch } from "./TerrainPlan";

type TerrainView = {
  x: number;
  y: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
};

/** Native sprite pool below combat. Canvas is used only by the offline asset exporter. */
export class CocosTerrain {
  readonly node: Node;
  status = "loading";
  patches: TerrainPatch[] = [];
  private textures = new Map<string, Texture2D>();
  private disposed = false;
  private pool: {
    node: Node;
    frame: SpriteFrame;
    sprite: Sprite;
    key: string;
  }[] = [];
  constructor(parent: Node) {
    this.node = new Node("Theme terrain");
    this.node.layer = parent.layer;
    parent.addChild(this.node);
  }
  private loadResource(path: string, type: any): Promise<any> {
    return new Promise((resolve, reject) =>
      resources.load(path, type, (e, a) => (e ? reject(e) : resolve(a))),
    );
  }
  async load() {
    try {
      const manifest = await this.loadResource("terrain/manifest", JsonAsset);
      const expected = [
        "forest-0.png",
        "forest-1.png",
        "crypt-0.png",
        "crypt-1.png",
        "tundra-0.png",
        "tundra-1.png",
      ];
      if (
        manifest.json.width !== 512 ||
        manifest.json.height !== 512 ||
        manifest.json.files?.length !== 6 ||
        !expected.every((name) =>
          manifest.json.files.some((f) => f.filename === name),
        )
      )
        throw Error("Invalid terrain manifest");
      const loaded = await Promise.all(
        expected.map(async (filename) => {
          const key = filename.replace(/\.png$/, ""),
            texture: Texture2D = await this.loadResource(
              `terrain/${key}/texture`,
              Texture2D,
            );
          if (texture.width !== 512 || texture.height !== 512)
            throw Error("Invalid terrain texture");
          texture.setFilters(
            Texture2D.Filter.NEAREST,
            Texture2D.Filter.NEAREST,
          );
          return { key, texture };
        }),
      );
      if (this.disposed) return;
      for (const { key, texture } of loaded) this.textures.set(key, texture);
      this.status = "ready";
    } catch {
      if (this.disposed) return;
      this.status = "unavailable";
      this.node.active = false;
    }
  }
  draw(session: any, scale = 0.525, visualView?: TerrainView) {
    this.node.active = this.status === "ready";
    if (!this.node.active) return false;
    const source = visualView || {
        x: session.camera.worldX,
        y: session.camera.worldY,
        width: session.canvas.width,
        height: session.canvas.height,
        cx: session.camera.worldX + session.canvas.width / 2,
        cy: session.camera.worldY + session.canvas.height / 2,
      },
      view = {
        x: source.x - 2,
        y: source.y - 2,
        width: source.width + 4,
        height: source.height + 4,
      };
    const patches = planTerrain(view, session.runMode, [
      ...session.worldMap.visibleStructures,
      ...session.interactions.objects,
    ]);
    // Bounded rendering only: never discard gameplay objects or change collision.
    if (!patches.length || patches.length > 512) {
      this.node.active = false;
      this.patches = [];
      return false;
    }
    this.patches = patches;
    const cx = source.cx,
      cy = source.cy;
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i],
        key = `${session.stageId}-${p.paved ? 1 : 0}`;
      let entry = this.pool[i];
      if (!entry) {
        const node = new Node("Terrain patch");
        node.layer = this.node.layer;
        this.node.addChild(node);
        node.addComponent(UITransform);
        const sprite = node.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        const frame = new SpriteFrame();
        frame.packable = false;
        entry = { node, sprite, frame, key: "" };
        this.pool.push(entry);
      }
      const { node, frame, sprite } = entry;
      node.active = true;
      const signature = `${key}:${p.u}:${p.v}:${p.width}:${p.height}`;
      if (entry.key !== signature) {
        // SIMPLE sprites do not subscribe to SpriteFrame UV_UPDATED. Rebind via public API.
        sprite.spriteFrame = null;
        frame.texture = this.textures.get(key);
        frame.rect = new Rect(p.u, p.v, p.width, p.height);
        frame.originalSize = new Size(p.width, p.height);
        sprite.spriteFrame = frame;
        entry.key = signature;
      }
      node.setPosition(
        (p.x + p.width / 2 - cx) * scale,
        -(p.y + p.height / 2 - cy) * scale,
      );
      node
        .getComponent(UITransform)
        .setContentSize(p.width * scale, p.height * scale);
    }
    for (let i = patches.length; i < this.pool.length; i++)
      this.pool[i].node.active = false;
    return true;
  }
  snapshot() {
    return {
      status: this.status,
      textures: this.textures.size,
      patches: this.patches.length,
      allocated: this.pool.length,
    };
  }
  destroy() {
    this.disposed = true;
    for (const entry of this.pool) entry.frame.destroy();
    this.node.destroy();
  }
}

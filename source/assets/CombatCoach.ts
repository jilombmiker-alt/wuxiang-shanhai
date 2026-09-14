export const COACH_IDS = [
  "move",
  "pickup",
  "skill",
  "interact",
  "route",
  "ultimate",
];
export type CoachContext = {
  time: number;
  playing: boolean;
  x: number;
  y: number;
  collected: number;
  level: number;
  orbs: number;
  enemies: number;
  near: boolean;
  interacting: boolean;
  roomReady: boolean;
  skillReady: boolean;
  ultimateReady: boolean;
};
export function coachCopy(
  id: string,
  mode: "keys" | "touch" | "pad",
  keys: Record<string, string>,
) {
  const move =
    mode === "touch"
      ? "左侧摇杆"
      : mode === "pad"
        ? "左摇杆"
        : `${keys.up}${keys.left}${keys.down}${keys.right}`;
  const action = (id: string, name: string, pad: string) =>
    mode === "touch"
      ? `点${name}`
      : mode === "pad"
        ? `按${pad}`
        : `按 ${keys[id]}`;
  return (
    {
      move: `${move}移动；武器自动攻击`,
      pickup: "靠近地上经验升级，选择构筑",
      skill: `${action("skill", "主动", "西键")}施法；使用后等待冷却`,
      interact: `${action("interact", "附近交互", "南键")}交互；选物品时战斗暂停`,
      route: `清房已开出口；${action("map", "路线图", "View")}找路`,
      ultimate: `终极已满；${action("ultimate", "终极", "北键")}释放`,
    }[id] || ""
  );
}

/** Read-only coaching: never moves a player, grants rewards, or pauses combat. */
export class CombatCoach {
  private seen: Set<string>;
  private dirty = false;
  private origin: { x: number; y: number } | null = null;
  private current: { id: string; since: number } | null = null;
  private nextAt = 0;
  constructor(history: string[] = []) {
    this.seen = new Set(history.filter((id) => COACH_IDS.includes(id)));
  }
  private learn(id: string) {
    if (!this.seen.has(id)) {
      this.seen.add(id);
      this.dirty = true;
    }
  }
  historyChange() {
    if (!this.dirty) return null;
    this.dirty = false;
    return Array.from(this.seen);
  }
  suspend() {
    this.current = null;
  }
  step(c: CoachContext) {
    this.origin ||= { x: c.x, y: c.y };
    const moved = Math.hypot(c.x - this.origin.x, c.y - this.origin.y) >= 32;
    if (moved) this.learn("move");
    if (c.collected > 0 || c.level > 1) this.learn("pickup");
    if (!c.skillReady) this.learn("skill");
    if (c.interacting) {
      this.learn("interact");
      if (this.current?.id === "interact") {
        this.current = null;
        this.nextAt = c.time + 3;
      }
    }
    if (!c.playing) return null;
    const eligible = [
      ["interact", c.near],
      ["route", c.roomReady],
      ["ultimate", c.ultimateReady],
      ["move", c.time < 20 && !moved],
      ["pickup", c.orbs > 0 && c.collected === 0 && c.level === 1],
      ["skill", c.time >= 5 && c.enemies > 0 && c.skillReady],
    ] as [string, boolean][];
    if (this.current) {
      if (
        eligible.some(([id, ok]) => id === this.current.id && ok) &&
        c.time - this.current.since < 12
      )
        return this.current.id;
      this.current = null;
      this.nextAt = c.time + 3;
    }
    if (c.time < this.nextAt) return null;
    const next = eligible.find(([id, ok]) => ok && !this.seen.has(id));
    if (!next) return null;
    this.current = { id: next[0], since: c.time };
    this.learn(next[0]);
    return next[0];
  }
}

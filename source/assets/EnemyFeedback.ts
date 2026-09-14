/** Presentation-only state. Never writes enemies or enters a covenant snapshot. */
export type EnemyPose = { key: string; x: number; y: number; size: number; facing: number };
export const ENEMY_FEEDBACK = Object.freeze({ hitHold: 0.6, deathDuration: 0.28, deathOpacity: 0.45, maxHits: 48, maxDeaths: 24 });
type Tracked = { hp: number; shield: number; pose: EnemyPose };
export class EnemyFeedback {
  private session: unknown;
  private room = "";
  private time = 0;
  private tracked = new Map<any, Tracked>();
  readonly hits = new Map<any, number>();
  readonly deaths: (EnemyPose & { remaining: number })[] = [];

  reset() {
    this.tracked.clear(); this.hits.clear(); this.deaths.length = 0;
    this.session = undefined; this.room = ""; this.time = 0;
  }
  observe(session: unknown, room: string, enemies: any[], time: number, reduced: boolean, pose: (enemy: any) => EnemyPose) {
    if (!Number.isFinite(time)) return;
    if (session !== this.session || room !== this.room || time < this.time) {
      this.reset(); this.session = session; this.room = room; this.time = time;
    }
    const elapsed = Math.max(0, time - this.time); this.time = time;
    for (const [e, remaining] of this.hits) {
      if (remaining <= elapsed || e.hp <= 0) this.hits.delete(e);
      else this.hits.set(e, remaining - elapsed);
    }
    for (let i = this.deaths.length - 1; i >= 0; i--)
      if ((this.deaths[i].remaining -= elapsed) <= 0) this.deaths.splice(i, 1);
    if (reduced) { this.hits.clear(); this.deaths.length = 0; }
    const next = new Map<any, Tracked>();
    for (const e of enemies) {
      if (!(e.hp > 0)) continue;
      const previous = this.tracked.get(e), shield = Number(e.shieldHp) || 0;
      if (!reduced && previous && (e.hp < previous.hp || shield < previous.shield)
          && (this.hits.has(e) || this.hits.size < ENEMY_FEEDBACK.maxHits))
        this.hits.set(e, ENEMY_FEEDBACK.hitHold);
      next.set(e, { hp: e.hp, shield, pose: pose(e) });
    }
    for (const [e, previous] of this.tracked) if (!next.has(e)) {
      this.hits.delete(e);
      // Despawn/room changes are not kills. A dead object's HP stays observable
      // even after the combat array removes it; use its last rendered pose.
      if (!reduced && e.hp <= 0 && this.deaths.length < ENEMY_FEEDBACK.maxDeaths)
        this.deaths.push({ ...previous.pose, remaining: ENEMY_FEEDBACK.deathDuration });
    }
    this.tracked = next;
  }
  deathAlpha(remaining: number) {
    return ENEMY_FEEDBACK.deathOpacity * Math.max(0, Math.min(1, remaining / ENEMY_FEEDBACK.deathDuration));
  }
}

/** Four restrained corner marks; never a flashing whole-body tint or area ring. */
export function renderEnemyHit(ctx: any, x: number, y: number, radius: number) {
  if (![x, y, radius].every(Number.isFinite) || radius <= 0) return;
  const r = radius + 3, length = Math.min(9, r * 0.35);
  ctx.save(); ctx.beginPath();
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    ctx.moveTo(x + sx * (r - length), y + sy * r);
    ctx.lineTo(x + sx * r, y + sy * r);
    ctx.lineTo(x + sx * r, y + sy * (r - length));
  }
  ctx.strokeStyle = "#171719"; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = "#c9a476"; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

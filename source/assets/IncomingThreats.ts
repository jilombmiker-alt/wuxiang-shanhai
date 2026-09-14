import { HazardRect, overlaps } from "./HazardLabels";

type Point = { x: number; y: number };
type View = { cx: number; cy: number; scale: number; width: number; height: number };
type Edge = "left" | "right" | "top" | "bottom";
type Ray = { a: Point; b: Point; radius: number };

/** First entry into the visible world rectangle, not the direction to the enemy. */
function entry(ray: Ray, view: View): Edge | null {
  const halfW = view.width / view.scale / 2, halfH = view.height / view.scale / 2;
  const left = view.cx - halfW, right = view.cx + halfW;
  const top = view.cy - halfH, bottom = view.cy + halfH;
  const a = ray.a, dx = ray.b.x - a.x, dy = ray.b.y - a.y;
  if (a.x >= left - ray.radius && a.x <= right + ray.radius &&
      a.y >= top - ray.radius && a.y <= bottom + ray.radius) return null;
  let enter = 0, leave = 1, side: Edge | null = null;
  for (const [start, delta, min, max, near, far] of [
    [a.x, dx, left, right, "left", "right"],
    [a.y, dy, top, bottom, "top", "bottom"],
  ] as [number, number, number, number, Edge, Edge][]) {
    if (Math.abs(delta) < 1e-9) { if (start < min || start > max) return null; }
    else {
      const t0 = (min - start) / delta, t1 = (max - start) / delta;
      const next = Math.min(t0, t1);
      if (next > enter) { enter = next; side = t0 < t1 ? near : far; }
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) return null;
    }
  }
  return side;
}

/** Pure presentation only. No timers, opacity pulses, random calls or combat writes. */
export function incomingThreats(enemies: any[], shots: any[], player: Point & { size: number },
  view: View, blocked: HazardRect[] = [],
  wallHit?: (ax: number, ay: number, bx: number, by: number, radius: number) => any) {
  const placed: (HazardRect & { text: string; fontSize: number; edge: Edge })[] = [];
  if (![view.cx, view.cy, view.scale, view.width, view.height, player.x, player.y, player.size].every(Number.isFinite) ||
      view.scale <= 0 || view.width < 120 || view.height < 64) return placed;
  const sides = new Set<Edge>();
  const inspect = (ray: Ray) => {
    if (![ray.a.x, ray.a.y, ray.b.x, ray.b.y, ray.radius].every(Number.isFinite)) return;
    const dx = ray.b.x - ray.a.x, dy = ray.b.y - ray.a.y, length2 = dx * dx + dy * dy;
    if (length2 < 1e-6) return;
    const t = Math.max(0, Math.min(1, ((player.x - ray.a.x) * dx + (player.y - ray.a.y) * dy) / length2));
    const closest = { x: ray.a.x + dx * t, y: ray.a.y + dy * t };
    // Nearby trajectory corridor, not an assertion that this shot must hit.
    if (Math.hypot(closest.x - player.x, closest.y - player.y) > player.size + ray.radius + 64) return;
    const side = entry(ray, view);
    if (!side || sides.has(side) || wallHit?.(ray.a.x, ray.a.y, closest.x, closest.y, ray.radius)) return;
    sides.add(side);
  };
  for (const e of enemies) {
    const aim = e.hp > 0 && e.rangedAim;
    if (!aim || !Number.isFinite(aim.remaining) || aim.remaining <= 0 || !Number.isFinite(aim.length) || aim.length <= 0) continue;
    inspect({ a: { x: aim.x, y: aim.y }, b: { x: aim.x + Math.cos(aim.angle) * aim.length,
      y: aim.y + Math.sin(aim.angle) * aim.length }, radius: 6 });
  }
  for (const s of shots) {
    if (s.shouldRemove || !Number.isFinite(s.life) || s.life <= 0) continue;
    const horizon = Math.min(s.life, 1.5);
    inspect({ a: { x: s.x, y: s.y }, b: { x: s.x + s.vx * horizon, y: s.y + s.vy * horizon }, radius: s.size || 6 });
  }
  const names = { left: "左侧来袭", right: "右侧来袭", top: "上方来袭", bottom: "下方来袭" };
  const width = 96, height = 28, margin = 8;
  // One fixed-position label per edge. Quantity and remaining time never pulse it.
  for (const edge of ["left", "right", "top", "bottom"] as Edge[]) {
    if (!sides.has(edge)) continue;
    let done = false;
    // Fixed inner rows let top HUD/bottom touch controls keep their space.
    for (const inset of [0, 36, 72, 108, 144, 180, 216]) {
    for (const offset of [0, .22, -.22, .36, -.36]) {
      const vertical = edge === "left" || edge === "right";
      const depth = vertical ? view.width / 2 - width / 2 - margin - inset : view.height / 2 - height / 2 - margin - inset;
      if (depth <= 0) continue;
      const x = vertical ? (edge === "left" ? -1 : 1) * depth : offset * view.width;
      const y = vertical ? offset * view.height : (edge === "top" ? 1 : -1) * depth;
      const rect = { x, y, width, height };
      if (Math.abs(x) + width / 2 > view.width / 2 - margin || Math.abs(y) + height / 2 > view.height / 2 - margin ||
          blocked.some(b => overlaps(rect, b)) || placed.some(b => overlaps(rect, b))) continue;
      placed.push({ ...rect, edge, text: names[edge], fontSize: 16 }); done = true; break;
    }
    if (done) break;
    }
  }
  return placed;
}

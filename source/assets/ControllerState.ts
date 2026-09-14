import { applyGamepadDeadzone } from "./shared-core.js";

export type PadFrame = {
  id: number;
  x: number;
  y: number;
  buttons: Record<string, boolean>;
};

/** Engine-independent safety policy. One device owns input until disconnected. */
export class ControllerState {
  id: number | null = null;
  blocked = true;
  private previous: Record<string, boolean> = {};
  private direction = "";
  private repeat = 0;
  block() {
    this.blocked = true;
    this.direction = "";
    this.repeat = 0;
  }
  step(devices: PadFrame[], dt: number) {
    const lost = this.id !== null && !devices.some((d) => d.id === this.id);
    if (lost) {
      this.id = null;
      this.previous = {};
      this.block();
      return { lost: true, x: 0, y: 0, actions: [] as string[] };
    }
    if (this.id === null && devices.length) {
      this.id = devices[0].id;
      this.block();
    }
    const pad = devices.find((d) => d.id === this.id);
    if (!pad) return { lost: false, x: 0, y: 0, actions: [] as string[] };
    const axis = (v: number) =>
      applyGamepadDeadzone(
        Number.isFinite(v) ? Math.max(-1, Math.min(1, v)) : 0,
      );
    let x = axis(pad.x),
      y = axis(pad.y);
    const length = Math.hypot(x, y);
    if (length > 1) {
      x /= length;
      y /= length;
    }
    const actions: string[] = [];
    if (this.blocked) {
      // Release every control after connect, hide, or a modal transition.
      if (!x && !y && !Object.values(pad.buttons).some(Boolean))
        this.blocked = false;
      this.previous = { ...pad.buttons };
      return { lost: false, x: 0, y: 0, actions };
    }
    for (const name of Object.keys(pad.buttons))
      if (pad.buttons[name] && !this.previous[name]) actions.push(name);
    this.previous = { ...pad.buttons };
    const direction =
      Math.max(Math.abs(x), Math.abs(y)) < 0.45
        ? ""
        : Math.abs(x) > Math.abs(y)
          ? x > 0
            ? "right"
            : "left"
          : y > 0
            ? "down"
            : "up";
    if (direction !== this.direction) {
      this.direction = direction;
      this.repeat = 0.4;
      if (direction) actions.push(direction);
    } else if (direction) {
      this.repeat -= Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0;
      if (this.repeat <= 0) {
        actions.push(direction);
        this.repeat = 0.18;
      }
    }
    return { lost: false, x, y, actions };
  }
}

/** Choose a visible neighbour in UI coordinates; shoulders also traverse all. */
export function neighbour<T extends { x: number; y: number }>(
  list: T[],
  current: T,
  direction: string,
): T {
  const dx = direction === "left" ? -1 : direction === "right" ? 1 : 0;
  const dy = direction === "down" ? -1 : direction === "up" ? 1 : 0;
  let best = current,
    score = Infinity;
  for (const item of list) {
    const x = item.x - current.x,
      y = item.y - current.y;
    const forward = x * dx + y * dy,
      cross = Math.abs(x * dy - y * dx);
    if (forward <= 1) continue;
    const value = Math.hypot(x, y) + cross * 2;
    if (value < score) {
      score = value;
      best = item;
    }
  }
  return best;
}

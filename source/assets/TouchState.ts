type Direction = { x: number; y: number };
/** Pointer ownership only; no gameplay, time or damage calculations. */
export class TouchState {
  private moves = new Map<number, Direction>();
  private presses = new Map<number, string>();
  private valid(id: number | null): id is number {
    return typeof id === "number" && Number.isInteger(id) && id >= 0;
  }
  beginMove(id: number | null, x: number, y: number) {
    if (!this.valid(id) || this.moves.has(id)) return;
    this.moves.set(id, { x: Math.sign(x) || 0, y: Math.sign(y) || 0 });
  }
  move(id: number | null, x: number, y: number) {
    if (!this.valid(id) || !this.moves.has(id)) return;
    this.moves.set(id, { x: Math.sign(x) || 0, y: Math.sign(y) || 0 });
  }
  endMove(id: number | null) {
    if (this.valid(id)) this.moves.delete(id);
  }
  get vector(): Direction {
    let x = 0,
      y = 0;
    for (const d of Array.from(this.moves.values())) {
      x += d.x;
      y += d.y;
    }
    return { x: Math.sign(x), y: Math.sign(y) };
  }
  moving(x: number, y: number) {
    return Array.from(this.moves.values()).some((d) => d.x === x && d.y === y);
  }
  beginPress(id: number | null, button: string) {
    if (!this.valid(id) || this.presses.has(id) || this.pressed(button))
      return false;
    this.presses.set(id, button);
    return true;
  }
  pressed(button: string) {
    return Array.from(this.presses.values()).includes(button);
  }
  endPress(id: number | null, button: string, inside: boolean) {
    if (!this.valid(id) || this.presses.get(id) !== button) return false;
    this.presses.delete(id);
    return inside;
  }
  cancelPress(id: number | null, button: string) {
    this.endPress(id, button, false);
  }
  clear() {
    this.moves.clear();
    this.presses.clear();
  }
}

import { sampleJoystick } from "./shared-core.js";
export class JoystickState {
  owner: number | null = null;
  value = sampleJoystick(0, 0);
  begin(id: number | null, x: number, y: number) {
    if (this.owner !== null || id === null || !Number.isInteger(id) || id < 0)
      return;
    this.owner = id;
    this.move(id, x, y);
  }
  move(id: number | null, x: number, y: number) {
    if (this.owner === null || this.owner !== id) return;
    this.value = sampleJoystick(x, y, 50);
  }
  end(id: number | null) {
    if (this.owner === id) this.clear();
  }
  clear() {
    this.owner = null;
    this.value = sampleJoystick(0, 0);
  }
}

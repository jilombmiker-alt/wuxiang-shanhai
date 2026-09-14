import { Node, UITransform, Graphics, Color, EventTouch, Vec3 } from "cc";
import { JoystickState } from "./JoystickState";

/** Existing shared joystick math, native Cocos input and drawing. */
export class CocosJoystick {
  readonly state = new JoystickState();
  readonly node: Node;
  private knob: Node;
  private base: Graphics;
  private ink: Graphics;
  private ring: Graphics;
  private wasHeld = false;
  rebuildCount = 0;
  constructor(host: any) {
    this.node = host.child("移动摇杆");
    this.node.addComponent(UITransform).setContentSize(156, 156);
    this.base = this.node.addComponent(Graphics);
    const held = host.child("Held", this.node);
    this.ring = held.addComponent(Graphics);
    held.active = false;
    this.knob = host.child("Knob", this.node);
    this.ink = this.knob.addComponent(Graphics);
    this.redrawVisuals();
    const local = (e: EventTouch) => {
      const p = e.getUILocation();
      return this.node
        .getComponent(UITransform)
        .convertToNodeSpaceAR(new Vec3(p.x, p.y, 0));
    };
    this.node.on(Node.EventType.TOUCH_START, (e: EventTouch) => {
      if (!host.canTouch(this.node) || host.session?.state !== "playing")
        return;
      const p = local(e);
      if (Math.hypot(p.x, p.y) > 74) return;
      this.state.begin(e.getID(), p.x, -p.y);
      host.padVisible = false;
    });
    this.node.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => {
      const p = local(e);
      this.state.move(e.getID(), p.x, -p.y);
    });
    for (const type of [Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL])
      this.node.on(type, (e: EventTouch) => this.state.end(e.getID()));
    this.node.active = false;
  }
  /** Rebuild after activation: native Graphics can discard inactive render data. */
  setVisible(visible: boolean) {
    if (this.node.active === visible) return;
    this.node.active = visible;
    if (visible) this.redrawVisuals();
  }
  private redrawVisuals() {
    this.rebuildCount++;
    const base = this.base;
    base.clear();
    base.fillColor = new Color("#223a30");
    base.circle(0, 0, 74);
    base.fill();
    base.strokeColor = new Color("#a5b596");
    base.lineWidth = 2;
    base.circle(0, 0, 74);
    base.stroke();
    base.strokeColor = new Color("#708b78");
    base.circle(0, 0, 50);
    base.stroke();
    for (const [x, y] of [
      [0, 64],
      [0, -64],
      [64, 0],
      [-64, 0],
    ]) {
      base.moveTo(x * 0.88, y * 0.88);
      base.lineTo(x, y);
      base.stroke();
    }
    this.ink.clear();
    this.ink.fillColor = new Color("#9fb18e");
    this.ink.circle(0, 0, 21);
    this.ink.fill();
    this.ink.strokeColor = new Color("#e7e8cf");
    this.ink.lineWidth = 2;
    this.ink.circle(0, 0, 21);
    this.ink.stroke();
    this.redrawHeldRing();
  }
  private redrawHeldRing() {
    this.ring.clear();
    this.ring.strokeColor = new Color("#eed493");
    this.ring.lineWidth = 3;
    this.ring.circle(0, 0, 74);
    this.ring.stroke();
  }
  clear() {
    this.state.clear();
    this.draw();
  }
  draw() {
    this.knob.setPosition(this.state.value.knobX, -this.state.value.knobY);
    const held = this.state.owner !== null;
    if (held !== this.wasHeld) {
      this.ring.node.active = held;
      if (held) this.redrawHeldRing();
      this.wasHeld = held;
    }
  }
}

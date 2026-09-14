import { _decorator, Component, Graphics, UITransform } from "cc";

const { ccclass } = _decorator;

/** Native Graphics releases its render data when disabled. Restore the actual
 * panel rectangle on every enable, including ancestor and reparent toggles. */
@ccclass("PanelInk")
export class PanelInk extends Component {
  onEnable() {
    const g = this.getComponent(Graphics);
    const ui = this.getComponent(UITransform);
    if (!g || !ui) return;
    const { width, height } = ui;
    g.clear();
    g.rect(-width / 2, -height / 2, width, height);
    g.fill();
    g.rect(-width / 2, -height / 2, width, height);
    g.stroke();
  }
}

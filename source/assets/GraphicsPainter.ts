import { Graphics, Color } from "cc";

export type PaintViewport = {
  left: number;
  right: number;
  bottom: number;
  top: number;
};

/** Existing skill geometry -> native Cocos Graphics, no Canvas/DOM/WebView.
 * Glow is intentionally omitted. World coordinates retain original hit geometry. */
export class GraphicsPainter {
  fillStyle = "#fff";
  strokeStyle = "#fff";
  globalAlpha = 1;
  lineWidth = 1;
  shadowColor = "";
  shadowBlur = 0;
  font = "12px sans-serif";
  textAlign = "center";
  lineCap = "butt";
  private matrix = [1, 0, 0, 1, 0, 0];
  private stack: any[] = [];
  private path: any[] = [];
  private current = [0, 0];
  constructor(
    private graphics: Graphics,
    x = 0,
    y = 0,
    private text?: (
      value: string,
      x: number,
      y: number,
      size: number,
      color: Color,
    ) => void,
    private viewport?: PaintViewport,
  ) {
    this.translate(x, y);
  }
  save() {
    this.stack.push({
      matrix: [...this.matrix],
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      font: this.font,
      textAlign: this.textAlign,
      lineCap: this.lineCap,
    });
  }
  restore() {
    const state = this.stack.pop();
    if (state) Object.assign(this, state);
  }
  translate(x: number, y: number) {
    const m = this.matrix;
    m[4] += m[0] * x + m[2] * y;
    m[5] += m[1] * x + m[3] * y;
  }
  scale(x: number, y: number) {
    const m = this.matrix;
    m[0] *= x;
    m[1] *= x;
    m[2] *= y;
    m[3] *= y;
  }
  rotate(angle: number) {
    const [a, b, c, d] = this.matrix,
      s = Math.sin(angle),
      co = Math.cos(angle);
    this.matrix[0] = a * co + c * s;
    this.matrix[1] = b * co + d * s;
    this.matrix[2] = c * co - a * s;
    this.matrix[3] = d * co - b * s;
  }
  private point(x: number, y: number) {
    const m = this.matrix;
    return [m[0] * x + m[2] * y + m[4], -(m[1] * x + m[3] * y + m[5])];
  }
  beginPath() {
    this.path = [];
  }
  moveTo(x: number, y: number) {
    this.path.push(["M", ...this.point(x, y)]);
    this.current = [x, y];
  }
  lineTo(x: number, y: number) {
    this.path.push(["L", ...this.point(x, y)]);
    this.current = [x, y];
  }
  closePath() {
    this.path.push(["Z"]);
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number) {
    const [sx, sy] = this.current;
    for (let i = 1; i <= 12; i++) {
      const t = i / 12,
        u = 1 - t;
      this.lineTo(
        u * u * sx + 2 * u * t * cx + t * t * x,
        u * u * sy + 2 * u * t * cy + t * t * y,
      );
    }
  }
  arc(
    x: number,
    y: number,
    r: number,
    start: number,
    end: number,
    anticlockwise = false,
  ) {
    let sweep = end - start;
    if (anticlockwise && sweep > 0) sweep -= Math.PI * 2;
    if (!anticlockwise && sweep < 0) sweep += Math.PI * 2;
    const steps = Math.max(3, Math.ceil(Math.abs(sweep) * 12));
    for (let i = 0; i <= steps; i++) {
      const a = start + (sweep * i) / steps,
        px = x + Math.cos(a) * r,
        py = y + Math.sin(a) * r;
      if (i === 0 && !this.path.length) this.moveTo(px, py);
      else this.lineTo(px, py);
    }
  }
  private rectPath(x: number, y: number, w: number, h: number) {
    this.beginPath();
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
  }
  fillRect(x: number, y: number, w: number, h: number) {
    const p = this.path;
    this.rectPath(x, y, w, h);
    this.fill();
    this.path = p;
  }
  strokeRect(x: number, y: number, w: number, h: number) {
    const p = this.path;
    this.rectPath(x, y, w, h);
    this.stroke();
    this.path = p;
  }
  private color(value: string) {
    const rgba = value.match(/^rgba?\(([^)]+)\)/);
    const color = new Color();
    if (rgba) {
      const values = rgba[1].split(",").map(Number);
      color.set(
        values[0],
        values[1],
        values[2],
        Math.round((values[3] ?? 1) * 255),
      );
    } else Color.fromHEX(color, value);
    color.a = Math.round(color.a * Math.max(0, Math.min(1, this.globalAlpha)));
    return color;
  }
  private emit() {
    const g = this.graphics;
    for (const p of this.path) {
      if (p[0] === "M") g.moveTo(p[1], p[2]);
      else if (p[0] === "L") g.lineTo(p[1], p[2]);
      else g.close();
    }
  }
  /** Conservative rejection in already-transformed Cocos coordinates.
   * Never clip or move vertices: a crossing/enclosing path is drawn unchanged.
   * Unknown/non-finite geometry falls back to the original renderer.
   */
  private pathVisible(padding = 0) {
    const v = this.viewport;
    if (!v) return true;
    if (
      ![v.left, v.right, v.bottom, v.top, padding].every(Number.isFinite) ||
      v.left > v.right ||
      v.bottom > v.top ||
      padding < 0
    )
      return true;
    let left = Infinity,
      right = -Infinity,
      bottom = Infinity,
      top = -Infinity;
    for (const p of this.path) {
      if (p[0] === "Z") continue;
      if (!Number.isFinite(p[1]) || !Number.isFinite(p[2])) return true;
      left = Math.min(left, p[1]);
      right = Math.max(right, p[1]);
      bottom = Math.min(bottom, p[2]);
      top = Math.max(top, p[2]);
    }
    // Keep a two-pixel guard for rasterization at the viewport boundary.
    const guard = padding + 2;
    return (
      right + guard >= v.left &&
      left - guard <= v.right &&
      top + guard >= v.bottom &&
      bottom - guard <= v.top
    );
  }
  fill() {
    if (!this.pathVisible()) return;
    this.graphics.fillColor = this.color(this.fillStyle);
    this.emit();
    this.graphics.fill();
  }
  stroke() {
    const width = this.lineWidth * Math.hypot(this.matrix[0], this.matrix[1]);
    // Cocos defaults to miter joins. Include the complete possible join/cap
    // extension, not just half a line width, to avoid popping near the edge.
    const padding =
      Math.abs(width) * Math.max(1, this.graphics.miterLimit || 10);
    if (!this.pathVisible(padding)) return;
    this.graphics.strokeColor = this.color(this.strokeStyle);
    this.graphics.lineWidth = width;
    this.graphics.lineCap =
      this.lineCap === "round" ? Graphics.LineCap.ROUND : Graphics.LineCap.BUTT;
    this.emit();
    this.graphics.stroke();
  }
  fillText(value: string, x: number, y: number) {
    const [px, py] = this.point(x, y);
    const size =
      (parseFloat(this.font) || 12) *
      Math.hypot(this.matrix[0], this.matrix[1]);
    this.text?.(value, px, py + size / 2, size, this.color(this.fillStyle));
  }
}

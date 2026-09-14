/** Render-only screen-space annotation. Never mutates fields or combat clocks. */
export type HazardRect = { x: number; y: number; width: number; height: number };
export function overlaps(a: HazardRect, b: HazardRect, gap = 4) {
  return Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap;
}
export function hazardLabels(fields: any[], view: {
  cx: number; cy: number; scale: number; width: number; height: number;
}, blocked: HazardRect[] = []) {
  const placed: (HazardRect & { text: string; anchorX: number; anchorY: number; fontSize: number })[] = [];
  const fontSize = 16, height = 28, margin = 8;
  for (const f of fields.slice(0, 24)) {
    if (![f.x, f.y, f.radius, f.age, f.warning, f.duration].every(Number.isFinite) ||
        f.radius <= 0 || f.age >= f.warning + f.duration) continue;
    const x = (f.x - view.cx) * view.scale, y = -(f.y - view.cy) * view.scale;
    const r = f.radius * view.scale;
    if (Math.abs(x) > view.width / 2 + r || Math.abs(y) > view.height / 2 + r) continue;
    const name = String(f.label || '异变').replace(/[\r\n\t]/g, '').slice(0, 8);
    const text = `${name} · ${f.age < f.warning ? '将至' : '危险'}`;
    const width = Math.max(132, text.length * fontSize + 16);
    // Fixed candidate order. No nearest-first sorting or oscillating animation.
    const offset = r + height / 2 + 8;
    const candidates = [[x, y - offset], [x, y + offset],
      [x - r - width / 2 - 8, y], [x + r + width / 2 + 8, y]];
    for (const [px, py] of candidates) {
      const rect = { x: px, y: py, width, height };
      if (Math.abs(px) + width / 2 > view.width / 2 - margin ||
          Math.abs(py) + height / 2 > view.height / 2 - margin ||
          blocked.some(b => overlaps(rect, b)) || placed.some(b => overlaps(rect, b))) continue;
      placed.push({ ...rect, text, fontSize, anchorX: x, anchorY: y });
      break;
    }
  }
  return placed;
}

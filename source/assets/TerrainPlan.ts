import {
  terrainRoads,
  terrainCourtyard,
  TERRAIN_TILE_SIZE,
} from "./shared-core.js";
export type TerrainRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type TerrainPatch = TerrainRect & {
  u: number;
  v: number;
  paved: boolean;
};
export const TERRAIN_PERIOD = TERRAIN_TILE_SIZE * 2;

/** Source UV origin is always world origin, including negative endless coordinates. */
export function terrainFragments(
  rect: TerrainRect,
  view: TerrainRect,
  paved = false,
): TerrainPatch[] {
  if (
    ![view.x, view.y, view.width, view.height].every(Number.isFinite) ||
    Math.abs(view.x) > Number.MAX_SAFE_INTEGER - 8192 ||
    Math.abs(view.y) > Number.MAX_SAFE_INTEGER - 8192 ||
    ![
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      view.x,
      view.y,
      view.width,
      view.height,
    ].every(Number.isFinite)
  )
    return [];
  const left = Math.max(rect.x, view.x),
    top = Math.max(rect.y, view.y),
    right = Math.min(rect.x + rect.width, view.x + view.width),
    bottom = Math.min(rect.y + rect.height, view.y + view.height),
    out: TerrainPatch[] = [];
  if (
    right <= left ||
    bottom <= top ||
    [left, top, right, bottom].some(
      (n) => Math.abs(n) > Number.MAX_SAFE_INTEGER - 8192,
    )
  )
    return out;
  for (
    let y = Math.floor(top / TERRAIN_PERIOD) * TERRAIN_PERIOD;
    y < bottom;
    y += TERRAIN_PERIOD
  )
    for (
      let x = Math.floor(left / TERRAIN_PERIOD) * TERRAIN_PERIOD;
      x < right;
      x += TERRAIN_PERIOD
    ) {
      const a = Math.max(x, left),
        b = Math.max(y, top);
      out.push({
        x: a,
        y: b,
        width: Math.min(x + TERRAIN_PERIOD, right) - a,
        height: Math.min(y + TERRAIN_PERIOD, bottom) - b,
        u: a - x,
        v: b - y,
        paved,
      });
    }
  return out;
}
export function planTerrain(
  view: TerrainRect,
  mode: string,
  structures: any[],
) {
  if (
    ![view.x, view.y, view.width, view.height].every(Number.isFinite) ||
    Math.abs(view.x) > Number.MAX_SAFE_INTEGER - 8192 ||
    Math.abs(view.y) > Number.MAX_SAFE_INTEGER - 8192 ||
    view.width <= 0 ||
    view.height <= 0 ||
    view.width > 4096 ||
    view.height > 4096
  )
    return [];
  // Render whole world cells. Camera-edge UV clipping causes nearest-neighbour shimmer.
  const left = Math.floor(view.x / TERRAIN_PERIOD) * TERRAIN_PERIOD,
    top = Math.floor(view.y / TERRAIN_PERIOD) * TERRAIN_PERIOD,
    bounds = {
      x: left,
      y: top,
      width:
        Math.ceil((view.x + view.width) / TERRAIN_PERIOD) * TERRAIN_PERIOD -
        left,
      height:
        Math.ceil((view.y + view.height) / TERRAIN_PERIOD) * TERRAIN_PERIOD -
        top,
    };
  const patches = terrainFragments(bounds, bounds);
  for (const road of terrainRoads(bounds, mode))
    patches.push(...terrainFragments(road, bounds, true));
  for (const structure of structures) {
    const yard = terrainCourtyard(structure);
    if (yard) patches.push(...terrainFragments(yard, bounds, true));
  }
  return patches;
}

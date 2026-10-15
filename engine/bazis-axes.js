// ============================================================
// ELVIN -> BAZIS AXES
// ============================================================
// Elvin (Engine, 3D, specification):
//   X = width, Y = depth (Y=0 is the carcass FRONT), Z = height.
//
// BAZIS 10 (from the factory reference script "ТИМА ПЕТРАШ Ш 1"):
//   x = width, y = height (floor = 0), z = depth,
//   back HDF at z = -3..0, plinth front at z = D-20-T
//   -> carcass back is z = 0, carcass front is z = D.
//
// Panel creation in the reference script:
//   vertical  NewPanel(depth, height)  — sides, partitions
//   horizont  NewPanel(width, depth)   — bottom, top, shelves
//   front     NewPanel(width, height)  — back HDF, plinth, facades
//
// OPEN QUESTION: in the reference script shelves "inset 50 mm from the
// front" are placed at z = 50..600, i.e. against the front (z = D) and
// 50 mm away from the back. Until this is confirmed in BAZIS, the
// generated code is a preview only (productionReady = false).
// ============================================================

import { thicknessAxis } from "./geometry.js";

const PANEL = {
  x: { orientation: "vertical", texture: "vertical", dims: p => [p.size_y_mm, p.size_z_mm] },
  z: { orientation: "horizont", texture: "horizontal", dims: p => [p.size_x_mm, p.size_y_mm] },
  // Grain direction of frontal panels differs per part (TYL vertical,
  // COKOL horizontal) and is not derived automatically.
  y: { orientation: "front", texture: null, dims: p => [p.size_x_mm, p.size_z_mm] }
};

const round2 = n => Math.round(n * 100) / 100;

/**
 * BAZIS placement of an Elvin part.
 * @param {Object} part   Engine part (min corner + sizes, Elvin axes).
 * @param {number} depth  Carcass depth D (Elvin Y=0 front -> BAZIS z=D).
 * @returns {{orientation, texture, panel:[number,number], min:{x,y,z}}|null}
 */
export function toBazisPlacement(part, depth) {
  const axis = thicknessAxis(part);
  const spec = PANEL[axis];
  if (!spec || !Number.isFinite(depth)) return null;
  return {
    orientation: spec.orientation,
    texture: spec.texture,
    panel: spec.dims(part).map(round2),
    min: {
      x: round2(part.x_mm),
      y: round2(part.z_mm),
      z: round2(depth - (part.y_mm + part.size_y_mm))
    }
  };
}

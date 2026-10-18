// ============================================================
// ELVIN MOUNTING (MountScheme pairs)
// ============================================================
// Factory rule: carcass fastening is confirmat + dowel through the tested
// BAZIS MountScheme, and drilling must follow the panel pairs that really
// touch. A pair (a, b) means: an END face of `a` rests on the large face
// of `b` — exactly the pairs of the factory reference script:
//   DNO/KR -> sides, ST_SR -> DNO/KR, shelves -> sides/partitions,
//   COKOL -> sides/DNO.
// HDF and facades are not mounted with MountScheme.
// ============================================================

import { partBox, thicknessAxis, GEOMETRY_EPS_MM } from "./geometry.js";

const AXES = ["x", "y", "z"];
const near = (a, b) => Math.abs(a - b) <= GEOMETRY_EPS_MM;
const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
const mountable = p => p.role !== "back" && p.role !== "facade";

export function computeMounts(parts) {
  const items = parts.filter(mountable).map(p => ({ p, box: partBox(p), axis: thicknessAxis(p) })).filter(i => i.axis);
  const mounts = [];
  for (const a of items) {
    for (const b of items) {
      if (a === b) continue;
      // Contact along b's thickness axis: b's large face meets a's end face.
      const k = b.axis;
      if (a.axis === k) continue;
      const touch = near(a.box[k + "0"], b.box[k + "1"]) || near(a.box[k + "1"], b.box[k + "0"]);
      if (!touch) continue;
      const area = AXES.filter(o => o !== k).every(o => overlap(a.box[o + "0"], a.box[o + "1"], b.box[o + "0"], b.box[o + "1"]) > GEOMETRY_EPS_MM);
      if (area) mounts.push({ type: "MountScheme", a: a.p.id, b: b.p.id });
    }
  }
  return mounts;
}

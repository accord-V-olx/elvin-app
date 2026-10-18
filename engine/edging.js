// ============================================================
// ELVIN EDGING
// ============================================================
// Assigns edge banding to every panel from the factory rules
// (rules/wardrobe-rules.js -> edging), using only the geometry of the
// part list:
//   - front edge (faces the room, Y = min)        -> visible edge (KR08)
//   - rear edge (Y = max)                         -> rear technical edge (BUM02)
//   - an edge face covered by another panel       -> no edge
//     (thin HDF does not count as covering)
//   - any other end (open, on the floor)          -> visible edge (KR08)
//   - facades keep their own edges (KR08 all round)
//   - HDF gets no edges
// Matches the real GibLab orders: overlay KR/DNO = front, left, right
// KR08 + rear BUM02; sides between top and bottom = front KR08 + rear
// BUM02; side under an inset top = also top KR08; shelves = front KR08
// + rear BUM02; panels against a DSP back = no rear edge.
// ============================================================

import { partBox, thicknessAxis, GEOMETRY_EPS_MM } from "./geometry.js";

const AXES = ["x", "y", "z"];
const FACE_NAMES = {
  x: { min: "left", max: "right" },
  y: { min: "front", max: "back" },
  z: { min: "bottom", max: "top" }
};

const near = (a, b) => Math.abs(a - b) <= GEOMETRY_EPS_MM;
const overlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

// Is the face (axis, side) of box `a` touched by box `b` over a real area?
function touches(a, b, axis, side) {
  const contact = side === "min" ? near(b[axis + "1"], a[axis + "0"]) : near(b[axis + "0"], a[axis + "1"]);
  if (!contact) return false;
  return AXES.filter(o => o !== axis).every(o => overlap(a[o + "0"], a[o + "1"], b[o + "0"], b[o + "1"]) > GEOMETRY_EPS_MM);
}

function touchesWithin(a, b, axis, gap) {
  const d = b[axis + "0"] - a[axis + "1"];
  if (d < -GEOMETRY_EPS_MM || d > gap + GEOMETRY_EPS_MM) return false;
  return AXES.filter(o => o !== axis).every(o => overlap(a[o + "0"], a[o + "1"], b[o + "0"], b[o + "1"]) > GEOMETRY_EPS_MM);
}

// Thin back panels (HDF) do not hide an edge.
const covers = p => !(p.role === "back" && p.thickness_mm < 10) && p.role !== "facade";

/**
 * @param {Array} parts  Engine parts (mutated: `edges` is filled).
 * @param {Object} codes {visible: "KR08", rear: "BUM02"}
 */
export function applyEdging(parts, codes) {
  const boxes = parts.map(p => [p, partBox(p)]);
  for (const [p, box] of boxes) {
    if (p.role === "facade" || p.role === "back") continue;
    const axis = thicknessAxis(p);
    if (!axis) continue;
    const edges = {};
    for (const a of AXES.filter(o => o !== axis)) {
      for (const side of ["min", "max"]) {
        const name = FACE_NAMES[a][side];
        // A DSP back 1 mm behind a shelf still hides its rear edge.
        const covered = boxes.some(([o, ob]) => o !== p && covers(o) &&
          (touches(box, ob, a, side) || (name === "back" && o.role === "back" && touchesWithin(box, ob, a, 1.5))));
        if (covered) edges[name] = null;
        else if (name === "back") edges[name] = codes.rear;
        else edges[name] = codes.visible;
      }
    }
    p.edges = edges;
  }
  return parts;
}

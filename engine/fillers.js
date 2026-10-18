// ============================================================
// ELVIN FILLERS (planky / dobory)
// ============================================================
// Extra front strips that close the gap to uneven walls and ceiling.
// Factory practice (owner, 18.10.2026): a wardrobe 2000 high x 1000
// wide with "20" at both walls and "+20" on top gets
//   left  2000 x 20, right 2000 x 20, top 1000 x 20.
// Side strips run the full height of the adjacent carcass, the top strip
// runs the full width of each carcass (the drawing marks "+20" per module).
// Strips are carcass material and stand in the facade plane.
//
// Input: fillers = { left_mm, right_mm, top_mm } (null / 0 = none).
// modules: [{ x0, x1, height, yFront }] left -> right, Elvin axes.
// ============================================================

const positive = v => Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : 0;

export function buildFillers(fillers, modules, opts) {
  if (!fillers || !modules.length) return [];
  const t = opts.thickness_mm;
  const left = positive(fillers.left_mm), right = positive(fillers.right_mm), top = positive(fillers.top_mm);
  const parts = [];
  const strip = (id, x, z, sx, sz, yFront) => ({
    id, name: "PLANKA", role: "filler", type: "front", qty: 1,
    x_mm: x, y_mm: yFront - t, z_mm: z, size_x_mm: sx, size_y_mm: t, size_z_mm: sz,
    thickness_mm: t, material: opts.material,
    edges: { top: opts.edge, bottom: opts.edge, left: opts.edge, right: opts.edge },
    outside_envelope_allowed: true
  });
  const first = modules[0], last = modules[modules.length - 1];
  if (left) parts.push(strip("filler_left", first.x0 - left, 0, left, first.height, first.yFront));
  if (right) parts.push(strip("filler_right", last.x1, 0, right, last.height, last.yFront));
  if (top) modules.forEach((m, i) => parts.push(strip(modules.length > 1 ? "filler_top_" + (i + 1) : "filler_top",
    m.x0, m.height, m.x1 - m.x0, top, m.yFront)));
  return parts;
}

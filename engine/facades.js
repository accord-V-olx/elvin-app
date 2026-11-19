// ============================================================
// ELVIN FACADES (overlay)
// ============================================================
// Builds overlay facades of one carcass from a confirmed layout and the
// factory gap rules (rules/wardrobe-rules.js -> facades.overlay):
//   top 3, bottom 3, left 2, right 2, between adjacent facades 4 mm.
//
// Layout (construction.facades_layout):
//   {
//     columns: [                      // left -> right
//       { width_mm: null,             // null = equal split of the free width
//         rows: [                     // bottom -> top
//           { height_mm: 2255, kind: "door" },
//           { height_mm: 521,  kind: "door" }
//         ] }
//     ]
//   }
// A column with one row and height_mm null takes the full height.
// Row heights are facade sizes from the drawing; the chain must close:
//   bottom + sum(rows) + (rows - 1) x between + top = facade zone height.
// Equal column widths that are not whole numbers use the symmetric
// floating side gap (1.5-4 mm) allowed by the rules; otherwise ASK.
// ============================================================

import { GEOMETRY_EPS_MM } from "./geometry.js";

const fmt = n => String(Math.round(n * 100) / 100);

/**
 * @param {Object} layout  construction.facades_layout
 * @param {Object} zone    {x0, x1, z0, z1, yFront} area covered by the facades
 * @param {Object} opts    {thickness_mm, material, gaps, floating}
 * @returns {{ok, parts, errors}}
 */
export function buildFacades(layout, zone, opts) {
  const errors = [];
  const parts = [];
  const g = opts.gaps;
  const ask = (field, question) => errors.push({ field: "construction.facades_layout" + field, question });

  const columns = Array.isArray(layout?.columns) ? layout.columns : [];
  if (!columns.length) {
    ask("", "Опишіть фасади: скільки дверей / шухляд по ширині і їх висоти за кресленням.");
    return { ok: false, parts, errors };
  }

  // ---- widths --------------------------------------------------------------
  const W = zone.x1 - zone.x0;
  const given = columns.map(c => Number(c?.width_mm));
  const known = given.filter(v => Number.isFinite(v) && v > 0);
  const nFree = columns.length - known.length;
  const between = (columns.length - 1) * g.betweenAdjacentFacades;
  let sideL = g.left, sideR = g.right;
  let freeWidth = nFree ? (W - sideL - sideR - between - known.reduce((s, v) => s + v, 0)) / nFree : 0;
  if (nFree && Math.abs(freeWidth - Math.round(freeWidth)) > GEOMETRY_EPS_MM) {
    // Floating symmetric side gap to keep equal whole-number widths.
    const whole = Math.floor(freeWidth);
    const side = (W - between - known.reduce((s, v) => s + v, 0) - whole * nFree) / 2;
    if (side >= opts.floating.min - GEOMETRY_EPS_MM && side <= opts.floating.max + GEOMETRY_EPS_MM) {
      freeWidth = whole; sideL = sideR = side;
    }
  }
  const widths = given.map(v => (Number.isFinite(v) && v > 0 ? v : freeWidth));
  const widthChain = sideL + sideR + between + widths.reduce((s, v) => s + v, 0);
  if (widths.some(w => !(w > 0)) || Math.abs(widthChain - W) > GEOMETRY_EPS_MM) {
    ask(".columns", "Ширини фасадів не сходяться: " + widths.map(fmt).join(" + ") + " + зазори " +
      fmt(sideL) + "/" + fmt(g.betweenAdjacentFacades) + "/" + fmt(sideR) + " = " + fmt(widthChain) +
      " мм, а ширина під фасади " + fmt(W) + " мм.");
    return { ok: false, parts: [], errors };
  }

  // ---- heights per column -------------------------------------------------
  const H = zone.z1 - zone.z0;
  let x = zone.x0 + sideL;
  columns.forEach((col, ci) => {
    const rows = Array.isArray(col?.rows) && col.rows.length ? col.rows : [{ height_mm: null, kind: "door" }];
    let heights = rows.map(r => Number(r?.height_mm));
    if (rows.length === 1 && !(heights[0] > 0)) heights = [H - g.bottom - g.top];
    const unknown = heights.map((h, i) => (h > 0 ? null : i + 1)).filter(Boolean);
    if (unknown.length) {
      ask(".columns[" + ci + "].rows", "Не вказана висота фасадів " + unknown.map(i => "№" + i).join(", ") + " у колонці " + (ci + 1) + ".");
      x += widths[ci] + g.betweenAdjacentFacades;
      return;
    }
    const chain = g.bottom + g.top + (rows.length - 1) * g.betweenAdjacentFacades + heights.reduce((s, v) => s + v, 0);
    if (Math.abs(chain - H) > GEOMETRY_EPS_MM) {
      ask(".columns[" + ci + "].rows", "Висоти фасадів у колонці " + (ci + 1) + " не сходяться: " + heights.map(fmt).join(" + ") +
        " + зазори " + g.bottom + "/" + g.betweenAdjacentFacades + "/" + g.top + " = " + fmt(chain) + " мм, а висота під фасади " + fmt(H) + " мм.");
      x += widths[ci] + g.betweenAdjacentFacades;
      return;
    }
    let z = zone.z0 + g.bottom;
    heights.forEach((h, ri) => {
      const kind = rows[ri]?.kind === "drawer" ? "drawer" : "door";
      parts.push({
        id: "facade_" + (ci + 1) + "_" + (ri + 1),
        name: kind === "drawer" ? "FASAD_SHUH" : "FASAD",
        type: "front", role: "facade", kind, qty: 1,
        x_mm: x, y_mm: zone.yFront - opts.thickness_mm, z_mm: z,
        size_x_mm: widths[ci], size_y_mm: opts.thickness_mm, size_z_mm: h,
        thickness_mm: opts.thickness_mm, material: opts.material,
        edges: { top: "KR08", bottom: "KR08", left: "KR08", right: "KR08" },
        outside_envelope_allowed: true
      });
      z += h + g.betweenAdjacentFacades;
    });
    x += widths[ci] + g.betweenAdjacentFacades;
  });

  return errors.length ? { ok: false, parts: [], errors } : { ok: true, parts, errors };
}

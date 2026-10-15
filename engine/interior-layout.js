// ============================================================
// ELVIN INTERIOR LAYOUT
// ============================================================
// Purpose:
// Turn a CONFIRMED description of the inner sections into exact
// shelves and vertical partitions with coordinates.
//
// Input (construction.interior) is a recursive split tree:
//
//   {
//     size_reference: "clear",        // sizes are clear openings ("у світлі")
//     split: "vertical",              // vertical  = partitions, cells left -> right
//                                     // horizontal = shelves,   cells bottom -> top
//                                     // "none" / absent = empty cell
//     cells: [
//       { size_mm: 600, split: "horizontal", cells: [ { size_mm: 400 }, ... ] },
//       { size_mm: 582 }
//     ]
//   }
//
// Rules applied (from rules/wardrobe-rules.js, not invented here):
// - Internal uprights stand on the panel below and connect to the
//   panel above (top, bottom or shelf of the parent cell).
// - Shelf depth = carcass depth (no automatic -10 mm).
//
// IMPORTANT:
// - Every cell size must come from the drawing / technologist.
// - The dimension chain must close EXACTLY:
//     sum(cell sizes) + (cells - 1) * thickness = available span.
//   Otherwise the engine stops and asks; it never stretches or
//   evenly distributes cells on its own.
// ============================================================

import { GEOMETRY_EPS_MM } from "./geometry.js";

const SPLITS = {
  vertical: { axis: "x", role: "partition", idPrefix: "partition", namePrefix: "PEREG", label: "по ширині" },
  horizontal: { axis: "z", role: "shelf", idPrefix: "shelf", namePrefix: "POLKA", label: "по висоті" }
};

const SUPPORTED_REFERENCES = ["clear"];
const MAX_DEPTH = 6;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function fmt(n) {
  return String(round2(n));
}

/**
 * @param {Object} interior  construction.interior
 * @param {Object} cell      inner carcass box {x0,x1,y0,y1,z0,z1}
 * @param {Object} panel     {thickness_mm, material}
 * @returns {{ok:boolean, parts:Array, sections:Array, errors:Array}}
 *   errors: [{field, question}] — ready to be shown to the technologist.
 */
export function buildInterior(interior, cell, panel) {
  const parts = [];
  const sections = [];
  const errors = [];
  const t = panel.thickness_mm;

  if (!interior || typeof interior !== "object") {
    errors.push({ field: "construction.interior", question: "Не описано внутрішнє наповнення шафи (секції, полиці, перегородки)." });
    return { ok: false, parts, sections, errors };
  }
  if (!SUPPORTED_REFERENCES.includes(interior.size_reference)) {
    errors.push({
      field: "construction.interior.size_reference",
      question: "Розміри секцій на кресленні вказані у світлі (між деталями)? Інші способи відліку ще не підтримуються."
    });
    return { ok: false, parts, sections, errors };
  }

  function walk(node, box, path, depth) {
    const label = path ? "S" + path : "внутрішній простір";
    if (depth > MAX_DEPTH) {
      errors.push({ field: "construction.interior", question: "Занадто глибока вкладеність секцій у " + label + "." });
      return;
    }

    const split = node.split ?? "none";
    if (split === "none") {
      if (Array.isArray(node.cells) && node.cells.length) {
        errors.push({ field: "construction.interior." + (path || "root"), question: "Секція " + label + " має вкладені комірки, але не вказано напрямок поділу (вертикальний/горизонтальний)." });
        return;
      }
      sections.push({
        id: path ? "S" + path : "S",
        x_mm: round2(box.x0), y_mm: round2(box.y0), z_mm: round2(box.z0),
        size_x_mm: round2(box.x1 - box.x0), size_y_mm: round2(box.y1 - box.y0), size_z_mm: round2(box.z1 - box.z0)
      });
      return;
    }

    const spec = SPLITS[split];
    if (!spec) {
      errors.push({ field: "construction.interior." + (path || "root"), question: "Невідомий тип поділу «" + split + "» у " + label + "." });
      return;
    }
    const cells = Array.isArray(node.cells) ? node.cells : [];
    if (cells.length < 2) {
      errors.push({ field: "construction.interior." + (path || "root"), question: "Поділ " + label + " " + spec.label + " має містити щонайменше дві комірки з розмірами." });
      return;
    }

    const sizes = cells.map(c => Number(c?.size_mm));
    const unknown = sizes.map((s, i) => (Number.isFinite(s) && s > 0 ? null : i + 1)).filter(Boolean);
    if (unknown.length) {
      errors.push({
        field: "construction.interior." + (path || "root") + ".size_mm",
        question: "Не вказано розмір у світлі для комірок " + unknown.map(i => (path ? "S" + path + "." : "S") + i).join(", ") + " (" + spec.label + ")."
      });
      return;
    }

    const a = spec.axis;
    const span = box[a + "1"] - box[a + "0"];
    const chain = sizes.reduce((s, n) => s + n, 0) + (cells.length - 1) * t;
    if (Math.abs(chain - span) > GEOMETRY_EPS_MM) {
      errors.push({
        field: "construction.interior." + (path || "root") + ".chain",
        question: "Ланцюжок розмірів " + label + " " + spec.label + " не сходиться: " +
          sizes.map(fmt).join(" + ") + " + " + (cells.length - 1) + "×" + fmt(t) + " = " + fmt(chain) +
          " мм, а доступно " + fmt(span) + " мм (різниця " + fmt(chain - span) + " мм). Уточніть розміри секцій."
      });
      return;
    }

    let cursor = box[a + "0"];
    cells.forEach((child, i) => {
      const childPath = path ? path + "." + (i + 1) : String(i + 1);
      const childBox = { ...box, [a + "0"]: cursor, [a + "1"]: cursor + sizes[i] };
      walk(child, childBox, childPath, depth + 1);
      cursor += sizes[i];

      if (i < cells.length - 1) {
        const suffix = (path ? path.replace(/\./g, "_") + "_" : "") + (i + 1);
        const p = {
          id: spec.idPrefix + "_" + suffix,
          name: spec.namePrefix + "_" + suffix,
          type: split === "vertical" ? "partition" : "horizontal",
          role: spec.role,
          qty: 1,
          x_mm: box.x0, y_mm: box.y0, z_mm: box.z0,
          size_x_mm: box.x1 - box.x0, size_y_mm: box.y1 - box.y0, size_z_mm: box.z1 - box.z0,
          thickness_mm: t,
          material: panel.material,
          edges: null,
          parent_section: path ? "S" + path : "S"
        };
        p[a + "_mm"] = cursor;
        p["size_" + a + "_mm"] = t;
        for (const k of ["x_mm", "y_mm", "z_mm", "size_x_mm", "size_y_mm", "size_z_mm"]) p[k] = round2(p[k]);
        parts.push(p);
        cursor += t;
      }
    });
  }

  walk(interior, cell, "", 0);
  return errors.length
    ? { ok: false, parts: [], sections: [], errors }
    : { ok: true, parts, sections, errors };
}

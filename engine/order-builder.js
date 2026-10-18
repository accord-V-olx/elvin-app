// ============================================================
// ELVIN ORDER BUILDER (modules)
// ============================================================
// A real order is often several separate carcasses standing side
// by side (e.g. 320 | 1040 | 350 | 520), each with its own sides,
// bottom and top. This module:
//   1. builds every module with the same Wardrobe Engine,
//   2. places them left -> right (X offset = sum of widths before),
//   3. aligns their backs to the wall (modules may differ in depth),
//   4. checks geometry of the whole order (collisions between
//      modules) and produces ONE part list and ONE BAZIS script.
//
// Input: analysis.project.modules = [{ name, width_mm, height_mm,
//   depth_mm, furniture_type, top_type, bottom_type, side_panels,
//   interior }]. Missing height/depth/type/construction are taken
//   from the project. Without modules the order is a single carcass.
// ============================================================

import { buildWardrobe, buildBazisPlan, WARDROBE_ENGINE_VERSION } from "./wardrobe-engine.js";
import { validateGeometry } from "./geometry.js";

const STATUS_RANK = { ERROR: 4, ASK: 3, GEOMETRY_INCOMPLETE: 2, READY: 1 };
const MODULE_CONSTRUCTION = ["top_type", "bottom_type", "side_panels"];

function projectOf(analysis) {
  return analysis && typeof analysis.project === "object" && analysis.project ? analysis.project : {};
}

function moduleLabel(m, i) {
  return "Модуль " + (i + 1) + (m.name ? " «" + m.name + "»" : m.width_mm ? " (" + m.width_mm + ")" : "");
}

// One module as a normal single-carcass analysis for the Engine.
function moduleAnalysis(analysis, m, i) {
  const p = projectOf(analysis);
  const construction = { ...(p.construction || {}) };
  for (const k of MODULE_CONSTRUCTION) if (m[k] !== null && m[k] !== undefined) construction[k] = m[k];
  construction.interior = m.interior ?? null;
  if (m.facades_layout) construction.facades_layout = m.facades_layout;
  // Top-level size/construction fields would override the module values in
  // the Engine's normaliser, so they are cleared for each module.
  const cleared = Object.fromEntries(["width", "overallWidth", "overall_width", "height", "overallHeight",
    "overall_height", "depth", "overallDepth", "overall_depth", "construction", "sections",
    "sections_description", "furnitureType", "furniture_type"].map(k => [k, undefined]));
  return {
    ...analysis,
    ...cleared,
    project: {
      ...p,
      name: p.name,
      furniture_type: m.furniture_type ?? p.furniture_type,
      width_mm: m.width_mm,
      height_mm: m.height_mm ?? p.height_mm,
      depth_mm: m.depth_mm ?? p.depth_mm,
      sections_description: p.sections_description ?? "module " + (i + 1),
      construction
    }
  };
}

const prefixId = (i, id) => "m" + (i + 1) + "_" + id;

/**
 * Build a whole order. Falls back to buildWardrobe for a single carcass.
 */
export function buildOrder(analysis = {}) {
  const p = projectOf(analysis);
  const modules = Array.isArray(p.modules) ? p.modules.filter(Boolean) : [];
  if (modules.length < 2) {
    if (modules.length === 1) return buildWardrobe(moduleAnalysis(analysis, modules[0], 0));
    return buildWardrobe(analysis);
  }

  const results = modules.map((m, i) => buildWardrobe(moduleAnalysis(analysis, m, i)));
  const missing = [];
  results.forEach((r, i) => {
    for (const q of r.missing || []) {
      missing.push({ ...q, field: "modules[" + i + "]." + q.field, question: moduleLabel(modules[i], i) + ": " + q.question });
    }
  });

  // Place modules: X = sum of previous widths; backs aligned to the wall.
  const depths = results.map(r => r.project?.depth || 0);
  const maxDepth = Math.max(...depths);
  const parts = [];
  const sections = [];
  let x = 0;
  results.forEach((r, i) => {
    const width = r.project?.width || 0;
    const dy = maxDepth - depths[i];
    for (const part of r.parts || []) {
      parts.push({ ...part, id: prefixId(i, part.id), module: i + 1, x_mm: part.x_mm + x, y_mm: part.y_mm + dy,
        ...(part.fits_into ? { fits_into: part.fits_into.map(id => prefixId(i, id)) } : {}) });
    }
    for (const s of r.sections || []) {
      sections.push({ ...s, id: "M" + (i + 1) + "." + s.id, module: i + 1, x_mm: s.x_mm + x, y_mm: s.y_mm + dy });
    }
    x += width;
  });

  const totalWidth = x;
  const maxHeight = Math.max(...results.map(r => r.project?.height || 0));
  const geometryCheck = validateGeometry(parts, { width: totalWidth, depth: maxDepth, height: maxHeight });
  for (const e of geometryCheck.errors) missing.push({ field: "geometry." + e.code, question: e.message, parts: e.parts });

  // Overall width is a check, not a constraint: an order may contain
  // other items (desk, panels) next to the modules.
  const warnings = [...new Set(results.flatMap(r => r.warnings || []))];
  const overall = Number(p.width_mm);
  if (Number.isFinite(overall) && overall > 0 && Math.abs(overall - totalWidth) > 0.01) {
    warnings.push("Сума ширин модулів " + totalWidth + " мм не дорівнює загальній ширині " + overall +
      " мм. Перевірте, чи на кресленні є інші вироби (стіл, панелі, зашивки).");
  }

  const worst = results.reduce((w, r) => (STATUS_RANK[r.status] || 0) > (STATUS_RANK[w] || 0) ? r.status : w, "READY");
  const status = worst === "READY" && missing.length ? "GEOMETRY_INCOMPLETE" : worst;
  const project = { ...(results[0].project || {}), width: totalWidth, depth: maxDepth, height: maxHeight };
  const bazis = parts.length
    ? buildBazisPlan(project, parts, [], status === "READY" ? null : { missing })
    : { status: "WAITING_FOR_PART_GEOMETRY", script: null, productionReady: false };

  return {
    ok: status === "READY",
    status,
    engineVersion: WARDROBE_ENGINE_VERSION,
    message: status === "READY"
      ? "Усі модулі розраховані."
      : "Замовлення з " + modules.length + " модулів: є неповні дані або конструкція.",
    missing,
    warnings,
    project,
    modules: results.map((r, i) => ({ index: i + 1, name: modules[i].name ?? null, status: r.status,
      width: r.project?.width ?? null, height: r.project?.height ?? null, depth: r.project?.depth ?? null,
      parts: (r.parts || []).length })),
    parts,
    sections,
    geometryCheck,
    machining: [],
    bazis
  };
}

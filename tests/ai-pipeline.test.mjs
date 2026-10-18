// Run: node --test tests/
// AI response schema -> Wardrobe Engine. No real AI call: the AI answer is
// simulated and first validated against the same strict schema OpenAI uses.
import test from "node:test";
import assert from "node:assert/strict";
import { RESPONSE_SCHEMA } from "../ai/analysis-schema.js";
import { buildWardrobe } from "../engine/wardrobe-engine.js";
import { interiorFromAI } from "../engine/interior-from-ai.js";
import { buildOrder } from "../engine/order-builder.js";

// Minimal JSON-schema check for the subset used by Elvin.
function validate(schema, value, path = "$") {
  const errors = [];
  const types = [].concat(schema.type);
  const typeOf = v => (v === null ? "null" : Array.isArray(v) ? "array" : typeof v);
  if (!types.includes(typeOf(value))) return [path + ": type " + typeOf(value) + " not in " + types];
  if (schema.enum && !schema.enum.includes(value)) errors.push(path + ": " + value + " not in enum");
  if (typeOf(value) === "object") {
    for (const k of schema.required || []) if (!(k in value)) errors.push(path + "." + k + ": missing");
    for (const k of Object.keys(value)) {
      if (!schema.properties?.[k]) errors.push(path + "." + k + ": not allowed");
      else errors.push(...validate(schema.properties[k], value[k], path + "." + k));
    }
  }
  if (typeOf(value) === "array") value.forEach((v, i) => errors.push(...validate(schema.items, v, path + "[" + i + "]")));
  return errors;
}

// Simulated AI answer for the factory reference wardrobe (ТИМА ПЕТРАШ Ш 1).
function aiAnswer(interior) {
  return {
    status: "ready",
    summary: "Шафа 2600×2300×600, 4 секції, 4 рівні.",
    project: {
      name: "ТИМА ПЕТРАШ Ш 1", furniture_type: "шафа",
      width_mm: 2600, height_mm: 2300, depth_mm: 600,
      sections_description: "4 секції по 630 мм у світлі, по 3 полиці",
      material: "ДСП 16", back_panel: "ХДФ 3 мм", material_thickness_mm: 16,
      construction: {
        top_type: "inset", bottom_type: "inset", support_type: "plinth",
        plinth_height_mm: 100, plinth_setback_mm: 20, plinth_type: "dsp", back_panel_type: "overlay",
        back_groove_offset_mm: null, facade_type: "none", side_panels: "full_height",
        interior,
        facades_layout: null
      },
      modules: []
    },
    warnings: [],
    questions: []
  };
}

const level = { width_mm: 630, openings: [530, 530, 530, 530].map(h => ({ height_mm: h, subsections: [] })) };
const petrash = { size_reference: "clear", shelf_front_setback_mm: 50, sections: [level, level, level, level] };

test("schema satisfies OpenAI strict mode (additionalProperties:false, all required)", () => {
  const problems = [];
  (function walk(s, path) {
    if (!s || typeof s !== "object") return;
    if ([].concat(s.type).includes("object")) {
      if (s.additionalProperties !== false) problems.push(path + ": additionalProperties");
      const keys = Object.keys(s.properties || {}).sort();
      if (JSON.stringify(keys) !== JSON.stringify([...(s.required || [])].sort())) problems.push(path + ": required != properties");
      for (const [k, v] of Object.entries(s.properties || {})) walk(v, path + "." + k);
    }
    if (s.items) walk(s.items, path + "[]");
  })(RESPONSE_SCHEMA, "$");
  assert.deepEqual(problems, []);
});

test("simulated AI answer is valid against the schema", () => {
  assert.deepEqual(validate(RESPONSE_SCHEMA, aiAnswer(petrash)), []);
  assert.deepEqual(validate(RESPONSE_SCHEMA, aiAnswer(null)), []);
});

test("AI answer -> Engine: full reference wardrobe with draft BAZIS code", () => {
  const r = buildWardrobe(aiAnswer(petrash));
  const roles = r.parts.reduce((m, p) => ({ ...m, [p.role]: (m[p.role] || 0) + 1 }), {});
  assert.deepEqual(roles, { side: 2, top: 1, bottom: 1, partition: 3, shelf: 12, plinth: 1 });
  assert.equal(r.geometryCheck.ok, true);
  // Back HDF is declared but not modelled yet -> draft, not READY.
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.ok(r.missing.some(m => m.field === "geometry.back_panel"));
  assert.equal(r.bazis.status, "DRAFT_CODE");
  assert.equal((r.bazis.script.match(/objects3d\.NewPanel\(/g) || []).length, 20);
  assert.match(r.bazis.script, /Project: ТИМА ПЕТРАШ Ш 1/);
});

test("AI answer without interior still gives a carcass draft", () => {
  const r = buildWardrobe(aiAnswer(null));
  assert.deepEqual(r.parts.map(p => p.role).sort(), ["bottom", "plinth", "side", "side", "top"]);
  assert.equal(r.bazis.status, "DRAFT_CODE");
});

test("unknown section width from AI becomes a question, not a guess", () => {
  const r = buildWardrobe(aiAnswer({ ...petrash, sections: [level, level, level, { ...level, width_mm: null }] }));
  assert.ok(r.missing.some(m => /S4/.test(m.question)), JSON.stringify(r.missing));
  assert.equal(r.parts.filter(p => p.role === "shelf").length, 0);
});

test("axis or unknown size reference from AI is asked", () => {
  for (const ref of ["axis", "outer", "unknown"]) {
    const r = buildWardrobe(aiAnswer({ ...petrash, size_reference: ref }));
    assert.ok(r.missing.some(m => m.field === "construction.interior.size_reference"), ref);
  }
});

test("interiorFromAI: shapes", () => {
  // One section with shelves -> root is a horizontal split.
  assert.deepEqual(
    interiorFromAI({ size_reference: "clear", shelf_front_setback_mm: null,
      sections: [{ width_mm: 564, openings: [{ height_mm: 900, subsections: [] }, { height_mm: 946, subsections: [] }] }] }),
    { split: "horizontal", cells: [{ size_mm: 900 }, { size_mm: 946 }], size_reference: "clear" });
  // Opening split by a short partition between shelves.
  const tree = interiorFromAI({ size_reference: "clear", shelf_front_setback_mm: 30, sections: [
    { width_mm: 600, openings: [] },
    { width_mm: 528, openings: [
      { height_mm: 1000, subsections: [] },
      { height_mm: 300, subsections: [{ width_mm: 255 }, { width_mm: 255 }] },
      { height_mm: 928, subsections: [] }] }] });
  assert.deepEqual(tree.cells[1].cells[1], { size_mm: 300, split: "vertical", cells: [{ size_mm: 255 }, { size_mm: 255 }] });
  assert.deepEqual(tree.cells[0], { size_mm: 600 });
  assert.equal(tree.shelf_front_setback_mm, 30);
  // No sections found -> no interior.
  assert.equal(interiorFromAI({ size_reference: "unknown", shelf_front_setback_mm: null, sections: [] }), undefined);
});

test("every construction enum value is understood by the Engine", () => {
  const c = RESPONSE_SCHEMA.properties.project.properties.construction.properties;
  const base = aiAnswer(null);
  for (const side of c.side_panels.enum.filter(Boolean)) {
    const bottom = side === "full_height" ? "inset" : "full_width";
    const r = buildWardrobe({ ...base, project: { ...base.project, construction: { ...base.project.construction, side_panels: side, bottom_type: bottom } } });
    assert.equal(r.parts.filter(p => p.role !== "plinth").length, 4, side);
    assert.equal(r.parts.filter(p => p.role === "plinth").length, 1, side);
  }
});

test("AI answer with modules: valid schema, built as side-by-side carcasses", () => {
  const shelves = (n, h) => ({ size_reference: "clear", shelf_front_setback_mm: null,
    sections: [{ width_mm: null, openings: Array.from({ length: n + 1 }, () => ({ height_mm: h, subsections: [] })) }] });
  const mod = (name, width_mm, top_type, interior, depth_mm = null) => ({ name, width_mm, height_mm: null, depth_mm,
    furniture_type: null, top_type, bottom_type: null, side_panels: null, interior, facades_layout: null });
  const answer = aiAnswer(null);
  Object.assign(answer.project, { width_mm: 1910, height_mm: 2786, depth_mm: 576, back_panel: "немає", material_thickness_mm: 18 });
  Object.assign(answer.project.construction, { top_type: "overlay", bottom_type: "full_width", side_panels: "on_bottom",
    support_type: "legs", plinth_height_mm: 0, back_panel_type: "none" });
  answer.project.modules = [
    mod("104", 1040, null, shelves(3, (2750 - 54) / 4)),
    mod("35", 350, "inset", shelves(6, (2750 - 108) / 7), 600),
    mod("52", 520, null, shelves(7, (2750 - 126) / 8))
  ];
  assert.deepEqual(validate(RESPONSE_SCHEMA, answer), []);
  const r = buildOrder(answer);
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  assert.equal(r.modules.length, 3);
  assert.equal(r.parts.filter(p => p.role === "shelf").length, 16);
  assert.equal(r.geometryCheck.ok, true);
});

test("AI answer with facades: valid schema, facades built with factory gaps", () => {
  const answer = aiAnswer(null);
  Object.assign(answer.project, { width_mm: 1040, height_mm: 2786, depth_mm: 576, material_thickness_mm: 18, back_panel: "немає" });
  Object.assign(answer.project.construction, { top_type: "overlay", bottom_type: "full_width", side_panels: "on_bottom",
    support_type: "legs", plinth_height_mm: 0, back_panel_type: "none", facade_type: "overlay",
    interior: { size_reference: "clear", shelf_front_setback_mm: null, sections: [{ width_mm: 1004, openings: [{ height_mm: 1366, subsections: [] }, { height_mm: 1366, subsections: [] }] }] },
    facades_layout: { columns: [0, 1].map(() => ({ width_mm: null, rows: [{ height_mm: 2255, kind: "door" }, { height_mm: 521, kind: "door" }] })) } });
  assert.deepEqual(validate(RESPONSE_SCHEMA, answer), []);
  const r = buildOrder(answer);
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const f = r.parts.filter(p => p.role === "facade").map(p => p.size_x_mm + "x" + p.size_z_mm).sort();
  assert.deepEqual(f, ["516x2255", "516x2255", "516x521", "516x521"]);
});

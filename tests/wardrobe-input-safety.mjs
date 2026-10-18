// Run: node --test tests/wardrobe-input-safety.mjs
// Synthetic inputs only; this does not validate image recognition or BAZIS execution.
import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../engine/wardrobe-engine.js", import.meta.url), "utf8");
// Load as ESM even when the repository has no package.json type=module.
const { buildWardrobe } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);

const valid = {
  project: {
    name: "Ланова Ш83 (26 року)",
    width_mm: 1800,
    height_mm: 2400,
    depth_mm: 600,
    material: "ДСП",
    material_thickness_mm: 18,
    sections_description: "Дві секції (тестові дані)",
    construction: {
      top_type: "inset",
      bottom_type: "full_width",
      support_type: "legs",
      back_panel_type: "ХДФ накладна",
      facade_type: "overlay",
      side_panels: "full_height"
    }
  }
};

function run(change = () => {}) {
  const input = structuredClone(valid);
  change(input.project);
  return buildWardrobe(input);
}

test("preserves the exact confirmed order name", () => {
  const result = run();
  assert.equal(result.status, "READY");
  assert.equal(result.project.projectName, "Ланова Ш83 (26 року)");
  assert.equal(result.bazis.script, null, "a confirmed name does not authorize BAZIS export");
});

test("unknown order name stops for clarification", () => {
  const result = run(p => { p.name = null; });
  assert.equal(result.status, "ASK");
  assert.ok(result.missing.some(x => x.field === "projectName"));
});

test("missing dimensions are not guessed", () => {
  const result = run(p => { p.width_mm = null; p.depth_mm = null; });
  assert.equal(result.status, "ASK");
  assert.equal(result.project.width, null);
  assert.equal(result.project.depth, null);
  assert.ok(result.missing.some(x => x.field === "width"));
  assert.ok(result.missing.some(x => x.field === "depth"));
});

test("missing factory construction requires clarification", () => {
  const result = run(p => { p.construction.top_type = null; });
  assert.equal(result.status, "ASK");
  assert.ok(result.missing.some(x => x.field === "construction.top_type"));
});

test("confirmed zero groove offset is not treated as missing", () => {
  const result = run(p => {
    p.construction.back_panel_type = "ХДФ у паз";
    p.construction.back_groove_offset_mm = 0;
  });
  assert.equal(result.status, "READY");
});

test("missing-field IDs are unique within one analysis", () => {
  const result = run(p => { p.name = null; p.width_mm = null; p.material = null; });
  assert.equal(result.status, "ASK");
  const fields = result.missing.map(x => x.field);
  assert.equal(new Set(fields).size, fields.length);
});

// Known gaps in the main branch: these cases are not yet enforced.
// Turn them into active tests when validation logic is patched.
test("whitespace-only order name must be rejected", () => { const result = run(p => { p.name = "   "; }); assert.equal(result.status, "ASK"); assert.ok(result.missing.some(x => x.field === "projectName")); });
test("empty sections array must be rejected", () => { const result = run(p => { p.sections_description = []; }); assert.equal(result.status, "ASK"); assert.ok(result.missing.some(x => x.field === "sections")); });
test("whitespace-only material and construction values must be rejected", () => { const result = run(p => { p.material = " "; p.construction.top_type = " "; }); assert.equal(result.status, "ASK"); assert.ok(result.missing.some(x => x.field === "material")); assert.ok(result.missing.some(x => x.field === "construction.top_type")); });

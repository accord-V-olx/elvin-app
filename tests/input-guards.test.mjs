// Run in the repository: node --test tests/input-guards.test.mjs
// Regression: incomplete drawing data must not become confirmed production input.
import test from "node:test";
import assert from "node:assert/strict";
import { buildWardrobe } from "../engine/wardrobe-engine.js";

const base = () => ({
  projectName: "TEST-INPUT-GUARDS",
  width: 600, height: 2000, depth: 500,
  material: "ДСП", materialThickness: 18,
  sections: "корпус без внутрішніх деталей",
  backPanel: "none", facades: "none",
  construction: {
    top_type: "inset", bottom_type: "full_width",
    support_type: "legs", side_panels: "on_bottom",
    plinth_height_mm: 100
  }
});

function expectQuestion(changes, field) {
  const order = base();
  const result = buildWardrobe({ ...order, ...changes });
  assert.equal(result.status, "ASK");
  assert.equal(result.ok, false);
  assert.ok(result.missing.some(item => item.field === field),
    "Expected clarification for " + field + ": " + JSON.stringify(result.missing));
}

test("a whitespace-only project name is unknown, never invented", () => {
  expectQuestion({ projectName: "  \t  " }, "projectName");
});

test("a whitespace-only carcass material requires clarification", () => {
  expectQuestion({ material: " \n " }, "material");
});

test("a whitespace-only construction option requires clarification", () => {
  expectQuestion({
    construction: { ...base().construction, side_panels: "   " }
  }, "construction.side_panels");
});

test("several blank fields are all reported in a single ASK", () => {
  const r = buildWardrobe({
    ...base(), projectName: "  ", material: "\t",
    construction: { ...base().construction, top_type: " " }
  });
  assert.equal(r.status, "ASK");
  const fields = new Set(r.missing.map(item => item.field));
  for (const field of ["projectName", "material", "construction.top_type"]) {
    assert.ok(fields.has(field), field + " should be asked once");
    assert.equal(r.missing.filter(item => item.field === field).length, 1);
  }
});

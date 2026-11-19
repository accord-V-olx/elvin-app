// Run: node --test tests/
// Orders made of several carcasses standing side by side.
import test from "node:test";
import assert from "node:assert/strict";
import { buildOrder } from "../engine/order-builder.js";
import { overlapVolume, partBox } from "../engine/geometry.js";

const shelves = (n, inner) => ({ size_reference: "clear", split: "horizontal",
  cells: Array.from({ length: n + 1 }, () => ({ size_mm: (inner - n * 18) / (n + 1) })) });

// Three modules of the real order REAL-A (anonymised): 1040 | 350 | 520.
function order(modules, extra = {}) {
  return {
    project: {
      name: "TEST-MODULES", furniture_type: "шафа", width_mm: null, height_mm: 2786, depth_mm: 576,
      material: "ДСП", material_thickness_mm: 18, back_panel: "none",
      construction: { top_type: "overlay", bottom_type: "full_width", side_panels: "on_bottom",
        support_type: "legs", plinth_height_mm: 0, back_panel_type: "none", facade_type: "none" },
      modules, ...extra
    }
  };
}
const m104 = { name: "104", width_mm: 1040, height_mm: null, depth_mm: null, furniture_type: null,
  top_type: null, bottom_type: null, side_panels: null, interior: shelves(3, 2750) };
const m35 = { name: "35", width_mm: 350, height_mm: null, depth_mm: 600, furniture_type: null,
  top_type: "inset", bottom_type: null, side_panels: null, interior: shelves(6, 2750) };
const m52 = { name: "52", width_mm: 520, height_mm: null, depth_mm: null, furniture_type: null,
  top_type: null, bottom_type: null, side_panels: null, interior: shelves(7, 2750) };

test("three modules side by side: one part list, correct X offsets, no collisions", () => {
  const r = buildOrder(order([m104, m35, m52]));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  assert.equal(r.modules.length, 3);
  assert.equal(r.project.width, 1910);
  const byId = Object.fromEntries(r.parts.map(p => [p.id, p]));
  assert.equal(byId.m1_side_left.x_mm, 0);
  assert.equal(byId.m2_side_left.x_mm, 1040);
  assert.equal(byId.m3_side_left.x_mm, 1390);
  assert.equal(byId.m3_side_right.x_mm, 1910 - 18);
  // GibLab sizes per module survive placement.
  assert.deepEqual([byId.m1_top.size_x_mm, byId.m1_side_left.size_z_mm], [1040, 2750]);
  assert.deepEqual([byId.m2_top.size_x_mm, byId.m2_side_left.size_z_mm, byId.m2_side_left.size_y_mm], [314, 2768, 600]);
  assert.equal(r.parts.filter(p => p.module === 3 && p.role === "shelf").length, 7);
  // Backs aligned to the wall: the 576-deep modules are moved 24 mm back.
  assert.equal(byId.m1_side_left.y_mm, 24);
  assert.equal(byId.m2_side_left.y_mm, 0);
  const boxes = r.parts.map(partBox);
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) assert.equal(overlapVolume(boxes[i], boxes[j]), 0);
  assert.equal((r.bazis.script.match(/objects3d\.NewPanel\(/g) || []).length, r.parts.length);
  assert.equal(new Set(r.parts.map(p => p.id)).size, r.parts.length);
});

test("module with unknown width: the question names the module, others still build", () => {
  const r = buildOrder(order([m104, { ...m52, width_mm: null }]));
  assert.notEqual(r.status, "READY");
  assert.ok(r.missing.some(m => /Модуль 2 «52»/.test(m.question) && m.field.startsWith("modules[1].")), JSON.stringify(r.missing));
  assert.ok(r.parts.some(p => p.module === 1));
});

test("overall width different from the sum of modules is a warning, not a blocker", () => {
  const r = buildOrder(order([m104, m35, m52], { width_mm: 4000 }));
  assert.equal(r.status, "READY");
  assert.match(r.warnings[0], /1910 мм не дорівнює загальній ширині 4000/);
});

test("no modules: same result as a single carcass", () => {
  const r = buildOrder(order([], { width_mm: 1040, construction: { top_type: "overlay", bottom_type: "full_width",
    side_panels: "on_bottom", support_type: "legs", plinth_height_mm: 0, back_panel_type: "none", facade_type: "none",
    interior: shelves(3, 2750) } }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  assert.equal(r.modules, undefined);
  assert.equal(r.parts.find(p => p.id === "top").size_x_mm, 1040);
});

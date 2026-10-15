// Run: node --test tests/
// Synthetic wardrobe types only. Not real orders; no production data.
import test from "node:test";
import assert from "node:assert/strict";
import { buildWardrobe } from "../engine/wardrobe-engine.js";
import { validateGeometry, partBox, overlapVolume } from "../engine/geometry.js";

// Carcass: sides stand on a full bottom, inset top, legs 100 mm.
// Inner box: X 18..W-18, Y 0..D, Z 118..H-18.
function order({ width = 1200, height = 2400, depth = 600, interior, construction = {}, ...rest } = {}) {
  return {
    projectName: "TEST-" + width + "x" + height,
    width, height, depth,
    material: "ДСП", materialThickness: 18,
    backPanel: "none", facades: "none",
    construction: {
      top_type: "inset", bottom_type: "full_width", support_type: "legs",
      side_panels: "on_bottom", plinth_height_mm: 100,
      interior, ...construction
    },
    ...rest
  };
}

const byId = result => Object.fromEntries(result.parts.map(p => [p.id, p]));
const box = p => [p.x_mm, p.y_mm, p.z_mm, p.size_x_mm, p.size_y_mm, p.size_z_mm];
const fields = result => (result.missing || []).map(m => m.field);
const vol = p => p.size_x_mm * p.size_y_mm * p.size_z_mm;

// Every mm³ of the inner box must belong to exactly one section or panel.
function assertInteriorCovered(result) {
  const ids = byId(result);
  const inner = (ids.side_right.x_mm - ids.side_left.size_x_mm) *
    ids.side_left.size_y_mm * (ids.top.z_mm - ids.bottom.z_mm - ids.bottom.size_z_mm);
  const internal = result.parts.filter(p => p.role === "shelf" || p.role === "partition");
  const total = [...internal, ...result.sections].reduce((s, p) => s + vol(p), 0);
  assert.ok(Math.abs(total - inner) < 1, "covered " + total + " of " + inner);
  // ...and no section may overlap a part or another section or leave the inner box.
  const boxes = [...result.parts, ...result.sections].map(p => [p.id, partBox(p)]);
  for (let i = 0; i < boxes.length; i++)
    for (let j = i + 1; j < boxes.length; j++)
      assert.equal(overlapVolume(boxes[i][1], boxes[j][1]), 0, boxes[i][0] + " overlaps " + boxes[j][0]);
  for (const s of result.sections) {
    const b = partBox(s);
    assert.ok(b.x0 >= ids.side_left.size_x_mm && b.x1 <= ids.side_right.x_mm, s.id + " outside X");
    assert.ok(b.z0 >= ids.bottom.z_mm + ids.bottom.size_z_mm && b.z1 <= ids.top.z_mm, s.id + " outside Z");
  }
}

test("single section with 4 shelves: exact Z positions from clear heights", () => {
  const r = buildWardrobe(order({ interior: {
    size_reference: "clear", split: "horizontal",
    cells: [{ size_mm: 400 }, { size_mm: 400 }, { size_mm: 400 }, { size_mm: 400 }, { size_mm: 592 }]
  } }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  assert.equal(r.bazis.productionReady, false);
  const p = byId(r);
  assert.deepEqual(box(p.shelf_1), [18, 0, 518, 1164, 600, 18]);
  assert.deepEqual(box(p.shelf_4), [18, 0, 518 + 3 * 418, 1164, 600, 18]);
  assert.equal(r.sections.length, 5);
  assert.deepEqual(r.sections.at(-1).size_z_mm, 592);
  assertInteriorCovered(r);
});

test("two sections: partition stands on bottom and reaches the top", () => {
  const r = buildWardrobe(order({ interior: {
    size_reference: "clear", split: "vertical",
    cells: [
      { size_mm: 573, split: "horizontal", cells: [{ size_mm: 1800 }, { size_mm: 446 }] },
      { size_mm: 573 }
    ]
  } }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const p = byId(r);
  assert.deepEqual(box(p.partition_1), [591, 0, 118, 18, 600, 2264]);
  // Shelf in the left section spans from the left side to the partition.
  assert.deepEqual(box(p.shelf_1_1), [18, 0, 1918, 573, 600, 18]);
  assert.deepEqual(r.sections.map(s => s.id), ["S1.1", "S1.2", "S2"]);
  assert.equal(r.geometryCheck.ok, true);
  assertInteriorCovered(r);
});

test("three sections with nested partition between two shelves", () => {
  const r = buildWardrobe(order({ width: 1800, interior: {
    size_reference: "clear", split: "vertical",
    cells: [
      { size_mm: 600 },
      { size_mm: 528, split: "horizontal", cells: [
        { size_mm: 1000 },
        { size_mm: 300, split: "vertical", cells: [{ size_mm: 255 }, { size_mm: 255 }] },
        { size_mm: 928 }
      ] },
      { size_mm: 600 }
    ]
  } }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const p = byId(r);
  assert.deepEqual(box(p.partition_1), [618, 0, 118, 18, 600, 2264]);
  assert.deepEqual(box(p.partition_2), [1164, 0, 118, 18, 600, 2264]);
  assert.deepEqual(box(p.shelf_2_1), [636, 0, 1118, 528, 600, 18]);
  // Nested partition stands on shelf_2_1 and is closed by shelf_2_2.
  assert.deepEqual(box(p.partition_2_2_1), [891, 0, 1136, 18, 600, 300]);
  assert.equal(p.shelf_2_2.z_mm, 1436);
  assertInteriorCovered(r);
});

test("full-height sides with inset top and bottom on a plinth", () => {
  const r = buildWardrobe(order({ width: 400, height: 2000, depth: 350,
    construction: { side_panels: "full_height", bottom_type: "inset", support_type: "plinth" },
    interior: { size_reference: "clear", split: "horizontal", cells: [{ size_mm: 900 }, { size_mm: 946 }] }
  }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const p = byId(r);
  assert.deepEqual(box(p.side_left), [0, 0, 0, 18, 350, 2000]);
  assert.deepEqual(box(p.bottom), [18, 0, 100, 364, 350, 18]);
  assert.deepEqual(box(p.shelf_1), [18, 0, 1018, 364, 350, 18]);
  assertInteriorCovered(r);
});

test("dimension chain that does not close stops with a concrete question", () => {
  const r = buildWardrobe(order({ interior: {
    size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 580 }]
  } }));
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.equal(r.bazis.script, null);
  const q = r.missing.find(m => m.field === "construction.interior.root.chain");
  assert.ok(q, JSON.stringify(r.missing));
  assert.match(q.question, /573 \+ 580 \+ 1×18 = 1171 мм, а доступно 1164 мм/);
  // Nothing is stretched or guessed: no internal parts are emitted.
  assert.equal(r.parts.filter(p => p.role === "partition").length, 0);
});

test("missing cell size is asked, not guessed", () => {
  const r = buildWardrobe(order({ interior: {
    size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: null }]
  } }));
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.ok(fields(r).includes("construction.interior.root.size_mm"));
  assert.match(r.missing.find(m => m.field.endsWith("size_mm")).question, /S2/);
});

test("unknown size reference is asked", () => {
  const r = buildWardrobe(order({ interior: { split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] } }));
  assert.ok(fields(r).includes("construction.interior.size_reference"));
});

test("interior and internal_panels together are a conflict", () => {
  const r = buildWardrobe(order({
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] },
    construction: { internal_panels: [{ id: "s1", type: "shelf", x_mm: 18, y_mm: 0, z_mm: 800, width_mm: 1164, depth_mm: 600, height_mm: 18 }] }
  }));
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.ok(fields(r).includes("construction.interior"));
});

test("groove back panel with interior is asked (shelf depth rule not approved)", () => {
  const r = buildWardrobe(order({ backPanel: "ХДФ",
    construction: { back_panel_type: "ХДФ у паз", back_groove_offset_mm: 16, facade_type: null },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] }
  }));
  assert.ok(r.missing.some(m => m.field === "construction.interior" && /паз/.test(m.question)));
});

test("declared back panel and facades block READY until they are modelled", () => {
  const r = buildWardrobe(order({ backPanel: "ХДФ 3 мм", facades: "2 фасади",
    construction: { back_panel_type: "overlay", facade_type: "overlay" },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] }
  }));
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.ok(fields(r).includes("geometry.back_panel"));
  assert.ok(fields(r).includes("geometry.facades"));
  assert.equal(r.geometryCheck.ok, true);
});

test("legacy panels: collision between shelf and partition is reported", () => {
  const r = buildWardrobe(order({ width: 600, height: 2000, depth: 500, sections: [{ width_mm: 600, depth_mm: 500 }],
    construction: { internal_panels: [
      { id: "s1", type: "shelf", x_mm: 18, y_mm: 0, z_mm: 800, width_mm: 564, depth_mm: 500, height_mm: 18 },
      { id: "v1", type: "partition", x_mm: 291, y_mm: 0, z_mm: 700, width_mm: 18, depth_mm: 500, height_mm: 1282 }
    ] }
  }));
  const c = r.missing.find(m => m.field === "geometry.COLLISION");
  assert.ok(c, JSON.stringify(r.missing));
  assert.deepEqual(c.parts, ["internal_s1", "internal_v1"]);
});

test("legacy panels: floating shelf is reported as unsupported", () => {
  const r = buildWardrobe(order({ width: 600, height: 2000, depth: 500, sections: [{ width_mm: 600, depth_mm: 500 }],
    construction: { internal_panels: [
      { id: "s1", type: "shelf", x_mm: 100, y_mm: 0, z_mm: 800, width_mm: 482, depth_mm: 500, height_mm: 18 }
    ] }
  }));
  const u = r.missing.find(m => m.field === "geometry.UNSUPPORTED_SHELF");
  assert.ok(u);
  assert.match(u.question, /ліву/);
});

test("BAZIS preview includes every part and is never production-ready", () => {
  const r = buildWardrobe(order({ interior: {
    size_reference: "clear", split: "vertical",
    cells: [{ size_mm: 573, split: "horizontal", cells: [{ size_mm: 1800 }, { size_mm: 446 }] }, { size_mm: 573 }]
  } }));
  assert.equal(r.status, "READY");
  const panels = r.bazis.script.match(/objects3d\.NewPanel\(/g) || [];
  assert.equal(panels.length, r.parts.length);
  assert.match(r.bazis.script, /let P_partition_1 = objects3d\.NewPanel\(600, 2264, objects3d\.PanelOrientation\.vertical\)/);
  assert.equal(r.bazis.productionReady, false);
});

test("engine output is JSON-safe and does not mutate input", () => {
  const input = order({ interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] } });
  const snapshot = JSON.stringify(input);
  const r = buildWardrobe(input);
  assert.equal(JSON.stringify(input), snapshot);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
});

test("geometry check: touching faces are not a collision, overlap is", () => {
  const p = (id, x, sx) => ({ id, x_mm: x, y_mm: 0, z_mm: 0, size_x_mm: sx, size_y_mm: 100, size_z_mm: 100, thickness_mm: 18 });
  assert.equal(validateGeometry([p("a", 0, 18), p("b", 18, 18)]).ok, true);
  const bad = validateGeometry([p("a", 0, 18), p("b", 17, 18)]);
  assert.deepEqual(bad.errors.map(e => e.code), ["COLLISION"]);
  assert.deepEqual(partBox(p("a", 5, 18)).x1, 23);
});

test("geometry check: part without a thickness axis is rejected", () => {
  const r = validateGeometry([{ id: "x", x_mm: 0, y_mm: 0, z_mm: 0, size_x_mm: 18, size_y_mm: 18, size_z_mm: 100, thickness_mm: 18 }]);
  assert.deepEqual(r.errors.map(e => e.code), ["THICKNESS_AXIS"]);
});

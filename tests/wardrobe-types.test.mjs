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
  // Draft code is still produced; the chain question is listed on top of it.
  assert.equal(r.bazis.status, "DRAFT_CODE");
  assert.equal(r.bazis.productionReady, false);
  assert.match(r.bazis.script, /ЧЕРНЕТКА[\s\S]*Ланцюжок розмірів/);
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

test("groove back panel with an explicit offset from the drawing: setback = offset + 4 mm groove", () => {
  const r = buildWardrobe(order({ backPanel: "ХДФ",
    construction: { back_panel_type: "ХДФ у паз", back_groove_offset_mm: 16, facade_type: null },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 573 }, { size_mm: 573 }] }
  }));
  assert.ok(!(r.missing || []).some(m => m.field === "construction.interior"), JSON.stringify(r.missing));
  assert.equal(byId(r).partition_1.size_y_mm, 600 - 16 - 4);
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

test("HDF sheet larger than 2800x2070 (factory rule) must be split", async () => {
  const { checkSheetLimits } = await import("../engine/geometry.js");
  const { WARDROBE_RULES } = await import("../rules/wardrobe-rules.js");
  const limit = { back: WARDROBE_RULES.backPanel.hdfOverlay.maxSheetMm };
  const hdf = (id, w, h) => ({ id, role: "back", x_mm: 0, y_mm: 600, z_mm: 0, size_x_mm: w, size_y_mm: 3, size_z_mm: h, thickness_mm: 3 });
  // Rotation of the sheet is allowed: 2070 wide x 2800 high fits.
  assert.deepEqual(checkSheetLimits([hdf("ok", 2070, 2800), hdf("ok2", 2800, 2070)], limit), []);
  const errs = checkSheetLimits([hdf("big", 2600, 2196)], limit);
  assert.deepEqual(errs.map(e => e.code), ["SHEET_TOO_LARGE"]);
  assert.match(errs[0].message, /2600×2196 мм.*2800×2070/);
});

test("draft BAZIS code: carcass without interior is still exported with a gap list", () => {
  const r = buildWardrobe(order({ backPanel: "ХДФ 3 мм", construction: { back_panel_type: "overlay" }, interior: undefined,
    sections: "4 секції" }));
  assert.equal(r.status, "GEOMETRY_INCOMPLETE");
  assert.equal(r.bazis.status, "DRAFT_CODE");
  const s = r.bazis.script;
  assert.equal((s.match(/objects3d\.NewPanel\(/g) || []).length, r.parts.length);
  assert.match(s, /Задня стінка ще не розраховується/);
  assert.match(s, /historyOperations\.CommitCurrentChanges/);
  // Comment lines cannot break out into code.
  assert.ok(s.split("\n").filter(l => l.startsWith("//   - ")).length >= 2);
});

test("draft BAZIS code: a part without orientation is listed, not silently dropped", () => {
  const r = buildWardrobe(order({ width: 600, height: 2000, depth: 500, sections: [{ width_mm: 600, depth_mm: 500 }],
    construction: { internal_panels: [
      { id: "cube", type: "shelf", x_mm: 18, y_mm: 0, z_mm: 800, width_mm: 18, depth_mm: 18, height_mm: 18 }
    ] }
  }));
  assert.equal(r.bazis.status, "DRAFT_CODE");
  assert.match(r.bazis.script, /Пропущено .*internal_cube/);
});

test("overlay top on a full bottom: sides stand between bottom and top (real factory module)", () => {
  // Module 520 x 2786 x 576, DSP 18: GibLab gives KR/DNO 520x576, sides 2750x576, 7 shelves 484x576.
  const cells = [1, 2, 3, 4, 5, 6, 7, 8].map(() => ({ size_mm: (2750 - 7 * 18) / 8 }));
  const r = buildWardrobe(order({ width: 520, height: 2786, depth: 576,
    construction: { top_type: "overlay", plinth_height_mm: 0 },
    interior: { size_reference: "clear", split: "horizontal", cells } }));
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const p = byId(r);
  assert.deepEqual(box(p.top), [0, 0, 2768, 520, 576, 18]);
  assert.deepEqual(box(p.bottom), [0, 0, 0, 520, 576, 18]);
  assert.deepEqual(box(p.side_left), [0, 0, 18, 18, 576, 2750]);
  const shelves = r.parts.filter(x => x.role === "shelf");
  assert.equal(shelves.length, 7);
  assert.ok(shelves.every(s => s.size_x_mm === 484 && s.size_y_mm === 576));
  assertInteriorCovered(r);
});

test("chest with overlay top: top overhangs the carcass at the front by 20 mm (factory rule)", () => {
  const r = buildWardrobe(order({ width: 1800, height: 980, depth: 500, furnitureType: "комод",
    construction: { side_panels: "full_height", bottom_type: "inset", top_type: "overlay", plinth_height_mm: 0 },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 873 }, { size_mm: 873 }] } }));
  assert.equal(r.geometryCheck.ok, true, JSON.stringify(r.missing));
  const p = byId(r);
  assert.deepEqual(box(p.top), [0, 0, 962, 1800, 500, 18]);
  assert.deepEqual(box(p.side_left), [0, 20, 0, 18, 480, 962]);
  assert.deepEqual([p.partition_1.y_mm, p.partition_1.size_y_mm], [20, 480]);
  // The same construction as a wardrobe keeps the top flush.
  const w = buildWardrobe(order({ width: 1800, height: 980, depth: 500, furnitureType: "шафа",
    construction: { side_panels: "full_height", bottom_type: "inset", top_type: "overlay", plinth_height_mm: 0 },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 873 }, { size_mm: 873 }] } }));
  assert.equal(byId(w).side_left.size_y_mm, 500);
});

test("HDF in groove (factory standard 14 + 4): shelves, partitions and inset top are 18 mm shallower", () => {
  const r = buildWardrobe(order({ width: 840, height: 500, depth: 528, backPanel: "ХДФ 2,5",
    construction: { back_panel_type: "groove", top_type: "inset", plinth_height_mm: 0 },
    interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 393 }, { size_mm: 393 }] } }));
  const p = byId(r);
  // Real order (top box 840): KR 804 x 510 = 528 - 18.
  assert.deepEqual([p.top.size_x_mm, p.top.size_y_mm], [804, 510]);
  assert.deepEqual([p.partition_1.y_mm, p.partition_1.size_y_mm], [0, 510]);
  assert.equal(p.side_left.size_y_mm, 528);
  assert.equal(p.bottom.size_y_mm, 528);
  assert.ok(!(r.missing || []).some(m => m.field === "construction.back_groove_offset_mm"));
  assert.equal(r.geometryCheck.ok, true, JSON.stringify(r.geometryCheck.errors));
  // HDF in the groove (left, right, bottom): real order TYL 820 x 489.
  const hdf = p.back;
  assert.deepEqual([hdf.size_x_mm, hdf.size_z_mm, hdf.size_y_mm], [820, 489, 3]);
  assert.deepEqual([hdf.x_mm, hdf.y_mm, hdf.z_mm], [10, 510, 10]);
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  assert.match(r.bazis.script, /P_back = objects3d\.NewPanel\(820, 489, objects3d\.PanelOrientation\.front\)/);
});

test("DSP other than 18 / 37 mm gives a warning (factory rule)", () => {
  const r = buildWardrobe(order({ materialThickness: 16, width: 600, height: 2000, depth: 500,
    interior: { size_reference: "clear", split: "horizontal", cells: [{ size_mm: 900 }, { size_mm: 1032 - 16 + 18 * 0 + 0 }] } }));
  assert.match(r.warnings.join(" "), /16 мм.*лише ДСП 18, 37/);
  const ok = buildWardrobe(order({ interior: { size_reference: "clear", split: "horizontal", cells: [{ size_mm: 1000 }, { size_mm: 1246 }] } }));
  assert.deepEqual(ok.warnings, []);
});

test("HDF in groove with an overlay top is asked (groove only in sides and bottom)", () => {
  const r = buildWardrobe(order({ width: 840, height: 1570, depth: 528, backPanel: "ХДФ",
    construction: { back_panel_type: "groove", top_type: "overlay", plinth_height_mm: 0 },
    interior: { size_reference: "clear", split: "horizontal", cells: [{ size_mm: 758 }, { size_mm: 758 }] } }));
  assert.ok(r.missing.some(m => m.field === "construction.back_panel_type"), JSON.stringify(r.missing));
  assert.ok(!r.parts.some(p => p.role === "back"));
});

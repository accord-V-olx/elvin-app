// Run: node --test tests/
// Reference: factory BAZIS 10 script "ТИМА ПЕТРАШ Ш 1" (2600x2300x600, DSP 16,
// full-height sides, inset bottom on 100 mm plinth, inset top, 4 sections x 4 levels).
// The Engine must reproduce the same BAZIS panel sizes and positions.
import test from "node:test";
import assert from "node:assert/strict";
import { buildWardrobe } from "../engine/wardrobe-engine.js";
import { toBazisPlacement } from "../engine/bazis-axes.js";

const W = 2600, H = 2300, D = 600, T = 16;
const CLEAR_W = (W - 5 * T) / 4; // 630
const CLEAR_H = (H - 100 - 5 * T) / 4; // 530

const level = { size_mm: CLEAR_W, split: "horizontal",
  cells: [{ size_mm: CLEAR_H }, { size_mm: CLEAR_H }, { size_mm: CLEAR_H }, { size_mm: CLEAR_H }] };

function reference(setback) {
  return buildWardrobe({
    projectName: "BAZIS-REFERENCE-2600", width: W, height: H, depth: D,
    material: "ДСП 16", materialThickness: T, backPanel: "none", facades: "none",
    construction: {
      top_type: "inset", bottom_type: "inset", support_type: "plinth",
      side_panels: "full_height", plinth_height_mm: 100,
      interior: { size_reference: "clear", split: "vertical", shelf_front_setback_mm: setback,
        cells: [level, level, level, level] }
    }
  });
}

const placed = r => Object.fromEntries(r.parts.map(p => [p.id, toBazisPlacement(p, D)]));
const at = (orientation, panel, x, y, z) => ({ orientation, panel, min: { x, y, z } });
const strip = pl => ({ orientation: pl.orientation, panel: pl.panel, min: pl.min });

test("carcass and partitions match the reference BAZIS script", () => {
  const r = reference(50);
  assert.equal(r.status, "READY", JSON.stringify(r.missing));
  const b = placed(r);
  assert.deepEqual(strip(b.side_left), at("vertical", [600, 2300], 0, 0, 0));
  assert.deepEqual(strip(b.side_right), at("vertical", [600, 2300], W - T, 0, 0));
  assert.deepEqual(strip(b.bottom), at("horizont", [2568, 600], T, 100, 0));
  assert.deepEqual(strip(b.top), at("horizont", [2568, 600], T, H - T, 0));
  // ST_SR: stand on DNO, under KR, X1/X2/X3 from the reference script.
  assert.deepEqual(strip(b.partition_1), at("vertical", [600, 2168], 646, 116, 0));
  assert.deepEqual(strip(b.partition_2), at("vertical", [600, 2168], 1292, 116, 0));
  assert.deepEqual(strip(b.partition_3), at("vertical", [600, 2168], 1938, 116, 0));
});

test("12 shelves: same sizes, X and height as the reference script", () => {
  const r = reference(50);
  const shelves = r.parts.filter(p => p.role === "shelf");
  assert.equal(shelves.length, 12);
  const b = placed(r);
  const xs = [16, 662, 1308, 1954], ys = [646, 1192, 1738];
  xs.forEach((x, s) => ys.forEach((y, l) => {
    const pl = b["shelf_" + (s + 1) + "_" + (l + 1)];
    assert.deepEqual(pl.panel, [CLEAR_W, 550]);
    assert.equal(pl.min.x, x);
    assert.equal(pl.min.y, y);
    // Inset 50 mm from the FRONT (Elvin Y=0) -> BAZIS z = 0..550.
    // NOTE: the reference script places them at z = 50..600 (see bazis-axes.js).
    assert.equal(pl.min.z, 0);
  }));
});

test("generated BAZIS script uses BAZIS axes and verified calls", () => {
  const s = reference(50).bazis.script;
  assert.match(s, /materialData\.SetupActiveMaterial\("ДСП 16", 16\);/);
  assert.match(s, /let P_partition_1 = objects3d\.NewPanel\(600, 2168, objects3d\.PanelOrientation\.vertical\);\n.*\n.*textureOrientation\.vertical;\nmoveMin\(P_partition_1, 646, 116, 0\);/);
  assert.match(s, /let P_bottom = objects3d\.NewPanel\(2568, 600, objects3d\.PanelOrientation\.horizont\);/);
  assert.match(s, /historyOperations\.CommitCurrentChanges\("BAZIS-REFERENCE-2600"\);$/);
  assert.doesNotMatch(s, /Action\.Continue/);
});

test("back HDF and plinth map to the reference BAZIS positions", () => {
  // Frontal parts expressed in Elvin axes (Y=0 front): HDF behind the carcass,
  // plinth recessed 20 mm from the front.
  const hdf = { id: "tyl", x_mm: 16, y_mm: D, z_mm: 102, size_x_mm: 630, size_y_mm: 3, size_z_mm: 2196, thickness_mm: 3 };
  const cokol = { id: "cokol", x_mm: 16, y_mm: 20, z_mm: 0, size_x_mm: 2568, size_y_mm: 16, size_z_mm: 100, thickness_mm: 16 };
  assert.deepEqual(strip(toBazisPlacement(hdf, D)), at("front", [630, 2196], 16, 102, -3));
  assert.deepEqual(strip(toBazisPlacement(cokol, D)), at("front", [2568, 100], 16, 0, 564));
});

test("part names follow the factory BAZIS convention", () => {
  const r = reference(50);
  const names = Object.fromEntries(r.parts.map(p => [p.id, p.name]));
  assert.deepEqual([names.side_left, names.side_right, names.bottom, names.top], ["ST_L", "ST_R", "DNO", "KR"]);
  assert.ok(r.parts.filter(p => p.role === "partition").every(p => p.name === "ST_SR"));
  assert.ok(r.parts.filter(p => p.role === "shelf").every(p => p.name === "POLKA"));
  assert.equal(new Set(r.parts.map(p => p.id)).size, r.parts.length);
  assert.match(r.bazis.script, /P_partition_1\.Name = "ST_SR";/);
});

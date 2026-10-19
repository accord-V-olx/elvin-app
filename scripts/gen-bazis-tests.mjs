// Generates the BAZIS test scripts for the technologist (docs/bazis/).
// Run: node scripts/gen-bazis-tests.mjs
import { writeFileSync } from "node:fs";
import { buildWardrobe } from "../engine/wardrobe-engine.js";
import { buildOrder } from "../engine/order-builder.js";

const out = new URL("../docs/bazis/", import.meta.url);

// Test 1: the factory reference wardrobe (ТИМА ПЕТРАШ Ш 1), DSP 16, 4 sections x 4 levels.
const level = { size_mm: 630, split: "horizontal", cells: [530, 530, 530, 530].map(size_mm => ({ size_mm })) };
const t1 = buildWardrobe({
  projectName: "ELVIN-TEST-1-ETALON", width: 2600, height: 2300, depth: 600,
  material: "ДСП 16", materialThickness: 16, backPanel: "ХДФ 3", facades: "none",
  construction: { top_type: "inset", bottom_type: "inset", support_type: "plinth", side_panels: "full_height",
    plinth_height_mm: 100, back_panel_type: "overlay",
    interior: { size_reference: "clear", split: "vertical", shelf_front_setback_mm: 50, cells: [level, level, level, level] } }
});

// Test 2: three wardrobes 1250 | 600 | 1250 like the real drawing of 18.10.2026
// (depth with facade, fillers 20 / +20). The interior is a TEST layout, not from an order.
const shelves = (w, n, inner) => ({ size_reference: "clear", shelf_front_setback_mm: null,
  sections: [{ width_mm: w, openings: Array.from({ length: n + 1 }, () => ({ height_mm: (inner - n * 18) / (n + 1), subsections: [] })) }] });
const inner = 2450 - 100 - 2 * 18; // plinth 100, bottom and top 18
const mod = (name, width_mm, depth_mm, interior, cols) => ({ name, width_mm, height_mm: null, depth_mm, furniture_type: null,
  top_type: null, bottom_type: null, side_panels: null, interior,
  facades_layout: { columns: Array.from({ length: cols }, () => ({ width_mm: null, rows: [{ height_mm: null, kind: "door" }] })) } });
const leftInterior = { size_reference: "clear", shelf_front_setback_mm: null, sections: [
  { width_mm: 596, openings: [inner / 2 - 9, inner / 2 - 9].map(height_mm => ({ height_mm, subsections: [] })) },
  { width_mm: 600, openings: Array.from({ length: 5 }, () => ({ height_mm: (inner - 4 * 18) / 5, subsections: [] })) }] };
const t2 = buildOrder({
  project: { name: "ELVIN-TEST-2-TRY-SHAFY", furniture_type: "шафа", width_mm: 3100, height_mm: 2450, depth_mm: 650,
    material: "ДСП 18", material_thickness_mm: 18, back_panel: "ХДФ 3", sections_description: "",
    construction: { top_type: "overlay", bottom_type: "inset", support_type: "plinth", plinth_height_mm: 100,
      plinth_setback_mm: null, plinth_type: "dsp", back_panel_type: "overlay", back_groove_offset_mm: null,
      facade_type: "overlay", side_panels: "full_height", depth_includes_facade: true,
      fillers: { left_mm: 20, right_mm: 20, top_mm: 20 }, interior: null, facades_layout: null },
    modules: [mod("ліва", 1250, 650, leftInterior, 2), mod("середня", 600, 600, shelves(564, 4, inner), 1),
      mod("права", 1250, 650, shelves(1214, 4, inner), 2)] }
});

const table = r => {
  const rows = {};
  for (const p of r.parts) {
    const [a, b] = [p.size_x_mm, p.size_y_mm, p.size_z_mm].filter(v => v !== p.thickness_mm);
    const k = p.name + " | " + Math.max(a, b) + " × " + Math.min(a, b) + " | " + p.thickness_mm;
    rows[k] = (rows[k] || 0) + 1;
  }
  return Object.entries(rows).sort().map(([k, n]) => "| " + k + " | " + n + " |").join("\n");
};

for (const [file, r] of [["test-1-etalon-2600x2300x600.js", t1], ["test-2-try-shafy-3100x2450.js", t2]]) {
  if (!r.bazis?.script) throw new Error(file + ": no script, " + JSON.stringify(r.missing));
  writeFileSync(new URL(file, out), r.bazis.script + "\n");
  writeFileSync(new URL(file.replace(/\.js$/, ".parts.md"), out),
    "| Деталь | Розмір, мм | Товщина | Кількість |\n|---|---|---|---|\n" + table(r) + "\n");
  console.log(file, r.status, r.parts.length, "parts", (r.machining || []).length, "mounts", JSON.stringify((r.missing || []).map(m => m.question)));
}

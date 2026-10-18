// Run: node --test tests/
// Regression against real factory orders (GibLab). "parts" must match
// exactly now; "pending" sizes depend on technological clearances that
// are not in the factory rules yet and are reported as TODO.
import test from "node:test";
import assert from "node:assert/strict";
import { buildWardrobe } from "../engine/wardrobe-engine.js";
import { REAL_ORDERS } from "./fixtures/real-orders.js";

const key = (name, a, b) => name + " " + Math.max(a, b) + "x" + Math.min(a, b);

function build(m) {
  const t = m.thickness;
  // Inner height between bottom and top for all supported carcass schemes (no plinth inside the module).
  const inner = m.height - 2 * t;
  const interior = m.interior ?? (m.shelves
    ? { size_reference: "clear", split: "horizontal",
        cells: Array.from({ length: m.shelves + 1 }, () => ({ size_mm: (inner - m.shelves * t) / (m.shelves + 1) })) }
    : undefined);
  return buildWardrobe({
    projectName: m.id, furnitureType: m.furnitureType ?? "шафа", width: m.width, height: m.height, depth: m.depth,
    material: "ДСП", materialThickness: t,
    facades: m.construction.facade_type === "overlay" ? "накладні" : "none",
    backPanel: m.construction.back_panel_type && m.construction.back_panel_type !== "none" ? "ХДФ" : "none",
    sections: interior ? undefined : "carcass only",
    construction: { support_type: "legs", plinth_height_mm: 0, ...m.construction, interior }
  });
}

function partCounts(result) {
  const counts = {};
  for (const p of result.parts) {
    const [a, b] = [p.size_x_mm, p.size_y_mm, p.size_z_mm].filter(v => v !== p.thickness_mm);
    const k = key(p.name, a, b);
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

for (const order of REAL_ORDERS) {
  for (const m of order.modules) {
    test(order.id + " / " + m.id + ": carcass matches GibLab", () => {
      const r = build(m);
      assert.equal(r.geometryCheck?.ok, true, JSON.stringify(r.missing));
      const counts = partCounts(r);
      for (const [name, a, b, qty] of m.parts) {
        assert.equal(counts[key(name, a, b)] || 0, qty, key(name, a, b) + " — Elvin: " + JSON.stringify(counts));
      }
    });

    if (m.pending && m.pending.length) {
      test(order.id + " / " + m.id + ": sizes waiting for clearance rules", { todo: m.pending.map(p => key(...p)).join(", ") }, () => {
        const counts = partCounts(build(m));
        for (const [name, a, b, qty] of m.pending) assert.equal(counts[key(name, a, b)] || 0, qty, key(name, a, b));
      });
    }
  }
}

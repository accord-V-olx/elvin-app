import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

function order() {
  return {
    orderName: "Ланова Ш83 (26 року)",
    rulesVersion: "factory-rules-test",
    sourceImages: ["drawing-001"],
    dimensionsMm: { width: 1200, height: 2400, depth: 600 },
    materials: ["ДСП 18 мм"],
    construction: { back: "overlay" },
    openQuestions: [],
    status: "READY", ok: true, missing: [],
    geometryCheck: { ok: true, errors: [] },
    review: { status: "approved", approvedBy: "technologist-test", approvedAt: "2026-11-20T12:00:00Z" },
    decisions: [],
    parts: [{ id: "side-1", size_x_mm: 18, size_y_mm: 2400, size_z_mm: 600 }]
  };
}

test("undefined panel dimension cannot disappear during snapshot serialization", () => {
  const input = order();
  input.parts[0].size_z_mm = undefined;
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("undefined_field_present"), JSON.stringify(result.errors));
  assert.equal(result.record, null);
});

test("complete numeric panel dimensions remain serializable", () => {
  const result = createApprovedOrderSnapshot(order());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.parts[0].size_z_mm, 600);
  assert.equal(result.record.productionReady, false);
});

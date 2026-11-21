import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

function order() {
  return {
    orderName: "Ланова Ш83 (26 року)", rulesVersion: "test-rules",
    sourceImages: ["drawing-1"], dimensionsMm: { width: 1200, height: 2400, depth: 600 },
    materials: ["ДСП 18"], construction: { back: "overlay" },
    openQuestions: [], status: "READY", ok: true, missing: [],
    geometryCheck: { ok: true, errors: [] },
    review: { status: "approved", approvedBy: "technologist-test", approvedAt: "2026-11-21T12:00:00Z" },
    decisions: [], parts: [{ id: "side", size_x_mm: 18, size_y_mm: 2400, size_z_mm: 600 }]
  };
}

test("reject function in a panel field rather than silently dropping it", () => {
  const input = order();
  input.parts[0].size_z_mm = () => 600;
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["unsupported_field_present"]);
  assert.equal(result.record, null);
});

test("reject symbol in nested construction field", () => {
  const input = order();
  input.construction.plinth = Symbol("unknown");
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ["unsupported_field_present"]);
});

test("normal geometry remains serializable without production authorization", () => {
  const result = createApprovedOrderSnapshot(order());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.parts[0].size_z_mm, 600);
  assert.equal(result.record.productionReady, false);
});

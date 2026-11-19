import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

function reviewedOrder(orderName) {
  return {
    orderName,
    rulesVersion: "factory-rules-test",
    sourceImages: ["drawing-front-001"],
    dimensionsMm: { width: 1200, height: 2400, depth: 600 },
    materials: ["ДСП 18 мм"],
    construction: { back: "overlay" },
    openQuestions: [],
    status: "READY",
    ok: true,
    missing: [],
    geometryCheck: { ok: true, errors: [] },
    review: { status: "approved", approvedBy: "technologist-test", approvedAt: "2026-11-19T12:00:00Z" },
    decisions: [],
    parts: [{ id: "side-1", name: "Боковина", x_mm: 0, y_mm: 0, z_mm: 0, size_x_mm: 18, size_y_mm: 2400, size_z_mm: 600 }]
  };
}

test("exact Ukrainian order name survives reviewed snapshot unchanged", () => {
  const result = createApprovedOrderSnapshot(reviewedOrder("Ланова Ш83 (26 року)"));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.orderName, "Ланова Ш83 (26 року)");
  assert.equal(result.record.productionReady, false);
});

test("missing order name blocks snapshot even after geometry and technologist review", () => {
  for (const name of ["", "  ", undefined]) {
    const result = createApprovedOrderSnapshot(reviewedOrder(name));
    assert.equal(result.ok, false);
    assert.ok(result.errors.includes("order_name_required"));
    assert.equal(result.record, null);
  }
});

test("snapshot does not normalize an operator-supplied name", () => {
  const exactName = "  Ланова Ш83 (26 року)  ";
  const result = createApprovedOrderSnapshot(reviewedOrder(exactName));
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.orderName, exactName);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

// Regression: a back panel in a groove needs an explicitly measured rear offset.
const reviewedOrder = () => ({
  orderName: "Ланова Ш83 (26 року)",
  sourceImages: ["drawing-1"],
  rulesVersion: "test-rules",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18", "ХДФ 3"],
  construction: { back: "groove" },
  decisions: [],
  openQuestions: [],
  status: "READY",
  ok: true,
  missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: {
    status: "approved",
    approvedBy: "technologist-1",
    approvedAt: "2026-11-23T09:00:00Z"
  }
});

test("grooved back without offset cannot be saved as reviewed", () => {
  const result = createApprovedOrderSnapshot(reviewedOrder());
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("back_groove_offset_required"));
  assert.equal(result.record, null);
});

test("zero groove offset is not an approved measured offset", () => {
  const order = reviewedOrder();
  order.construction.back_groove_offset_mm = 0;
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("back_groove_offset_required"));
});

test("explicit positive groove offset survives review snapshot without production approval", () => {
  const order = reviewedOrder();
  order.construction.back_groove_offset_mm = 12.5;
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.construction.back_groove_offset_mm, 12.5);
  assert.equal(result.record.orderName, order.orderName);
  assert.equal(result.record.productionReady, false);
});

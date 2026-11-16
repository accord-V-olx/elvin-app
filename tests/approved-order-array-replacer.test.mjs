import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const valid = () => ({
  orderName: "ТЕСТ Ш02 (26 року)",
  sourceImages: ["left", "right"],
  rulesVersion: "test-1",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { back: "overlay" },
  decisions: [],
  openQuestions: [],
  status: "READY",
  ok: true,
  missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "tester", approvedAt: "2026-11-16T09:00:00Z" }
});

test("undefined panel entry is rejected rather than serialized as null", () => {
  const order = valid();
  order.parts = [{ id: "side" }, undefined];
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("array_element_invalid"), JSON.stringify(result.errors));
  assert.equal(result.record, null);
});

test("sparse panel array is rejected rather than serialized as null", () => {
  const order = valid();
  order.parts = new Array(2);
  order.parts[0] = { id: "side" };
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("array_element_invalid"), JSON.stringify(result.errors));
});

test("complete panel array remains serializable but not production-approved", () => {
  const order = valid();
  order.parts = [{ id: "side" }, { id: "top" }];
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.parts.length, 2);
  assert.equal(result.record.productionReady, false);
});

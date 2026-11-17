import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const valid = () => ({
  orderName: "ТЕСТ Ш02 (26 року)",
  sourceImages: ["drawing-left", "drawing-right"],
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
  review: { status: "approved", approvedBy: "test-technologist", approvedAt: "2026-11-05T09:00:00Z" }
});

test("null panel in parts is rejected instead of persisted", () => {
  const input = valid();
  input.parts = [{ id: "side-left" }, null];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("array_element_invalid"));
  assert.equal(result.record, null);
});

test("null nested in a panel array is rejected", () => {
  const input = valid();
  input.parts = [{ id: "side-left", holes: [null] }];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("array_element_invalid"));
});

test("valid panels and empty arrays are preserved", () => {
  const input = valid();
  input.parts = [{ id: "side-left", holes: [] }, { id: "side-right" }];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.record.parts, input.parts);
  assert.equal(result.record.productionReady, false);
});

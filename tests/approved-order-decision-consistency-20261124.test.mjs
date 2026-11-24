import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const order = () => ({
  orderName: "TEST — decision consistency",
  sourceImages: ["drawing-1"], rulesVersion: "test-rules",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"], construction: { back: "overlay" },
  decisions: [], openQuestions: [], status: "READY", ok: true, missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "test-technologist", approvedAt: "2026-11-24T09:00:00Z" }
});
const decision = (field, value, source) => ({field, value, source, status: "approved"});
test("conflicting approved plinth decisions block snapshot even with whitespace", () => {
  const input = order();
  input.decisions = [decision("plinth_height_mm", 100, "approved_rule"), decision(" plinth_height_mm ", 150, "technologist")];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("conflicting_decisions"));
  assert.equal(result.record, null);
});
test("consistent repeated decisions retain provenance without production approval", () => {
  const input = order();
  input.decisions = [decision("plinth_height_mm", 100, "drawing"), decision("plinth_height_mm", 100, "technologist")];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.record.decisions, input.decisions);
  assert.equal(result.record.productionReady, false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

// Regression checks only. These do not authenticate a user or persist orders.
const readyOrder = () => ({
  orderName: "Ланова Ш83 (26 року)",
  sourceImages: ["drawing-1", "drawing-2"],
  rulesVersion: "test-rules",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { back: "groove", back_groove_offset_mm: 12 },
  decisions: [{ field: "construction.back_groove_offset_mm", value: 12, source: "technologist", status: "approved" }],
  openQuestions: [],
  status: "READY",
  ok: true,
  missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "test-technologist", approvedAt: "2026-11-11T09:00:00Z" }
});

test("exact customer order name is retained without normalization", () => {
  const input = readyOrder();
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.orderName, "Ланова Ш83 (26 року)");
  assert.equal(result.record.productionReady, false);
});

test("an unresolved engine parameter blocks snapshot even if UI questions are empty", () => {
  const input = readyOrder();
  input.missing = ["plinth_type"];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("analysis_not_ready"));
  assert.equal(result.record, null);
});

test("technologist approval cannot be replaced with a browser-provided name alone", () => {
  const input = readyOrder();
  input.review.status = "pending";
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("explicit_review_required"));
  assert.equal(result.record, null);
});

test("duplicate contradictory decisions block approval", () => {
  const input = readyOrder();
  input.decisions.push({ field: "construction.back_groove_offset_mm", value: 18, source: "technologist", status: "approved" });
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("conflicting_decisions"));
  assert.equal(result.record, null);
});

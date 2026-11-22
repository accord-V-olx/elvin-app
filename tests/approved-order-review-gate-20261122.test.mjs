import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const valid = () => ({
  orderName: "Ланова Ш83 (26 року)",
  sourceImages: ["drawing-1"],
  rulesVersion: "test-rules",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { back: "overlay" },
  decisions: [],
  openQuestions: [],
  status: "READY", ok: true, missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "technologist-1", approvedAt: "2026-11-22T09:00:00Z" }
});

test("READY analysis without explicit technologist approval cannot be snapshotted", () => {
  const order = valid();
  order.review.status = "pending";
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("explicit_review_required"));
  assert.equal(result.record, null);
});

test("approved review cannot override an unresolved factory question", () => {
  const order = valid();
  order.openQuestions = [{ field: "plinth", question: "Уточніть цоколь" }];
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("open_questions_unresolved"));
  assert.equal(result.record, null);
});

test("reviewed analysis snapshot never authorizes production", () => {
  const result = createApprovedOrderSnapshot(valid());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.orderName, "Ланова Ш83 (26 року)");
  assert.equal(result.record.productionReady, false);
});

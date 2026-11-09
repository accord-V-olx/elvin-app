import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

// Regression tests for the boundary between AI analysis and a future protected store.
// No production authorization or persistence is exercised here.
const valid = () => ({
  orderName: "ТЕСТ Ш02 (26 року)",
  sourceImages: ["drawing-left", "drawing-right"],
  rulesVersion: "test-1",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { back: "overlay" },
  decisions: [{ field: "construction.back", value: "overlay", source: "technologist", status: "approved" }],
  openQuestions: [],
  status: "READY",
  ok: true,
  missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "test-technologist", approvedAt: "2026-11-05T09:00:00Z" }
});

test("valid approved snapshot fixture passes explicit geometry verification", () => {
  const result = createApprovedOrderSnapshot(valid());
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.productionReady, false);
});

test("two complementary drawing IDs survive snapshot without storing raw upload fields", () => {
  const input = valid();
  input.rawImages = ["data:image/png;base64,SECRET"];
  input.apiToken = "DO_NOT_PERSIST";
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.deepEqual(result.record.sourceImages, ["drawing-left", "drawing-right"]);
  assert.equal("rawImages" in result.record, false);
  assert.equal("apiToken" in result.record, false);
  assert.equal(result.record.productionReady, false);
});

test("duplicate drawing IDs cannot masquerade as two source images", () => {
  const input = valid();
  input.sourceImages = ["drawing-left", "drawing-left"];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("source_image_ids_required"));
  assert.equal(result.record, null);
});

test("a missing dimension cannot be silently inferred for approval", () => {
  const input = valid();
  delete input.dimensionsMm.depth;
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("dimensions_incomplete"));
  assert.equal(result.record, null);
});

test("a separate unanswered groove-offset question blocks approval", () => {
  const input = valid();
  input.construction.back = "groove";
  input.openQuestions = [{ field: "construction.back_groove_offset_mm" }];
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("open_questions_unresolved"));
  assert.equal(result.record, null);
});


test("explicit failed geometry verification blocks snapshot even without listed errors", () => {
  const input = valid();
  input.geometryCheck = { ok: false, errors: [] };
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("geometry_not_verified"));
  assert.equal(result.record, null);
});

test("successful geometry verification with empty errors remains acceptable", () => {
  const input = valid();
  input.geometryCheck = { ok: true, errors: [] };
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
});


test("missing explicit geometry success flag blocks approval", () => {
  const input = valid();
  input.geometryCheck = { errors: [] };
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("geometry_not_verified"));
  assert.equal(result.record, null);
});

test("non-boolean geometry success flag cannot authorize approval", () => {
  const input = valid();
  input.geometryCheck = { ok: "true", errors: [] };
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("geometry_not_verified"));
  assert.equal(result.record, null);
});

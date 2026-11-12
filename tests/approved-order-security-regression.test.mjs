import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

// Security boundary: snapshots are prepared only, never production authorization.
const valid = () => ({
  orderName: "Ланова Ш83 (26 року)",
  sourceImages: ["drawing-1", "drawing-2"],
  rulesVersion: "test-rules",
  dimensionsMm: { width: 1800, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { back: "groove", back_groove_offset_mm: 12 },
  decisions: [],
  openQuestions: [],
  status: "READY", ok: true, missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "test-technologist", approvedAt: "2026-11-12T09:00:00Z" }
});

test("rejects base64 image content masquerading as source image ID", () => {
  const order = valid();
  order.sourceImages = ["data:image/png;base64,AAAA"];
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("source_image_ids_required"));
  assert.equal(result.record, null);
});

test("does not persist arbitrary top-level credentials", () => {
  const order = valid();
  order.apiToken = "SECRET_TOKEN_DO_NOT_STORE";
  order.authorization = { bearer: "SECRET_TOKEN_DO_NOT_STORE" };
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.productionReady, false);
  assert.equal(JSON.stringify(result.record).includes("SECRET_TOKEN_DO_NOT_STORE"), false);
});

test("rejects circular data instead of creating an incomplete snapshot", () => {
  const order = valid();
  const part = { id: "panel-1" };
  part.loop = part;
  order.parts = [part];
  const result = createApprovedOrderSnapshot(order);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes("snapshot_not_serializable"));
  assert.equal(result.record, null);
});

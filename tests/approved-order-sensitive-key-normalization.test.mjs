import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const validOrder = () => ({
  orderName: "Ланова Ш83 (26 року)", rulesVersion: "factory-v1",
  sourceImages: ["drawing-1"], dimensionsMm: { width: 1000, height: 2000, depth: 500 },
  materials: ["ДСП 18"], construction: { back: "overlay" },
  openQuestions: [], status: "READY", ok: true, missing: [],
  geometryCheck: { ok: true, errors: [] },
  review: { status: "approved", approvedBy: "technologist-test", approvedAt: "2026-11-18T10:00:00Z" },
  decisions: [], parts: [{ name: "side", size_x_mm: 18, size_y_mm: 2000, size_z_mm: 500 }]
});

test("rejects punctuation-obfuscated secret keys nested in parts", () => {
  for (const key of ["api.token", "access token", "client.secret", "pass-word"]) {
    const order = validOrder();
    order.parts[0][key] = "do-not-persist";
    const result = createApprovedOrderSnapshot(order);
    assert.equal(result.ok, false, key);
    assert.deepEqual(result.errors, ["sensitive_field_present"], key);
    assert.equal(result.record, null, key);
  }
});

test("allows normal geometry keys and does not authorize production", () => {
  const result = createApprovedOrderSnapshot(validOrder());
  assert.equal(result.ok, true);
  assert.equal(result.record.productionReady, false);
});

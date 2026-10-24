import test from "node:test";
import assert from "node:assert/strict";
import { createApprovedOrderSnapshot } from "../review/approved-order-snapshot.mjs";

const valid = () => ({
  orderName: "ТЕСТ Ш01 (26 року)",
  sourceImages: ["img-1", "img-2"],
  rulesVersion: "1.8",
  dimensionsMm: { width: 1200, height: 2400, depth: 600 },
  materials: ["ДСП 18"],
  construction: { top_type: "inset" },
  decisions: [{ field: "construction.back_groove_offset_mm", value: 0, source: "technologist", status: "approved" }],
  openQuestions: [],
  review: { status: "approved", approvedBy: "technologist-test", approvedAt: "2026-10-24T09:00:00Z" }
});

const checkReject = (name, change, expected) => test(name, () => {
  const input = valid();
  change(input);
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, false);
  assert.equal(result.record, null);
  assert.ok(result.errors.includes(expected), JSON.stringify(result.errors));
});

test("approved analysis preserves exact order name and numeric zero, but not production approval", () => {
  const input = valid();
  const result = createApprovedOrderSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.errors));
  assert.equal(result.record.orderName, input.orderName);
  assert.equal(result.record.decisions[0].value, 0);
  assert.equal(result.record.productionReady, false);
  input.decisions[0].value = 20;
  assert.equal(result.record.decisions[0].value, 0, "snapshot must not share mutable references");
  assert.deepEqual(result.record.sourceImages, ["img-1", "img-2"]);
});
checkReject("blank name cannot be approved", o => { o.orderName = "   "; }, "order_name_required");
checkReject("draft review cannot be saved as approved", o => { o.review.status = "draft"; }, "explicit_review_required");
checkReject("unanswered questions block snapshot", o => { o.openQuestions = [{ field: "support_type" }]; }, "open_questions_unresolved");
checkReject("reviewer identity is required", o => { o.review.approvedBy = " "; }, "reviewer_required");
checkReject("explicit approval timestamp is required", o => { o.review.approvedAt = "not-a-date"; }, "review_timestamp_required");
checkReject("conflicting approved decisions are not silently chosen", o => {
  o.decisions.push({ field: "construction.back_groove_offset_mm", value: 10, source: "technologist", status: "approved" });
}, "conflicting_decisions");
checkReject("untraceable decisions are rejected", o => { o.decisions[0].source = "ai_guess"; }, "decision_invalid");
checkReject("image bytes are not accepted as storage references", o => { o.sourceImages = ["data:image/png;base64,abcd"]; }, "source_image_ids_required");
checkReject("unknown dimensions block approval", o => { o.dimensionsMm.depth = null; }, "dimensions_incomplete");
checkReject("missing rule version blocks approval", o => { o.rulesVersion = ""; }, "rules_version_required");
checkReject("unapproved decision blocks snapshot", o => { o.decisions[0].status = "draft"; }, "decision_invalid");

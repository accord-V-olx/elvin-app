// Run: node --test tests/clarification-planner.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { planClarifications } from "../engine/clarification-planner.js";

const orderName = "Ланова Ш83 (26 року)";
const missing = [{ field: "construction.back_groove_offset_mm", question: "Відступ паза?" }];
const approved = (value, overrides = {}) => ({
  orderName, field: missing[0].field, value,
  status: "approved", source: "technologist", approvedBy: "Технолог",
  ...overrides
});

test("deduplicates repeated missing fields without guessing", () => {
  const result = planClarifications([...missing, ...missing], [], orderName);
  assert.deepEqual(result.pending, missing);
  assert.deepEqual(result.reused, []);
});

test("reuses only an approved technologist answer for the exact order", () => {
  const result = planClarifications(missing, [approved(12)], orderName);
  assert.equal(result.pending.length, 0);
  assert.deepEqual(result.reused, [{ field: missing[0].field, value: 12, approvedBy: "Технолог" }]);
});

test("accepts a confirmed 0 mm groove offset", () => {
  assert.equal(planClarifications(missing, [approved(0)], orderName).reused[0].value, 0);
});

test("never reuses a decision from another order", () => {
  assert.equal(planClarifications(missing, [approved(12, { orderName: "Інше замовлення" })], orderName).pending.length, 1);
});

test("ignores drafts and unverified reviewers", () => {
  assert.equal(planClarifications(missing, [approved(12, { status: "draft" }), approved(12, { approvedBy: " " })], orderName).pending.length, 1);
});

test("conflicting approved values stay unresolved", () => {
  const result = planClarifications(missing, [approved(12), approved(15)], orderName);
  assert.equal(result.pending.length, 1);
  assert.equal(result.reused.length, 0);
  assert.equal(result.conflicts[0].reason, "conflicting_approved_decisions");
});

test("does not reuse structured answers or an unnamed order", () => {
  assert.equal(planClarifications(missing, [approved({ offset: 12 })], orderName).pending.length, 1);
  assert.equal(planClarifications(missing, [approved(12)], " ").pending.length, 1);
});

test("does not mutate input data", () => {
  const original = structuredClone(missing);
  planClarifications(missing, [approved(12)], orderName);
  assert.deepEqual(missing, original);
});

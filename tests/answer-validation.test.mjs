import test from "node:test";
import assert from "node:assert/strict";
import { isValidTechnologistAnswer } from "../engine/answer-validation.mjs";

test("accepts short explicit production values, including zero millimetres", () => {
  for (const value of ["0", 0, "3", " 0 ", "0 мм", "так", "ні", "A"]) {
    assert.equal(isValidTechnologistAnswer(value), true, String(value));
  }
});

test("rejects unanswered or punctuation-only values", () => {
  for (const value of ["", "   ", "?", "---", null, undefined]) {
    assert.equal(isValidTechnologistAnswer(value), false, String(value));
  }
});

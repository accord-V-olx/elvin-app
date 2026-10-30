// Regression for the inline browser validator used by both AI and Engine questions.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const source = html.match(/^function validAnswer\(v\)\{.*\}$/m)?.[0];
assert.ok(source, "index.html must contain the inline validAnswer function");
const validAnswer = runInNewContext(source + "\nvalidAnswer", {});

test("inline UI script is syntactically valid", () => {
  const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript, "index.html must contain the inline UI script");
  assert.doesNotThrow(() => new Script(inlineScript));
});

test("technologist can answer with zero or a single digit", () => {
  for (const value of ["0", "3", 0, 3, " 0 ", "-3", "0.5"]) {
    assert.equal(validAnswer(value), true, JSON.stringify(value));
  }
});

test("normal text answers remain valid", () => {
  for (const value of ["так", "ні", "18 мм"]) {
    assert.equal(validAnswer(value), true, JSON.stringify(value));
  }
});

test("blank or punctuation-only input is not an answer", () => {
  for (const value of ["", "  ", "--", "!!!", "?", null, undefined]) {
    assert.equal(validAnswer(value), false, JSON.stringify(value));
  }
});

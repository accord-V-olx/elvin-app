// Regression tests for reuse of confirmed technologist answers in index.html.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Script, runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const extract = pattern => {
  const source = html.match(pattern)?.[0];
  assert.ok(source, `Missing inline helper: ${pattern}`);
  return source;
};
const helpers = [
  extract(/^function qKey\(q,i\)\{.*\}$/m),
  extract(/^function questionTopic\(q\)\{[\s\S]*?^\}/m),
  extract(/^function questionOptions\(q\)\{[\s\S]*?^\}/m),
  extract(/^function validAnswer\(v\)\{.*\}$/m),
  extract(/^function unansweredQuestions\(questions,answers\)\{.*\}$/m)
].join("\n");
const { qKey, questionTopic, questionOptions, unansweredQuestions } = runInNewContext(
  helpers + "\n({qKey, questionTopic, questionOptions, unansweredQuestions})", {}
);

test("browser script parses and calls the question reuse helper", () => {
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline);
  assert.doesNotThrow(() => new Script(inline));
  assert.match(inline, /const questions=unansweredQuestions\(/);
  assert.match(inline, /if\(validAnswer\(value\)&&topic\)confirmedAnswers\[topic\]=value/);
});

test("empty legacy topic cannot hide unrelated no-ID questions", () => {
  const questions = [{ question: "Глибина полиць?" }, { question: "Висота цоколя?" }];
  const answers = { "": "100", [qKey(questions[0], 0)]: "500" };
  assert.deepEqual(
    Array.from(unansweredQuestions(questions, answers), q => q.question),
    ["Висота цоколя?"]
  );
});

test("a confirmed question at index 1 is filtered using index 1", () => {
  const questions = [{ question: "Глибина полиць?" }, { question: "Висота цоколя?" }];
  const answers = { [qKey(questions[1], 1)]: "100" };
  assert.deepEqual(
    Array.from(unansweredQuestions(questions, answers), q => q.question),
    ["Глибина полиць?"]
  );
});

test("recognized legacy topic can still suppress an answered question", () => {
  const questions = [{ id: "legacy-side-1", question: "Боковини на всю висоту?" }];
  assert.equal(unansweredQuestions(questions, { side_panels: "так" }).length, 0);
});

test("numeric zero remains a valid confirmed answer", () => {
  assert.equal(unansweredQuestions([{ id: "offset", question: "Відступ?" }], { offset: 0 }).length, 0);
});

test("empty answer does not hide an unresolved question", () => {
  assert.equal(unansweredQuestions([{ id: "offset", question: "Відступ?" }], { offset: "  " }).length, 1);
});

test("generic titles cannot merge distinct unanswered questions", () => {
  const questions = [
    { title: "Уточнення", question: "Глибина полиць?" },
    { title: "Уточнення", question: "Висота цоколя?" }
  ];
  assert.notEqual(qKey(questions[0], 0), qKey(questions[1], 1));
  const answers = { [qKey(questions[0], 0)]: "500" };
  assert.deepEqual(
    Array.from(unansweredQuestions(questions, answers), q => q.question),
    ["Висота цоколя?"]
  );
});

test("fallback key survives reordering and whitespace changes", () => {
  assert.equal(
    qKey({ title: "Уточнення", question: "  Висота   цоколя?  " }, 3),
    qKey({ title: "Уточнення", question: "Висота цоколя?" }, 0)
  );
});

test("explicit IDs take precedence and title-only keys stay separate", () => {
  assert.equal(qKey({ id: "plinth_height", title: "Уточнення", question: "Висота?" }, 1), "plinth_height");
  assert.notEqual(qKey({ title: "Уточнення" }, 0), qKey({ title: "Уточнення" }, 1));
});

test("side-panel thickness stays unresolved after construction choice", () => {
  const q = { question: "Яка товщина боковин?" };
  assert.equal(questionTopic(q), "");
  assert.equal(questionOptions(q).length, 0);
  assert.equal(unansweredQuestions([q], { side_panels: "Боковини стоять на дні" }).length, 1);
});

test("back-panel groove offset and HDF thickness are not silently answered", () => {
  const questions = [
    { question: "Який відступ паза задньої стінки?" },
    { question: "Яка товщина ХДФ?" },
    { question: "Відступ задньої стінки у паз від краю?" }
  ];
  const answers = { back_panel_type: "ХДФ 3 мм, у паз" };
  assert.equal(unansweredQuestions(questions, answers).length, 3);
  assert.ok(questions.every(q => questionOptions(q).length === 0));
});

test("unambiguous construction questions still reuse confirmed choices", () => {
  const questions = [
    { id: "legacy-side-1", question: "Боковини на всю висоту?" },
    { question: "Задня стінка накладна чи у паз?" },
    { question: "Як встановлюється задня стінка?" },
    { question: "Тип полиць: стаціонарні чи знімні?" }
  ];
  const answers = { side_panels: "так", back_panel_type: "накладна", shelf_type: "стаціонарні" };
  assert.equal(unansweredQuestions(questions, answers).length, 0);
});

test("canonical topic IDs remain compatible", () => {
  assert.equal(questionTopic({ id: "side_panels" }), "side_panels");
  assert.equal(questionTopic({ id: "back.panel.type" }), "back_panel_type");
  assert.equal(questionTopic({ id: "shelf_type" }), "shelf_type");
});

test("legacy construction IDs cannot suppress dimensional clarification", () => {
  const questions = [
    { id: "back_panel_type", question: "Який відступ паза задньої стінки?" },
    { id: "side_panels", question: "Яка товщина боковин?" },
    { id: "shelf_type", question: "Яка глибина полиць?" }
  ];
  const answers = { back_panel_type: "у паз", side_panels: "на дні", shelf_type: "знімні" };
  assert.deepEqual(
    Array.from(unansweredQuestions(questions, answers), q => q.question),
    questions.map(q => q.question)
  );
  assert.ok(questions.every(q => questionOptions(q).length === 0));
});

test("dimension with distinct ID reuses its exact answer", () => {
  const q = { id: "groove_offset_mm", question: "Який відступ паза задньої стінки?" };
  assert.equal(unansweredQuestions([q], { groove_offset_mm: "25 мм" }).length, 0);
});

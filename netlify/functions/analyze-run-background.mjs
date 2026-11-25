// ============================================================
// ELVIN — drawing analysis by Claude (Netlify background function)
// ============================================================
// analyze-start stores the job (prompt + photos) in Netlify Blobs and
// calls this function. A background function may run up to 15 minutes,
// so a long reading of several photos is not cut off. The result is
// written back to the same job; analyze-status reads it.
// Needs ANTHROPIC_API_KEY in Netlify environment variables.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@netlify/blobs";
import { RESPONSE_SCHEMA } from "../../ai/analysis-schema.js";

import { JOBS_STORE } from "../../ai/jobs.js";
const MODEL = "claude-opus-5-5";

// "data:image/jpeg;base64,...." -> image block
function imageBlock(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/s.exec(dataUrl);
  if (!m) return null;
  return { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
}

function errorText(error) {
  if (error instanceof Anthropic.AuthenticationError) return "Ключ ANTHROPIC_API_KEY недійсний — перевірте його в налаштуваннях Netlify.";
  if (error instanceof Anthropic.RateLimitError) return "Claude зараз перевантажений, спробуйте за хвилину.";
  if (error instanceof Anthropic.BadRequestError) return "Claude не прийняв запит: " + error.message;
  if (error instanceof Anthropic.APIError) return "Помилка Claude (" + error.status + "), спробуйте ще раз.";
  return "Немає зв'язку з Claude, спробуйте ще раз.";
}

export async function analyzeJob(job) {
  const content = [{ type: "text", text: job.prompt }];
  job.images.forEach((image, index) => {
    content.push({ type: "text", text: `Аркуш ${index + 1}` + (image.fileName ? ` (${image.fileName})` : "") });
    const block = imageBlock(image.dataUrl);
    if (block) content.push(block);
  });

  const client = new Anthropic();
  // Streaming: reading several sheets with thinking can take minutes.
  const message = await client.beta.messages
    .stream({
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "high", format: { type: "json_schema", schema: RESPONSE_SCHEMA } },
      messages: [{ role: "user", content }]
    })
    .finalMessage();

  if (message.stop_reason === "refusal") throw new Error("Claude відмовився аналізувати ці фото.");
  if (message.stop_reason === "max_tokens") throw new Error("Відповідь не вмістилась — спробуйте менше фото за раз.");
  const text = message.content.filter(b => b.type === "text").map(b => b.text).join("");
  if (!text) throw new Error("Claude не повернув результат.");
  return text;
}

export default async (request) => {
  let jobId;
  try {
    ({ jobId } = await request.json());
  } catch {
    return;
  }
  if (!jobId) return;
  const store = getStore({ name: JOBS_STORE, consistency: "strong" });
  const job = await store.get(jobId, { type: "json" });
  if (!job || job.status !== "queued") return;

  await store.setJSON(jobId, { status: "in_progress", mode: job.mode, startedAt: Date.now() });
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY не знайдено в налаштуваннях Netlify.");
    const text = await analyzeJob(job);
    // The photos are not kept once the analysis is done.
    await store.setJSON(jobId, { status: "completed", mode: job.mode, text, finishedAt: Date.now() });
  } catch (error) {
    console.error("ELVIN CLAUDE ERROR", error);
    const message = error instanceof Anthropic.APIError || !(error instanceof Error) ? errorText(error) : error.message;
    await store.setJSON(jobId, { status: "failed", mode: job.mode, error: message, finishedAt: Date.now() });
  }
};

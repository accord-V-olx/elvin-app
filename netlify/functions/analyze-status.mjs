import { getStore } from "@netlify/blobs";
import { buildOrder } from "../../engine/order-builder.js";
import { JOBS_STORE } from "../../ai/jobs.js";
function jsonResponse(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    }
  );
}


export default async (request) => {

  if (request.method !== "GET") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }


  try {

    const url =
      new URL(request.url);

    const jobId =
      url.searchParams.get("id");

    if (!jobId) {
      return jsonResponse(
        {
          error:
            "Не передано ID аналізу."
        },
        400
      );
    }

    const job =
      await getStore({ name: JOBS_STORE, consistency: "strong" }).get(jobId, { type: "json" });

    if (!job) {
      return jsonResponse(
        {
          status: "failed",
          error:
            "Аналіз не знайдено. Запустіть його ще раз."
        }
      );
    }

    // A background function stops after 15 minutes; a job left running
    // longer (or never started) is reported instead of polled forever.
    const age =
      Date.now() - (job.startedAt || job.createdAt || Date.now());

    if (
      (job.status === "in_progress" && age > 16 * 60 * 1000) ||
      (job.status === "queued" && age > 3 * 60 * 1000)
    ) {
      return jsonResponse(
        {
          status: "failed",
          error:
            "Аналіз не завершився вчасно. Спробуйте ще раз або менше фото."
        }
      );
    }

    if (job.status === "queued" || job.status === "in_progress") {
      return jsonResponse(
        {
          status: job.status
        }
      );
    }

    if (job.status === "failed") {
      return jsonResponse(
        {
          status: "failed",
          error:
            job.error ||
            "Аналіз не завершився."
        }
      );
    }

    const text =
      job.text;

    if (!text) {
      return jsonResponse(
        {
          status: "failed",
          error:
            "Elvin не отримав текст результату."
        }
      );
    }

    let result;

    try {
      result =
        JSON.parse(text);
    }
    catch {
      return jsonResponse(
        {
          status: "failed",
          error:
            `Не вдалося прочитати результат Elvin: ${text}`
        }
      );
    }
// AI analysis is usable independently of future geometry/export readiness.
// Wardrobe Engine reports production blockers, not extra questions for the operator.
const wardrobe = buildOrder(result);
// Do not ask again for facts already resolved in the structured analysis.
// Only explicit, meaningful values count; unknown placeholders do not.
const project = result.project && typeof result.project === "object" ? result.project : {};
const construction = project.construction && typeof project.construction === "object" ? project.construction : {};
const resolved = value => {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  const v = String(value).trim().toLowerCase();
  return Boolean(v) && !/^(null|undefined|unknown|невідомо|не визначено|не визначена|не визначений|немає даних|n\/a|\?)$/.test(v);
};
const questionFields = {
  project_name: project.name,
  overall_width: project.width_mm,
  overall_height: project.height_mm,
  overall_depth: project.depth_mm,
  top_type: construction.top_type,
  bottom_type: construction.bottom_type,
  support_type: construction.support_type,
  plinth_height: construction.plinth_height_mm,
  plinth_setback: construction.plinth_setback_mm,
  back_panel_type: construction.back_panel_type,
  back_groove_offset: construction.back_groove_offset_mm,
  facade_type: construction.facade_type,
  side_panels: construction.side_panels
};
const rawQuestions = Array.isArray(result.questions) ? result.questions : [];
const seen = new Set();
const questions = rawQuestions.filter(question => {
  const id = String(question?.id || "").trim().toLowerCase();
  if (!id || seen.has(id)) return false;
  seen.add(id);
  return !(Object.prototype.hasOwnProperty.call(questionFields, id) && resolved(questionFields[id]));
});
result.questions = questions;
result.status = questions.length ? "needs_clarification" : "ready";
result.wardrobe = wardrobe;

return jsonResponse({
  status: questions.length ? "needs_clarification" : "completed",
  result,
  wardrobe
});

  }
  catch (error) {

    console.error(
      "ELVIN STATUS ERROR",
      error
    );


    return jsonResponse(
      {
        error:
          error?.message ||
          String(error)
      },
      500
    );
  }
};

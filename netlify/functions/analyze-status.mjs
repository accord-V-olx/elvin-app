import { buildWardrobe } from "../../engine/wardrobe-engine.js";
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


function getOutputText(response) {
  const parts = [];

  for (const item of response.output || []) {

    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content || []) {

      if (
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }

  return parts.join("");
}


export default async (request) => {

  if (request.method !== "GET") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }


  try {

    const apiKey =
      process.env.OPENAI_API_KEY;


    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "OPENAI_API_KEY не знайдено."
        },
        500
      );
    }


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


    const response =
      await fetch(
        `https://api.openai.com/v1/responses/${encodeURIComponent(jobId)}`,
        {
          headers: {
            Authorization:
              `Bearer ${apiKey}`
          }
        }
      );


    const rawText =
      await response.text();


    let data;

    try {
      data =
        JSON.parse(rawText);
    }
    catch {
      return jsonResponse(
        {
          error:
            `OpenAI повернув не JSON: ${rawText}`
        },
        502
      );
    }


    if (!response.ok) {
      return jsonResponse(
        {
          error:
            data?.error?.message ||
            rawText
        },
        502
      );
    }


    if (
      data.status === "queued" ||
      data.status === "in_progress"
    ) {
      return jsonResponse(
        {
          status:
            data.status
        }
      );
    }


    if (
      data.status === "failed" ||
      data.status === "cancelled" ||
      data.status === "incomplete"
    ) {
      return jsonResponse(
        {
          status:
            data.status,

          error:
            data?.error?.message ||
            data?.incomplete_details?.reason ||
            "Аналіз не завершився."
        }
      );
    }


    if (data.status !== "completed") {
      return jsonResponse(
        {
          status:
            data.status || "unknown"
        }
      );
    }


    const text =
      getOutputText(data);


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
const wardrobe = buildWardrobe(result);
// Do not ask again for facts already resolved in the structured analysis.
// Only explicit, meaningful values count; unknown placeholders do not.
const project = result.project && typeof result.project === "object" ? result.project : {};
const construction = project.construction && typeof project.construction === "object" ? project.construction : {};
const resolved = value => {
  if (value === null || value === undefined || value === "") return false;
  if (typeof value === "number") return Number.isFinite(value) && value > 0;
  const v = String(value).trim().toLowerCase();
  return Boolean(v) && !/^(null|undefined|unknown|невідомо|не визначено|не визначена|не визначений|немає даних|n\\/a|\\?)$/.test(v);
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

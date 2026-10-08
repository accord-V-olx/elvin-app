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
const wardrobe = buildWardrobe(result);

if (!wardrobe.ok) {
  const existing = Array.isArray(result.questions) ? result.questions : [];
  const normalize = v => String(v||"").toLowerCase().replace(/[^a-zа-яіїєґ0-9]/gi,"");
  // Keep one clarification per physical decision; AI questions take priority.
  const related = {
    "construction.support_type": /опор|цокол|ніжк|support|plinth/i,
    "construction.side_panels": /боковин|стійк|side.panel/i,
    "construction.top_type": /кришк|верх|top.type/i,
    "construction.bottom_type": /дн[оа]|bottom.type/i,
    "construction.back_panel_type": /задн|хдф|back.panel/i,
    "construction.facade_type": /фасад|facade/i
  };
  const engineQuestions = (wardrobe.missing || [])
    .filter(item => {
      const field = String(item.field);
      return !existing.some(q => {
        const id = String(q.id||q.key||"");
        const title = String(q.title||"");
        const question = String(q.question||"");
        return normalize(id)===normalize(field) ||
          (related[field] && related[field].test(id+" "+title+" "+question));
      });
    })
    .map(item => ({
      id: String(item.field),
      title: "Уточнення конструкції",
      question: item.question,
      options: []
    }));

  result.status = "needs_clarification";
  result.questions = [...existing, ...engineQuestions];
  result.wardrobe = wardrobe;

  return jsonResponse({
    status: "needs_clarification",
    result,
    wardrobe
  });
}

result.wardrobe = wardrobe;

    return jsonResponse(
      {
        status: "completed",
        result
      }
    );

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

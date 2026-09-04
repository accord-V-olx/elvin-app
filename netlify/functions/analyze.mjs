const MAX_FILE_CHARS = 6_000_000;

const schema = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["needs_clarification", "ready"] },
    summary: { type: "string" },
    project: {
      type: "object",
      properties: {
        name: { type: "string" },
        furniture_type: { type: "string" },
        width_mm: { type: "number" },
        height_mm: { type: "number" },
        depth_mm: { type: "number" },
        sections_description: { type: "string" },
        material: { type: "string" },
        back_panel: { type: "string" }
      },
      required: ["name","furniture_type","width_mm","height_mm","depth_mm","sections_description","material","back_panel"],
      additionalProperties: false
    },
    warnings: { type: "array", items: { type: "string" } },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          question: { type: "string" },
          allow_other: { type: "boolean" },
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                recommended: { type: "boolean" }
              },
              required: ["id","label","recommended"],
              additionalProperties: false
            }
          }
        },
        required: ["id","title","question","allow_other","options"],
        additionalProperties: false
      }
    }
  },
  required: ["status","summary","project","warnings","questions"],
  additionalProperties: false
};

function outputText(json) {
  const parts = [];
  for (const item of json.output || []) {
    if (item.type !== "message") continue;
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }
  return parts.join("");
}

function systemPrompt() {
  return `
Ти — Elvin, вузький AI-помічник технолога меблевої фабрики.
Зараз працюєш ТІЛЬКИ з шафами.

ГОЛОВНЕ ПРАВИЛО: STOP → ASK.
Не вгадуй критичні виробничі дані.

1. Назва замовлення повинна бути точно такою, як на документі. Якщо не видно або є кілька варіантів — постав питання.
2. Зчитай тільки те, що реально є на кресленні: габарити, секції, примітки, матеріал, задню стінку, фасади, цоколь та інші явні дані.
3. Виявляй суперечності між розмірними лініями, підписами, малюнком і примітками.
4. Не створюй вигадані "Варіант 1/2/3/4". Варіанти мають походити з реального документа або чіткої конструктивної альтернативи.
5. Якщо можлива обґрунтована рекомендація, познач recommended=true, але не вибирай автоматично.
6. Якщо критичних питань немає, status="ready" і questions=[].
7. Якщо даних немає й вони не критичні, для тексту залиш порожній рядок, для числа 0, і за потреби додай warning.
8. Відповідай українською.
9. Цей етап НЕ генерує BAZIS. Він лише читає документ і формує уточнення.
10. Відповіді технолога вважай підтвердженими фактами.
`;
}

function userPrompt(note, answers, previousAnalysis) {
  let prompt = "Проаналізуй завантажене креслення або замовлення шафи.";
  if (note) prompt += "\n\nПримітка технолога:\n" + note;
  if (previousAnalysis && answers) {
    prompt += "\n\nЦе повторний аналіз після відповідей технолога.";
    prompt += "\n\nПопередній результат:\n" + JSON.stringify(previousAnalysis);
    prompt += "\n\nВідповіді технолога:\n" + JSON.stringify(answers);
    prompt += "\n\nВрахуй ці відповіді як підтверджені факти та перевір, чи залишилися інші критичні питання.";
  }
  return prompt;
}

export default async (request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" }
    });
  }

  try {
    const apiKey = Netlify.env.get("OPENAI_API_KEY");
    const model = Netlify.env.get("OPENAI_MODEL") || "gpt-5.6-sol";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "На сервері не задано OPENAI_API_KEY." }), {
        status: 500,
        headers: { "content-type": "application/json" }
      });
    }

    const body = await request.json();
    const {
      fileName,
      mimeType,
      dataUrl,
      note = "",
      answers = null,
      previousAnalysis = null
    } = body || {};

    if (!fileName || !mimeType || !dataUrl) {
      return new Response(JSON.stringify({ error: "Не отримано файл." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    if (dataUrl.length > MAX_FILE_CHARS) {
      return new Response(JSON.stringify({ error: "Файл завеликий для цієї тестової версії." }), {
        status: 413,
        headers: { "content-type": "application/json" }
      });
    }

    const content = [
      { type: "input_text", text: userPrompt(note, answers, previousAnalysis) }
    ];

    if (mimeType === "application/pdf") {
      content.unshift({
        type: "input_file",
        filename: fileName,
        file_data: dataUrl
      });
    } else if (mimeType === "image/jpeg" || mimeType === "image/png") {
      content.unshift({
        type: "input_image",
        image_url: dataUrl,
        detail: "high"
      });
    } else {
      return new Response(JSON.stringify({ error: "Підтримуються PDF, JPG/JPEG та PNG." }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const payload = {
      model,
      reasoning: { effort: "medium" },
      input: [
        { role: "system", content: systemPrompt() },
        { role: "user", content }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "elvin_wardrobe_document_analysis",
          strict: true,
          schema
        }
      }
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.json();

    if (!response.ok) {
      console.error("OpenAI error", raw);
      return new Response(JSON.stringify({
        error: raw?.error?.message || "OpenAI API error"
      }), {
        status: 502,
        headers: { "content-type": "application/json" }
      });
    }

    const text = outputText(raw);

    if (!text) {
      return new Response(JSON.stringify({
        error: "Elvin не повернув структурований результат."
      }), {
        status: 502,
        headers: { "content-type": "application/json" }
      });
    }

    const result = JSON.parse(text);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store"
      }
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({
      error: error?.message || "Невідома помилка."
    }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
};

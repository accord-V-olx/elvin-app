const MAX_IMAGES = 8;
const MAX_TOTAL_CHARS = 5_500_000;

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function safeString(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];

  return images
    .filter(
      image =>
        image &&
        typeof image.dataUrl === "string" &&
        image.dataUrl.startsWith("data:image/")
    )
    .slice(0, MAX_IMAGES);
}

function normalizeAnswers(answers) {
  if (
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  ) {
    return {};
  }

  const result = {};

  for (const [key, value] of Object.entries(answers)) {
    const k = safeString(key).trim();
    const v = safeString(value).trim();

    if (k && v) {
      result[k] = v;
    }
  }

  return result;
}

function buildAnswerText(answers) {
  const entries = Object.entries(answers);

  if (!entries.length) {
    return "Немає відповідей користувача.";
  }

  return entries
    .map(
      ([key, value], i) =>
        `${i + 1}. ${key}: ${value}`
    )
    .join("\n");
}


const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    status: {
      type: "string",
      enum: [
        "needs_clarification",
        "ready"
      ]
    },

    summary: {
      type: "string"
    },

    project: {
      type: "object",
      additionalProperties: false,

      properties: {
        name: {
          type: ["string", "null"]
        },

        furniture_type: {
          type: ["string", "null"]
        },

        width_mm: {
          type: ["number", "null"]
        },

        height_mm: {
          type: ["number", "null"]
        },

        depth_mm: {
          type: ["number", "null"]
        },

        sections_description: {
          type: ["string", "null"]
        },

        material: {
          type: ["string", "null"]
        },

        back_panel: {
          type: ["string", "null"]
        }
      },

      required: [
        "name",
        "furniture_type",
        "width_mm",
        "height_mm",
        "depth_mm",
        "sections_description",
        "material",
        "back_panel"
      ]
    },

    warnings: {
      type: "array",
      items: {
        type: "string"
      }
    },

    questions: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string"
          },

          title: {
            type: "string"
          },

          question: {
            type: "string"
          },

          options: {
            type: "array",

            items: {
              type: "object",
              additionalProperties: false,

              properties: {
                label: {
                  type: "string"
                },

                value: {
                  type: "string"
                },

                recommended: {
                  type: "boolean"
                }
              },

              required: [
                "label",
                "value",
                "recommended"
              ]
            }
          }
        },

        required: [
          "id",
          "title",
          "question",
          "options"
        ]
      }
    }
  },

  required: [
    "status",
    "summary",
    "project",
    "warnings",
    "questions"
  ]
};


function initialPrompt(note) {
  return `
Ти — Elvin, AI-помічник меблевого технолога для виробництва шаф.

Усі фото в одному запиті — це різні аркуші ОДНОГО замовлення / ОДНІЄЇ шафи.

Перед висновком зістав інформацію між УСІМА фото.

Правила:

1. Не вигадуй критичні виробничі дані.

2. Якщо відповідь є на іншому фото — не питай користувача.

3. Якщо є суперечність або критичне значення неможливо визначити надійно — постав конкретне питання.

4. Якщо можеш запропонувати варіанти — дай короткі options.

5. Можеш позначити найімовірніший варіант recommended=true, але не вважай його підтвердженим.

6. Назву замовлення не вигадуй. Якщо не читається — запитай.

7. Не плутай загальний габарит з розмірами модулів, доборів, планок чи боковин.

8. Не підсумовуй видимі числа як загальний габарит без прямого підтвердження кресленням.

9. Питай тільки те, без чого не можна надійно продовжити конструктив.

10. Не дублюй питання.

11. Якщо критичних питань немає:
status="ready"
questions=[]

12. Якщо питання є:
status="needs_clarification"

Примітка технолога:

${note || "Немає примітки."}

Поверни тільки структурований JSON за заданою схемою.
`.trim();
}


function clarificationPrompt(
  previousAnalysis,
  answers,
  note
) {
  return `
Ти — Elvin, AI-помічник меблевого технолога.

Це ПРОДОВЖЕННЯ аналізу того самого замовлення.

НЕ починай роботу з нуля.

У тебе є:
- ті самі фотографії;
- попередній аналіз;
- підтверджені відповіді технолога.

Потрібно:

1. Врахувати попередній аналіз.

2. Врахувати КОЖНУ відповідь технолога як підтверджену інформацію.

3. НЕ ставити повторно питання, на яке технолог уже дав відповідь.

4. Оновити project відповідно до відповідей.

5. Оновити summary відповідно до відповідей.

6. Перевірити, чи залишилися критичні невідомі або суперечності.

7. Якщо залишилися — поставити ТІЛЬКИ нові або невирішені питання.

8. Якщо все критичне визначено:
status="ready"
questions=[]

9. Не вигадувати дані, яких немає:
- на фото;
- у попередньому аналізі;
- у відповідях технолога.

10. Якщо точна назва замовлення вже підтверджена технологом — перенести її в project.name.

11. Усі фото — аркуші ОДНОГО замовлення.

12. Не плутати загальний габарит із сумою модулів, доборів або інших елементів без явного підтвердження.

ПОПЕРЕДНІЙ АНАЛІЗ:

${safeString(previousAnalysis)}

ПІДТВЕРДЖЕНІ ВІДПОВІДІ ТЕХНОЛОГА:

${buildAnswerText(answers)}

ПРИМІТКА ТЕХНОЛОГА:

${note || "Немає примітки."}

Поверни тільки структурований JSON за заданою схемою.
`.trim();
}


export default async (request) => {

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error: "Method not allowed"
      },
      405
    );
  }


  try {

    const apiKey =
      process.env.OPENAI_API_KEY;

    const model =
      process.env.OPENAI_MODEL ||
      "gpt-5.6-sol";


    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "OPENAI_API_KEY не знайдено."
        },
        500
      );
    }


    let body;


    try {
      body =
        await request.json();
    }
    catch {
      return jsonResponse(
        {
          error:
            "Не вдалося прочитати запит."
        },
        400
      );
    }


    const images =
      normalizeImages(
        body?.images
      );


    const note =
      safeString(
        body?.note
      ).trim();


    const answers =
      normalizeAnswers(
        body?.answers
      );


    const previousAnalysis =
      body?.previousAnalysis &&
      typeof body.previousAnalysis === "object"

        ? body.previousAnalysis

        : null;


    if (!images.length) {
      return jsonResponse(
        {
          error:
            "Не передано жодного фото."
        },
        400
      );
    }


    const totalChars =
      images.reduce(
        (sum, image) =>
          sum +
          image.dataUrl.length,
        0
      );


    if (
      totalChars >
      MAX_TOTAL_CHARS
    ) {
      return jsonResponse(
        {
          error:
            "Фото завеликі для одного запиту. Спробуйте зменшити кількість або розмір фото."
        },
        413
      );
    }


    const isClarification =
      previousAnalysis &&
      Object.keys(answers).length > 0;


    const prompt =
      isClarification

        ? clarificationPrompt(
            previousAnalysis,
            answers,
            note
          )

        : initialPrompt(
            note
          );


    const content = [
      {
        type: "input_text",
        text: prompt
      }
    ];


    images.forEach(
      (image, index) => {

        content.push({
          type: "input_text",

          text:
            `Аркуш ${index + 1}` +
            (
              image.fileName

                ? ` (${image.fileName})`

                : ""
            )
        });


        content.push({
          type: "input_image",

          image_url:
            image.dataUrl
        });

      }
    );


    const openAIResponse =
      await fetch(
        "https://api.openai.com/v1/responses",

        {
          method: "POST",

          headers: {
            "content-type":
              "application/json",

            authorization:
              `Bearer ${apiKey}`
          },


          body: JSON.stringify({

            model,

            background: true,

            reasoning: {
              effort: "medium"
            },


            input: [
              {
                role: "user",
                content
              }
            ],


            text: {
              format: {

                type:
                  "json_schema",

                name:
                  "elvin_wardrobe_analysis",

                strict:
                  true,

                schema:
                  RESPONSE_SCHEMA
              }
            }

          })
        }
      );


    const rawText =
      await openAIResponse.text();


    let data;


    try {
      data =
        JSON.parse(
          rawText
        );
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


    if (!openAIResponse.ok) {
      return jsonResponse(
        {
          error:
            data?.error?.message ||
            rawText
        },
        502
      );
    }


    if (!data?.id) {
      return jsonResponse(
        {
          error:
            "OpenAI не повернув ID аналізу."
        },
        502
      );
    }


    return jsonResponse(
      {
        job_id:
          data.id,

        status:
          data.status ||
          "queued",

        mode:
          isClarification
            ? "clarification"
            : "initial"
      }
    );

  }
  catch (error) {

    console.error(
      "ELVIN START ERROR",
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


const MAX_IMAGES = 8;
const MAX_TOTAL_CHARS = 5_500_000;

const schema = {
  type: "object",

  properties: {
    status: {
      type: "string",
      enum: ["needs_clarification", "ready"]
    },

    summary: {
      type: "string"
    },

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

      required: [
        "name",
        "furniture_type",
        "width_mm",
        "height_mm",
        "depth_mm",
        "sections_description",
        "material",
        "back_panel"
      ],

      additionalProperties: false
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

          allow_other: {
            type: "boolean"
          },

          options: {
            type: "array",

            items: {
              type: "object",

              properties: {
                id: {
                  type: "string"
                },

                label: {
                  type: "string"
                },

                recommended: {
                  type: "boolean"
                }
              },

              required: [
                "id",
                "label",
                "recommended"
              ],

              additionalProperties: false
            }
          }
        },

        required: [
          "id",
          "title",
          "question",
          "allow_other",
          "options"
        ],

        additionalProperties: false
      }
    }
  },

  required: [
    "status",
    "summary",
    "project",
    "warnings",
    "questions"
  ],

  additionalProperties: false
};


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


function elvinInstructions() {
  return `
Ти — Elvin, AI-помічник технолога меблевої фабрики.

Зараз ти працюєш ТІЛЬКИ з шафами.

ВАЖЛИВО:

Усі фото, передані в одному запиті,
за замовчуванням є РІЗНИМИ АРКУШАМИ
ОДНОГО І ТОГО САМОГО ШКАФА.

Не аналізуй їх як окремі шафи.

Ти повинен спочатку переглянути ВСІ фото,
потім об'єднати інформацію з усіх аркушів
в один проєкт.

Наприклад:

Фото 1 може містити:
- фасади;
- загальні габарити;
- матеріал;
- примітки.

Фото 2 може містити:
- внутрішнє наповнення;
- полиці;
- перегородки;
- шухляди;
- інші розміри.

Разом вони описують ОДИН шкаф.


================================
ГОЛОВНЕ ПРАВИЛО ELVIN
================================

STOP → ASK.

Ніколи не вгадуй критичні виробничі дані.

Якщо:
- напис нерозбірливий;
- розмір відсутній;
- два аркуші суперечать один одному;
- є декілька можливих трактувань;
- видно, що існує ще один потрібний аркуш;

постав конкретне питання технологу.


================================
НАЗВА ЗАМОВЛЕННЯ
================================

Назва замовлення обов'язкова.

Назва повинна бути ТОЧНО такою,
як написано на замовленні.

Не придумуй.
Не скорочуй.
Не перейменовуй.

Якщо не можеш надійно прочитати назву:

status = "needs_clarification"


================================
АНАЛІЗ КІЛЬКОХ ФОТО
================================

Обов'язково зістав інформацію між усіма фото.

Якщо на першому аркуші немає інформації,
але вона є на другому —
використовуй інформацію з другого.

Не питай те,
на що відповідь уже є на іншому
завантаженому фото.

Якщо на різних фото є різні значення —
STOP → ASK.


================================
РОЗМІРИ
================================

Зчитуй реальні написані розміри:

- загальну ширину;
- висоту;
- глибину;
- ширини секцій;
- внутрішні висоти;
- цоколь;
- полиці;
- перегородки.

Не визначай точні розміри
лише за пропорціями картинки.


================================
МАТЕРІАЛИ І КОНСТРУКЦІЯ
================================

Зчитуй тільки те,
що реально видно або написано.

Наприклад:

- ДСП;
- код декору;
- ДВП / HDF;
- фасади;
- видима боковина;
- цоколь;
- петлі;
- направляючі;
- ручки.

Не вигадуй відсутні дані.


================================
СУПЕРЕЧНОСТІ
================================

Приклад:

на розмірній лінії:
450 мм

у підписі:
400 мм

Не обирай самостійно.

Створи питання:

"На розмірній лінії вказано 450 мм,
а в підписі 400 мм.
Який розмір використовувати?"

Варіанти:

"450 мм — як на розмірній лінії"

"400 мм — як у підписі"


================================
ВАРІАНТИ
================================

Не створюй:

"Варіант 1"
"Варіант 2"
"Варіант 3"

Кожна кнопка повинна містити
реальне конкретне рішення.


================================
READY
================================

status = "ready"

можна ставити ТІЛЬКИ коли:

- всі завантажені фото переглянуті;
- інформація між ними об'єднана;
- немає критичних суперечностей;
- немає критично відсутніх даних;
- questions = [].


================================
ВАЖЛИВО
================================

Ніколи не пиши:

"технолог підтвердив"

"за підтвердженням технолога"

"узгоджено технологом"

якщо технолог реально цього не підтверджував.


Якщо даних немає:

текстове поле = ""

числове поле = 0

Не вигадуй значення.


На цьому етапі НЕ генеруй BAZIS.

Твоя задача:

1. переглянути всі фото;
2. зрозуміти, що це один шкаф;
3. об'єднати дані;
4. знайти суперечності;
5. поставити питання;
6. визначити готовність до Wardrobe Engine.

Відповідай українською.
`;
}


export default async (request) => {

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405
    );
  }

  try {

    const apiKey =
      Netlify.env.get("OPENAI_API_KEY");

    const model =
      Netlify.env.get("OPENAI_MODEL")
      || "gpt-5.6-sol";


    if (!apiKey) {
      return jsonResponse(
        {
          error:
            "OPENAI_API_KEY не знайдено."
        },
        500
      );
    }


    const body =
      await request.json();


    const images =
      body?.images || [];


    const note =
      body?.note || "";


    if (
      !Array.isArray(images) ||
      images.length === 0
    ) {
      return jsonResponse(
        {
          error:
            "Не отримано жодного фото."
        },
        400
      );
    }


    if (
      images.length > MAX_IMAGES
    ) {
      return jsonResponse(
        {
          error:
            `Максимум ${MAX_IMAGES} фото.`
        },
        400
      );
    }


    let totalChars = 0;


    for (const image of images) {

      if (
        !image?.dataUrl ||
        !image?.fileName
      ) {
        return jsonResponse(
          {
            error:
              "Одне з фото передано некоректно."
          },
          400
        );
      }

      totalChars +=
        image.dataUrl.length;
    }


    if (
      totalChars > MAX_TOTAL_CHARS
    ) {
      return jsonResponse(
        {
          error:
            "Фото разом завеликі."
        },
        413
      );
    }


    const userContent = [];


    images.forEach(
      (image, index) => {

        userContent.push({
          type: "input_text",

          text:
            `АРКУШ ${index + 1} ОДНОГО ЗАМОВЛЕННЯ: ${image.fileName}`
        });


        userContent.push({
          type: "input_image",

          image_url:
            image.dataUrl,

          detail:
            "high"
        });
      }
    );


    let task = `
Усі ${images.length} фото — це аркуші ОДНОГО замовлення.

Переглянь кожен аркуш.

Не роби висновок після першого фото.

Спочатку зістав усю інформацію між фото,
після цього сформуй один результат для одного шкафа.
`;


    if (note) {
      task +=
        `\n\nПримітка технолога:\n${note}`;
    }


    userContent.push({
      type: "input_text",
      text: task
    });


    const response =
      await fetch(
        "https://api.openai.com/v1/responses",
        {
          method: "POST",

          headers: {
            "Authorization":
              `Bearer ${apiKey}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            model,

            background: true,

            reasoning: {
              effort: "medium"
            },

            input: [

              {
                role: "system",

                content: [
                  {
                    type: "input_text",
                    text: elvinInstructions()
                  }
                ]
              },

              {
                role: "user",
                content: userContent
              }
            ],

            text: {
              format: {
                type: "json_schema",

                name:
                  "elvin_wardrobe_analysis",

                strict: true,

                schema
              }
            }
          })
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
            `OpenAI повернув неправильну відповідь:\n${rawText}`
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
        job_id: data.id,
        status:
          data.status || "queued"
      },
      200
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

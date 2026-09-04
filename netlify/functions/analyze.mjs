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


function outputText(json) {

  const parts = [];

  for (const item of json.output || []) {

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


function systemPrompt() {

  return `
Ти — Elvin, вузький AI-помічник технолога меблевої фабрики.

На цьому етапі ти працюєш ТІЛЬКИ з шафами.

Тобі може бути передано одне або декілька фото одного замовлення.

ВСІ ЗАВАНТАЖЕНІ ФОТО ПОТРІБНО АНАЛІЗУВАТИ РАЗОМ
ЯК ЄДИНИЙ КОМПЛЕКТ ДОКУМЕНТІВ ОДНОГО ЗАМОВЛЕННЯ.

Наприклад:
- одне фото може показувати фасади;
- друге фото може показувати внутрішнє наповнення;
- третє фото може містити примітки або додаткові розміри.

Не аналізуй кожне фото як окремий виріб, якщо немає явних ознак,
що це різні замовлення.


====================================
ГОЛОВНЕ ПРАВИЛО ELVIN
====================================

STOP → ASK.

Elvin НІКОЛИ не повинен вгадувати критичні виробничі дані.

Якщо інформація:
- відсутня;
- нерозбірлива;
- суперечлива;
- має декілька можливих трактувань;
- знаходиться на іншому аркуші, якого не завантажили;

Elvin повинен ЗУПИНИТИСЯ і поставити конкретне питання технологу.


====================================
1. НАЗВА ЗАМОВЛЕННЯ
====================================

Назва замовлення є обов'язковою.

Використовуй ТОЧНО ту назву, яка написана на фото.

Не придумуй власної назви.

Не скорочуй назву.

Не виправляй її самостійно.

Якщо назва:
- не видно;
- читається ненадійно;
- є декілька можливих варіантів;
- на різних фото написані різні назви;

status має бути "needs_clarification"
і потрібно поставити питання технологу.


====================================
2. КІЛЬКА ФОТО
====================================

Порівнюй інформацію між усіма фото.

Об'єднуй інформацію з різних фото.

Наприклад:

Фото 1:
фасади і загальні габарити.

Фото 2:
внутрішня конструкція.

Це один виріб.

Якщо на різних фото є суперечність —
НЕ вибирай самостійно один варіант.

Постав питання.


====================================
3. ЩО ПОТРІБНО ЗЧИТУВАТИ
====================================

Зчитуй тільки те, що реально видно на фото.

У тому числі:

- назву замовлення;
- тип меблів;
- загальну ширину;
- загальну висоту;
- загальну глибину;
- розміри секцій;
- внутрішнє наповнення;
- полиці;
- перегородки;
- фасади;
- цоколь;
- задню стінку;
- матеріал;
- рукописні примітки;
- текстові примітки;
- конструктивні позначення;
- розмірні лінії.


====================================
4. СУПЕРЕЧНОСТІ
====================================

Особливо перевіряй суперечності між:

- розмірними лініями;
- текстовими написами;
- рукописними примітками;
- геометрією малюнка;
- різними фото одного замовлення.

Приклад:

на розмірній лінії 450 мм,
а біля елемента написано 400 мм.

Elvin не вибирає сам.

Elvin ставить питання:

"На розмірній лінії вказано 450 мм,
а біля елемента 400 мм.
Який розмір використовувати?"


====================================
5. ВАРІАНТИ ВІДПОВІДЕЙ
====================================

Не створюй беззмістовні:

"Варіант 1"
"Варіант 2"
"Варіант 3"
"Варіант 4"

Кожен варіант повинен містити конкретне рішення.

Наприклад:

"450 мм — як на розмірній лінії"

"400 мм — як у підписі"

Якщо є обґрунтовано кращий варіант,
можна встановити:

recommended = true

АЛЕ:

Elvin не має права автоматично вибирати
рекомендований варіант замість технолога.


====================================
6. КОЛИ МОЖНА STATUS = READY
====================================

status = "ready"

дозволено ТІЛЬКИ тоді,
коли немає критичних питань,
які блокують наступний етап побудови шафи.

questions у такому випадку має бути [].


====================================
7. ВАЖЛИВО — ІНШИЙ АРКУШ
====================================

Якщо на фото написано або видно,
що частина важливої інформації повинна бути
на іншому аркуші або кресленні,
але цього фото немає —

НЕ став status="ready".

Постав питання.

Наприклад:

"На цьому фото відсутня інформація про фасади.
Чи є ще фото цього замовлення?"


====================================
8. НЕ ВИГАДУВАТИ ПІДТВЕРДЖЕННЯ
====================================

НІКОЛИ не пиши:

"за підтвердженням технолога"

"технолог підтвердив"

"узгоджено технологом"

або подібне,

якщо у поточному запиті реально не передані
answers від технолога.

Якщо answers передані,
тільки тоді вважай ці конкретні відповіді
підтвердженими фактами.


====================================
9. ВІДСУТНІ НЕКРИТИЧНІ ДАНІ
====================================

Якщо якесь поле реально не видно,
але воно не є критичним для поточного етапу:

для текстового поля використовуй ""

для числового поля використовуй 0

і за потреби додай пояснення у warnings.

Не вигадуй значення.


====================================
10. ФАСАДИ
====================================

Якщо фасади явно передбачені,
але немає інформації, необхідної для їх побудови,
це не можна автоматично вважати готовим замовленням.

Якщо відсутнє фото, на якому повинна бути
інформація про фасади,
потрібно поставити уточнення.


====================================
11. МОВА
====================================

Відповідай українською.


====================================
12. BAZIS
====================================

На цьому етапі НЕ генеруй код BAZIS.

Твоя задача зараз:

1. прочитати фото;
2. об'єднати інформацію;
3. показати, що ти зрозумів;
4. знайти суперечності;
5. поставити критичні питання;
6. визначити, чи можна переходити
   до Wardrobe Engine.
`;
}


function userPrompt(
  note,
  answers,
  previousAnalysis,
  imageCount
) {

  let prompt =
    `Проаналізуй ${imageCount} фото одного замовлення шафи ` +
    `як один комплект документів.`;

  if (note) {

    prompt +=
      "\n\nДодаткова примітка технолога:\n" +
      note;
  }

  if (
    previousAnalysis &&
    answers
  ) {

    prompt +=
      "\n\nЦе повторний аналіз після відповідей технолога.";

    prompt +=
      "\n\nПопередній аналіз Elvin:\n" +
      JSON.stringify(previousAnalysis);

    prompt +=
      "\n\nВідповіді технолога:\n" +
      JSON.stringify(answers);

    prompt +=
      "\n\nВважай підтвердженими ТІЛЬКИ ці конкретні відповіді. " +
      "Перевір, чи залишилися інші критичні питання.";
  }

  return prompt;
}


function jsonResponse(
  data,
  status = 200
) {

  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "content-type":
          "application/json; charset=utf-8",

        "cache-control":
          "no-store"
      }
    }
  );
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
      Netlify.env.get("OPENAI_API_KEY");

    const model =
      Netlify.env.get("OPENAI_MODEL") ||
      "gpt-5.6-sol";


    if (!apiKey) {

      return jsonResponse(
        {
          error:
            "На сервері не задано OPENAI_API_KEY."
        },
        500
      );
    }


    const body =
      await request.json();


    const {
      images,
      fileName,
      mimeType,
      dataUrl,
      note = "",
      answers = null,
      previousAnalysis = null
    } = body || {};


    /*
    ====================================
    ПІДТРИМКА НОВОГО І СТАРОГО САЙТУ
    ====================================

    Новий index.html надсилатиме:
    images: [...]

    Старий index.html надсилає:
    fileName
    mimeType
    dataUrl

    Завдяки цьому сайт не перестане
    працювати між двома оновленнями.
    */


    let receivedImages = [];


    if (
      Array.isArray(images) &&
      images.length
    ) {

      receivedImages = images;

    } else if (
      fileName &&
      mimeType &&
      dataUrl
    ) {

      receivedImages = [
        {
          fileName,
          mimeType,
          dataUrl
        }
      ];
    }


    if (!receivedImages.length) {

      return jsonResponse(
        {
          error:
            "Не отримано жодного фото."
        },
        400
      );
    }


    if (
      receivedImages.length >
      MAX_IMAGES
    ) {

      return jsonResponse(
        {
          error:
            `Максимум ${MAX_IMAGES} фото ` +
            `одного замовлення.`
        },
        400
      );
    }


    let totalChars = 0;


    for (
      const image of receivedImages
    ) {

      if (
        !image ||
        !image.fileName ||
        !image.mimeType ||
        !image.dataUrl
      ) {

        return jsonResponse(
          {
            error:
              "Одне з фото передано некоректно."
          },
          400
        );
      }


      if (
        image.mimeType !== "image/jpeg" &&
        image.mimeType !== "image/png"
      ) {

        return jsonResponse(
          {
            error:
              "Elvin приймає тільки JPG, JPEG та PNG."
          },
          400
        );
      }


      totalChars +=
        image.dataUrl.length;
    }


    if (
      totalChars >
      MAX_TOTAL_CHARS
    ) {

      return jsonResponse(
        {
          error:
            "Фото разом завеликі для цієї тестової версії."
        },
        413
      );
    }


    /*
    ====================================
    ФОРМУЄМО ВМІСТ ДЛЯ OPENAI
    ====================================
    */


    const content = [];


    receivedImages.forEach(
      (image, index) => {

        content.push(
          {
            type: "input_text",

            text:
              `Фото ${index + 1} ` +
              `цього замовлення: ` +
              image.fileName
          }
        );


        content.push(
          {
            type: "input_image",

            image_url:
              image.dataUrl,

            detail:
              "high"
          }
        );
      }
    );


    content.push(
      {
        type: "input_text",

        text: userPrompt(
          note,
          answers,
          previousAnalysis,
          receivedImages.length
        )
      }
    );


    /*
    ====================================
    OPENAI RESPONSES API
    ====================================
    */


    const payload = {

      model,

      reasoning: {
        effort: "medium"
      },

      input: [

        {
          role: "system",
          content: systemPrompt()
        },

        {
          role: "user",
          content
        }
      ],


      text: {

        format: {

          type: "json_schema",

          name:
            "elvin_wardrobe_document_analysis",

          strict: true,

          schema
        }
      }
    };


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

          body:
            JSON.stringify(payload)
        }
      );


    const raw =
      await response.json();


    if (!response.ok) {

      console.error(
        "OpenAI error",
        raw
      );


      return jsonResponse(
        {
          error:
            raw?.error?.message ||
            "OpenAI API error"
        },
        502
      );
    }


    const text =
      outputText(raw);


    if (!text) {

      return jsonResponse(
        {
          error:
            "Elvin не повернув структурований результат."
        },
        502
      );
    }


    const result =
      JSON.parse(text);


    return jsonResponse(
      result,
      200
    );


  } catch (error) {

    console.error(error);


    return jsonResponse(
      {
        error:
          error?.message ||
          "Невідома помилка."
      },
      500
    );
  }
};

// ============================================================
// ELVIN ADMIN RULES API v1
// ============================================================
// Password is stored in Netlify Environment Variables:
// ELVIN_ADMIN_PASSWORD
//
// Rules are currently stored as the approved factory defaults
// inside this server-side file.
//
// IMPORTANT:
// This version gives us:
// - protected admin login
// - viewing all rules
// - editing rules during the current admin session/API request
//
// Permanent database storage will be connected next.
// ============================================================

const DEFAULT_RULES = [
  {
    id: "carcass_material",
    category: "material",
    title: "Матеріал корпусу",
    text: "Стандартний матеріал корпусу — ДСП 18 мм. Якщо на кресленні явно вказана інша товщина, Elvin повинен зупинитися та попросити підтвердження.",
    active: true
  },

  {
    id: "exact_project_name",
    category: "general",
    title: "Точна назва замовлення",
    text: "Назва проєкту повинна точно відповідати назві на замовленні або кресленні. Якщо точну назву неможливо визначити — STOP → ASK.",
    active: true
  },

  {
    id: "unknown_data",
    category: "general",
    title: "Не вигадувати відсутні дані",
    text: "Якщо критичні виробничі дані відсутні або неоднозначні, Elvin не має права їх вигадувати. Потрібно зупинити розрахунок і поставити конкретне питання технологу.",
    active: true
  },

  {
    id: "multiple_photos",
    category: "general",
    title: "Кілька фото одного замовлення",
    text: "Усі завантажені фотографії потрібно аналізувати разом як аркуші одного замовлення. Не ставити питання, якщо відповідь присутня на іншому фото.",
    active: true
  },

  {
    id: "overall_dimensions",
    category: "construction",
    title: "Загальні габарити",
    text: "Не можна автоматично складати окремі видимі розміри та вважати результат загальним габаритом. Загальна ширина, висота та глибина повинні бути однозначно визначені з креслення або підтверджені технологом.",
    active: true
  },

  {
    id: "back_panel_material",
    category: "back",
    title: "Матеріал задньої стінки",
    text: "Стандартна задня стінка — ХДФ 3 мм, якщо інше не вказано в замовленні.",
    active: true
  },

  {
    id: "back_panel_gap",
    category: "back",
    title: "Зазор ХДФ",
    text: "Для задньої стінки ХДФ використовується технологічний зазор 2 мм по периметру, якщо інше не визначено конкретною конструкцією.",
    active: true
  },

  {
    id: "back_panel_type",
    category: "back",
    title: "Тип встановлення задньої стінки",
    text: "Задня стінка може бути накладною або встановленою в паз. Якщо тип не видно з креслення або не вказаний — Elvin повинен запитати.",
    active: true
  },

  {
    id: "back_panel_groove_offset",
    category: "back",
    title: "Відступ паза задньої стінки",
    text: "Якщо задня стінка встановлюється в паз, а відступ паза від заднього краю не визначений затвердженим правилом або кресленням — потрібно запитати технолога.",
    active: true
  },

  {
    id: "edge_visible",
    category: "edge",
    title: "Кромка видимих сторін",
    text: "Видимі сторони корпусних деталей кромкуються кромкою 0.8 мм KR08.",
    active: true
  },

  {
    id: "edge_technical",
    category: "edge",
    title: "Технічна задня кромка",
    text: "Технічні задні сторони корпусних деталей кромкуються паперовою кромкою 0.2 мм BUM02.",
    active: true
  },

  {
    id: "horizontal_edges",
    category: "edge",
    title: "Кромкування горизонтальних деталей",
    text: "Для стандартних горизонтальних деталей передня сторона — KR08 0.8 мм, задня технічна сторона — BUM02 0.2 мм, якщо конструкція не вимагає іншого.",
    active: true
  },

  {
    id: "facade_default",
    category: "facade",
    title: "Тип фасадів за замовчуванням",
    text: "Якщо фасади показані на кресленні без окремої примітки, вони вважаються накладними. Вкладні фасади застосовуються лише коли це явно вказано.",
    active: true
  },

  {
    id: "facade_edges",
    category: "facade",
    title: "Кромка фасадів",
    text: "Фасади з ДСП кромкуються кромкою 0.8 мм з усіх чотирьох сторін.",
    active: true
  },

  {
    id: "facade_vertical_gaps",
    category: "facade",
    title: "Верхній і нижній зазор фасадів",
    text: "Стандартний верхній зазор фасаду — 3 мм. Стандартний нижній зазор фасаду — 3 мм.",
    active: true
  },

  {
    id: "facade_side_gaps",
    category: "facade",
    title: "Бокові зазори фасадів",
    text: "Стандартний боковий зазор фасадів — 3 мм.",
    active: true
  },

  {
    id: "facade_between_gap",
    category: "facade",
    title: "Зазор між фасадами",
    text: "Стандартний зазор між сусідніми фасадами — 3 мм.",
    active: true
  },

  {
    id: "facade_floating_gap",
    category: "facade",
    title: "Плаваючий зазор фасадів",
    text: "Якщо стандартний зазор не дозволяє отримати однакові фасади цілим числом міліметрів, допускається рівномірний плаваючий зазор у межах 1.5–4.0 мм.",
    active: true
  },

  {
    id: "facade_texture",
    category: "facade",
    title: "Напрям текстури фасадів",
    text: "Стандартний напрям текстури фасадів — вертикальний, якщо інше не вказано.",
    active: true
  },

  {
    id: "plinth_unknown",
    category: "plinth",
    title: "Цоколь не показаний",
    text: "Якщо на кресленні не видно цоколя або способу опори виробу, Elvin повинен запитати конструкцію низу, а не вигадувати її.",
    active: true
  },

  {
    id: "plinth_setback",
    category: "plinth",
    title: "Відступ цоколя",
    text: "Якщо відступ цоколя від переднього краю не визначений кресленням або затвердженим правилом конкретної конструкції — потрібно запитати технолога.",
    active: true
  },

  {
    id: "support_type",
    category: "construction",
    title: "Тип опори шафи",
    text: "Якщо не визначено, чи боковини стоять на підлозі, чи корпус стоїть на ніжках або цоколі — Elvin повинен запитати.",
    active: true
  },

  {
    id: "top_type",
    category: "construction",
    title: "Конструкція кришки",
    text: "Якщо конструкція кришки не визначена кресленням або правилом конкретного типу виробу, потрібно уточнити: накладна чи вкладна.",
    active: true
  },

  {
    id: "bottom_type",
    category: "construction",
    title: "Конструкція дна",
    text: "Якщо конструкція низу не визначена, потрібно уточнити: дно на ніжках, дно на цоколі, вкладне дно або інша конструкція.",
    active: true
  },

  {
    id: "mount_scheme",
    category: "drilling",
    title: "Свердління та кріплення",
    text: "Для підтверджених з'єднань у BAZIS використовувати перевірений MountScheme(). Не замінювати його неперевіреним ручним API свердління.",
    active: true
  },

  {
    id: "panel_contact",
    category: "drilling",
    title: "Фізичний контакт деталей",
    text: "Свердління та схема кріплення можуть створюватися лише там, де деталі фізично контактують відповідно до конструкції.",
    active: true
  },

  {
    id: "no_unrequested_elements",
    category: "general",
    title: "Не додавати зайві елементи",
    text: "Не додавати фасади, ручки, шухляди, алюмінієві рамки, освітлення, розетки, стільниці або інші елементи без прямої вказівки в замовленні або підтвердження технолога.",
    active: true
  },

  {
    id: "sliding_doors",
    category: "facade",
    title: "Двері-купе",
    text: "Двері-купе та дзеркальні алюмінієві системи Elvin поки не конструює автоматично. Elvin лише фіксує їх наявність.",
    active: true
  },

  {
    id: "rule_change",
    category: "general",
    title: "Зміна виробничих правил",
    text: "Elvin не має права самостійно змінювати виробничі правила. Він може лише запропонувати зміну. Нове правило стає виробничим тільки після підтвердження.",
    active: true
  },

  {
    id: "bazis_verified_code",
    category: "general",
    title: "Перевірений код BAZIS",
    text: "Не ламати перевірені методи BAZIS. Використовувати підтверджені moveMin, SetupActiveMaterial, AddButt, TextureOrientation, окремі панелі, ХДФ 3 мм та MountScheme.",
    active: true
  }
];


// ============================================================
// TEMPORARY IN-MEMORY RULE STORAGE
// ============================================================
//
// This is intentionally temporary.
// Netlify functions may restart, so changes are NOT guaranteed
// to survive a new function instance/deploy.
//
// Next step: persistent storage.
// ============================================================

let currentRules = structuredClone(DEFAULT_RULES);


// ============================================================
// HELPERS
// ============================================================

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: JSON.stringify(body)
  };
}


function getAdminPassword() {
  return process.env.ELVIN_ADMIN_PASSWORD || "";
}


function validPassword(password) {
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return false;
  }

  return password === adminPassword;
}


function sanitizeRules(input) {
  if (!Array.isArray(input)) {
    return null;
  }

  return input
    .filter(rule => rule && typeof rule === "object")
    .map((rule, index) => ({
      id:
        typeof rule.id === "string" && rule.id.trim()
          ? rule.id.trim()
          : `rule_${Date.now()}_${index}`,

      category:
        typeof rule.category === "string"
          ? rule.category.trim()
          : "general",

      title:
        typeof rule.title === "string"
          ? rule.title.trim()
          : "",

      text:
        typeof rule.text === "string"
          ? rule.text.trim()
          : "",

      active:
        rule.active !== false
    }))
    .filter(rule => rule.title && rule.text);
}


// ============================================================
// HANDLER
// ============================================================

export async function handler(event) {

  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      error: "Method not allowed."
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, {
      ok: false,
      error: "Некоректний JSON."
    });
  }


  const action = body.action;
  const password = body.password;


  // ----------------------------------------------------------
  // PASSWORD CONFIGURATION CHECK
  // ----------------------------------------------------------

  if (!getAdminPassword()) {
    return json(500, {
      ok: false,
      error:
        "На сервері ще не встановлено ELVIN_ADMIN_PASSWORD."
    });
  }


  // ----------------------------------------------------------
  // AUTH
  // ----------------------------------------------------------

  if (!validPassword(password)) {
    return json(401, {
      ok: false,
      error: "Неправильний пароль."
    });
  }


  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  if (action === "login") {
    return json(200, {
      ok: true
    });
  }


  // ----------------------------------------------------------
  // GET RULES
  // ----------------------------------------------------------

  if (action === "get") {
    return json(200, {
      ok: true,
      version: "1.0.0",
      rules: currentRules
    });
  }


  // ----------------------------------------------------------
  // SAVE RULES
  // ----------------------------------------------------------

  if (action === "save") {

    const sanitized = sanitizeRules(body.rules);

    if (!sanitized) {
      return json(400, {
        ok: false,
        error: "Правила мають неправильний формат."
      });
    }

    currentRules = sanitized;

    return json(200, {
      ok: true,
      saved: true,
      rules: currentRules
    });
  }


  // ----------------------------------------------------------
  // RESET TO DEFAULTS
  // ----------------------------------------------------------

  if (action === "reset") {

    currentRules = structuredClone(DEFAULT_RULES);

    return json(200, {
      ok: true,
      reset: true,
      rules: currentRules
    });
  }


  return json(400, {
    ok: false,
    error: "Невідома дія."
  });
}

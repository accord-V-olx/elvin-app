// ============================================================
// HELPERS
// ============================================================

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function getAdminPassword() {
  return Netlify.env.get("ELVIN_ADMIN_PASSWORD") || "";
}

function validPassword(password) {
  const adminPassword = getAdminPassword();
  return Boolean(adminPassword) && password === adminPassword;
}

function sanitizeRules(input) {
  if (!Array.isArray(input)) return null;

  return input
    .filter((rule) => rule && typeof rule === "object")
    .map((rule, index) => ({
      id:
        typeof rule.id === "string" && rule.id.trim()
          ? rule.id.trim()
          : `rule_${Date.now()}_${index}`,

      category:
        typeof rule.category === "string" && rule.category.trim()
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

      active: rule.active !== false
    }))
    .filter((rule) => rule.title && rule.text);
}

function getRulesStore() {
  return getStore({
    name: STORE_NAME,
    consistency: "strong"
  });
}

// ============================================================
// STORAGE
// ============================================================

async function loadRules() {
  const store = getRulesStore();

  const saved = await store.get(RULES_KEY, {
    type: "json"
  });

  if (saved && Array.isArray(saved.rules)) {
    return saved.rules;
  }

  const initialRules = structuredClone(DEFAULT_RULES);

  await store.setJSON(RULES_KEY, {
    version: 1,
    updatedAt: new Date().toISOString(),
    rules: initialRules
  });

  return initialRules;
}

async function saveRules(rules) {
  const store = getRulesStore();

  const data = {
    version: 1,
    updatedAt: new Date().toISOString(),
    rules
  };

  await store.setJSON(RULES_KEY, data);

  return data;
}

async function resetRules() {
  return saveRules(structuredClone(DEFAULT_RULES));
}

// ============================================================
// MODERN NETLIFY FUNCTION
// ============================================================

export default async (req, context) => {
  if (req.method !== "POST") {
    return json(405, {
      ok: false,
      error: "Method not allowed."
    });
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return json(400, {
      ok: false,
      error: "Некоректний JSON."
    });
  }

  const action = body.action;
  const password = body.password;

  if (!getAdminPassword()) {
    return json(500, {
      ok: false,
      error: "На сервері не встановлено ELVIN_ADMIN_PASSWORD."
    });
  }

  if (!validPassword(password)) {
    return json(401, {
      ok: false,
      error: "Неправильний пароль."
    });
  }

  try {
    if (action === "login") {
      return json(200, {
        ok: true
      });
    }

    if (action === "get") {
      const rules = await loadRules();

      return json(200, {
        ok: true,
        storage: "netlify-blobs",
        version: "3.0.0",
        rules
      });
    }

    if (action === "save") {
      const sanitized = sanitizeRules(body.rules);

      if (!sanitized) {
        return json(400, {
          ok: false,
          error: "Правила мають неправильний формат."
        });
      }

      const saved = await saveRules(sanitized);

      return json(200, {
        ok: true,
        saved: true,
        storage: "netlify-blobs",
        updatedAt: saved.updatedAt,
        rules: saved.rules
      });
    }

    if (action === "reset") {
      const saved = await resetRules();

      return json(200, {
        ok: true,
        reset: true,
        storage: "netlify-blobs",
        updatedAt: saved.updatedAt,
        rules: saved.rules
      });
    }

    return json(400, {
      ok: false,
      error: "Невідома дія."
    });

  } catch (error) {
    console.error("ELVIN ADMIN RULES ERROR:", error);

    return json(500, {
      ok: false,
      error:
        "Помилка сховища правил: " +
        (error instanceof Error ? error.message : String(error))
    });
  }
};

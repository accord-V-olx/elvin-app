// ============================================================
// ELVIN WARDROBE ENGINE v1
// ============================================================
// Purpose:
// Convert CONFIRMED wardrobe analysis into deterministic
// production input.
//
// IMPORTANT:
// - AI analyzes the order.
// - Factory rules define construction.
// - Engine calculates.
// - Engine must NEVER invent missing production data.
// ============================================================

export const WARDROBE_ENGINE_VERSION = "1.0.0";

function hasValue(value) {
  return (
    value !== undefined &&
    value !== null &&
    value !== ""
  );
}

function positiveNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function addMissing(list, field, question) {
  list.push({
    field,
    question
  });
}

// ============================================================
// NORMALIZE ANALYSIS
// ============================================================

function normalizeAnalysis(analysis = {}) {
  return {
    projectName:
      analysis.projectName ??
      analysis.project_name ??
      analysis.orderName ??
      analysis.order_name ??
      null,

    width: positiveNumber(
      analysis.width ??
      analysis.overallWidth ??
      analysis.overall_width
    ),

    height: positiveNumber(
      analysis.height ??
      analysis.overallHeight ??
      analysis.overall_height
    ),

    depth: positiveNumber(
      analysis.depth ??
      analysis.overallDepth ??
      analysis.overall_depth
    ),

    material:
      analysis.material ??
      analysis.carcassMaterial ??
      analysis.carcass_material ??
     "DSP 18 mm",

   materialThickness: positiveNumber(
    analysis.materialThickness ??
    analysis.material_thickness ??
    analysis.thickness ??
    18
),

    sections:
      analysis.sections ?? null,

    backPanel:
      analysis.backPanel ??
      analysis.back_panel ??
      null,

    facades:
      analysis.facades ?? null,

    plinth:
      analysis.plinth ?? null,

    notes:
      analysis.notes ??
      analysis.note ??
      null,

    source: analysis
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateRequiredData(data) {
  const missing = [];

  if (!hasValue(data.projectName)) {
    addMissing(
      missing,
      "projectName",
      "Вкажіть точну назву замовлення так, як вона написана на документі."
    );
  }

  if (!data.width) {
    addMissing(
      missing,
      "width",
      "Яка точна загальна ширина виробу?"
    );
  }

  if (!data.height) {
    addMissing(
      missing,
      "height",
      "Яка точна загальна висота виробу?"
    );
  }

  if (!data.depth) {
    addMissing(
      missing,
      "depth",
      "Яка точна загальна глибина виробу?"
    );
  }

 

  if (!hasValue(data.sections)) {
    addMissing(
      missing,
      "sections",
      "Не визначена конструкція або розміри секцій."
    );
  }

  return missing;
}

// ============================================================
// ENGINE
// ============================================================

export function buildWardrobe(confirmedAnalysis = {}) {
  const data = normalizeAnalysis(confirmedAnalysis);

  const missing = validateRequiredData(data);

  if (missing.length > 0) {
    return {
      ok: false,
      status: "ASK",
      engineVersion: WARDROBE_ENGINE_VERSION,

      message:
        "Недостатньо підтверджених даних для точного розрахунку шафи.",

      missing,

      project: data
    };
  }

  return {
    ok: true,
    status: "READY",
    engineVersion: WARDROBE_ENGINE_VERSION,

    message:
      "Підтверджених даних достатньо для переходу до розрахунку конструкції.",

    project: data,

    // Parts calculation will be added only from
    // confirmed factory construction rules.
    parts: [],

    // Machining/drilling will be added separately
    // from confirmed BAZIS rules.
    machining: [],

    // BAZIS generation is the next layer.
    bazis: null
  };
}

// ============================================================
// SAFE WRAPPER
// ============================================================

export function runWardrobeEngine(confirmedAnalysis) {
  try {
    return buildWardrobe(confirmedAnalysis);
  } catch (error) {
    return {
      ok: false,
      status: "ERROR",
      engineVersion: WARDROBE_ENGINE_VERSION,
      message: "Помилка Wardrobe Engine.",
      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

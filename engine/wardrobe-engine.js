// ============================================================
// ELVIN WARDROBE ENGINE v1.3.0
// ============================================================
// Purpose:
// Convert CONFIRMED wardrobe analysis into deterministic
// production input.
//
// IMPORTANT:
// - AI analyzes the order.
// - Factory rules define construction.
// - Engine validates and calculates.
// - Engine must NEVER invent missing production data.
// - Factory defaults must come from active Elvin rules,
//   not be hardcoded inside the Engine.
// - Engine output must always be JSON-safe.
// ============================================================

export const WARDROBE_ENGINE_VERSION = "1.4.0";

// ============================================================
// HELPERS
// ============================================================

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
  const project =
    analysis &&
    typeof analysis.project === "object" &&
    analysis.project !== null
      ? analysis.project
      : {};

  return {
    // --------------------------------------------------------
    // PROJECT NAME
    //
    // Exact name from the order/drawing.
    // Never invent a name.
    // --------------------------------------------------------

    projectName:
      analysis.projectName ??
      analysis.project_name ??
      analysis.orderName ??
      analysis.order_name ??
      project.name ??
      null,

    // --------------------------------------------------------
    // OVERALL DIMENSIONS
    //
    // Must come from confirmed analysis.
    // Never calculate overall dimensions from an
    // unconfirmed chain of dimensions.
    // --------------------------------------------------------

    width: positiveNumber(
      analysis.width ??
      analysis.overallWidth ??
      analysis.overall_width ??
      project.width_mm
    ),

    height: positiveNumber(
      analysis.height ??
      analysis.overallHeight ??
      analysis.overall_height ??
      project.height_mm
    ),

    depth: positiveNumber(
      analysis.depth ??
      analysis.overallDepth ??
      analysis.overall_depth ??
      project.depth_mm
    ),

    // --------------------------------------------------------
    // MATERIAL
    //
    // IMPORTANT:
    // No factory default is hardcoded here.
    //
    // Example:
    // "DSP 18 mm" may be a factory rule,
    // but that rule must come from Elvin Rules / AI analysis.
    //
    // Engine only accepts confirmed production data.
    // --------------------------------------------------------

    material:
      analysis.material ??
      analysis.carcassMaterial ??
      analysis.carcass_material ??
      project.material ??
      null,

    materialThickness: positiveNumber(
      analysis.materialThickness ??
      analysis.material_thickness ??
      analysis.thickness ??
      project.materialThickness ??
      project.material_thickness ??
      project.material_thickness_mm
    ),

    // --------------------------------------------------------
    // SECTIONS / INTERNAL CONSTRUCTION
    // --------------------------------------------------------

    sections:
      analysis.sections ??
      analysis.sections_description ??
      project.sections ??
      project.sections_description ??
      null,

    // --------------------------------------------------------
    // BACK PANEL
    // --------------------------------------------------------

    backPanel:
      analysis.backPanel ??
      analysis.back_panel ??
      project.backPanel ??
      project.back_panel ??
      null,

    // --------------------------------------------------------
    // FACADES
    // --------------------------------------------------------

    facades:
      analysis.facades ??
      project.facades ??
      null,

    // --------------------------------------------------------
    // PLINTH
    // --------------------------------------------------------

    plinth:
      analysis.plinth ??
      project.plinth ??
      null,

    construction:
      analysis.construction ??
      project.construction ??
      null,

    // --------------------------------------------------------
    // NOTES
    // --------------------------------------------------------

    notes:
      analysis.notes ??
      analysis.note ??
      project.notes ??
      null,

    // --------------------------------------------------------
    // FURNITURE TYPE
    // --------------------------------------------------------

    furnitureType:
      analysis.furnitureType ??
      analysis.furniture_type ??
      project.furniture_type ??
      null
  };
}

// ============================================================
// VALIDATION
// ============================================================

function validateRequiredData(data) {
  const missing = [];

  // --------------------------------------------------------
  // PROJECT NAME
  // --------------------------------------------------------

  if (!hasValue(data.projectName)) {
    addMissing(
      missing,
      "projectName",
      "Вкажіть точну назву замовлення так, як вона написана на документі."
    );
  }

  // --------------------------------------------------------
  // OVERALL DIMENSIONS
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // MATERIAL
  //
  // Material must already be confirmed by analysis/rules.
  // Engine does not invent a default.
  // --------------------------------------------------------

  if (!hasValue(data.material)) {
    addMissing(
      missing,
      "material",
      "Не визначений матеріал корпусу."
    );
  }

  if (!data.materialThickness) {
    addMissing(
      missing,
      "materialThickness",
      "Не визначена товщина матеріалу корпусу."
    );
  }

  // --------------------------------------------------------
  // SECTIONS
  //
  // Must come from drawing / confirmed analysis.
  // --------------------------------------------------------

  if (!hasValue(data.sections)) {
    addMissing(
      missing,
      "sections",
      "Не визначена конструкція або розміри секцій."
    );
  }

  if (!data.construction || typeof data.construction !== "object") {
    addMissing(missing, "construction", "Не визначені структуровані параметри конструкції.");
  } else {
    const c = data.construction;
    const requiredConstruction = [
      ["top_type", "Не визначена конструкція верху."],
      ["bottom_type", "Не визначена конструкція дна."],
      ["support_type", "Не визначений тип опори."],
      ["back_panel_type", "Не визначений спосіб встановлення задньої стінки."],
      ["facade_type", "Не визначений тип фасадів."],
      ["side_panels", "Не визначена схема боковин."]
    ];
    for (const [field, question] of requiredConstruction) {
      if (!hasValue(c[field])) addMissing(missing, `construction.${field}`, question);
    }
    if (
      typeof c.back_panel_type === "string" &&
      c.back_panel_type.toLowerCase().includes("паз") &&
      !hasValue(c.back_groove_offset_mm)
    ) {
      addMissing(missing, "construction.back_groove_offset_mm", "Для ХДФ у паз не визначений відступ паза.");
    }
  }

  return missing;
}

function buildParts(data) {
  const t = data.materialThickness;
  const c = data.construction || {};
  const parts = [];

  // Geometry is emitted only when the Engine has exact dimensions.
  // Edging is intentionally NOT hardcoded here: it must come from active rules.
  if (c.side_panels === "full_height" && data.height && data.depth) {
    parts.push(
      { id: "side_left", name: "ST_L", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: data.height,
        x_mm: 0, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null },
      { id: "side_right", name: "ST_R", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: data.height,
        x_mm: data.width - t, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null }
    );
  }

  return parts;
}

function buildMachining(parts) {
  // MountScheme is emitted only after exact physical contacts are known.
  return [];
}

function safeBazisName(value) {
  return String(value || "").replace(/[\\"]/g, "_");
}

function generateBazisScript(data, parts) {
  if (!parts.length) return null;

  const lines = [
    "// ELVIN -> BAZIS 10",
    "// Project: " + safeBazisName(data.projectName),
    "// Generated only from confirmed Wardrobe Engine geometry.",
    "",
    "function moveMin(obj, x, y, z) {",
    "  obj.Build();",
    "  let g = obj.GabMin;",
    "  obj.Translate(x - g.x, y - g.y, z - g.z);",
    "  obj.Build();",
    "}",
    ""
  ];

  for (const part of parts) {
    const v = "P_" + String(part.id).replace(/[^a-zA-Z0-9_]/g, "_");
    // For now the verified NewPanel API is used only for vertical Y-Z side panels.
    if (part.type !== "side") continue;
    lines.push(
      "let " + v + " = objects3d.NewPanel(" + part.size_y_mm + ", " + part.size_z_mm + ", objects3d.PanelOrientation.vertical);",
      v + ".Name = \"" + safeBazisName(part.name || part.id) + " " + part.size_y_mm + "x" + part.size_z_mm + "\";",
      "moveMin(" + v + ", " + part.x_mm + ", " + part.y_mm + ", " + part.z_mm + ");",
      ""
    );
  }

  lines.push("// Edging and MountScheme are added only when their exact rule/contact data is confirmed.");
  return lines.join("\n");
}

function buildBazisPlan(data, parts, machining) {
  const script = generateBazisScript(data, parts);
  return {
    status: script ? "PREVIEW_CODE_READY" : "WAITING_FOR_PART_GEOMETRY",
    projectName: data.projectName,
    verifiedMethods: ["objects3d.NewPanel", "moveMin", "SetupActiveMaterial", "AddButt", "TextureOrientation", "MountScheme"],
    parts,
    machining,
    script,
    productionReady: false,
    note: script
      ? "Код геометрії доступний для перевірки. Виробничі кромки/кріплення додаються тільки з підтверджених правил."
      : "Немає достатньої підтвердженої геометрії для коду."
  };
}

// ============================================================
// ENGINE
// ============================================================

export function buildWardrobe(confirmedAnalysis = {}) {
  const data = normalizeAnalysis(confirmedAnalysis);

  const missing = validateRequiredData(data);

  // --------------------------------------------------------
  // STOP -> ASK
  //
  // If critical production data is missing,
  // Engine must stop instead of guessing.
  // --------------------------------------------------------

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

  // --------------------------------------------------------
  // READY
  //
  // At this point the minimum confirmed input exists.
  // Construction calculation will be added separately.
  // --------------------------------------------------------

  const parts = buildParts(data);
  const machining = buildMachining(parts);
  const bazis = buildBazisPlan(data, parts, machining);

  return {
    ok: true,
    status: "READY",
    engineVersion: WARDROBE_ENGINE_VERSION,

    message:
      "Підтверджених даних достатньо для переходу до розрахунку конструкції.",

    project: data,

    // ------------------------------------------------------
    // PARTS
    //
    // Parts calculation will be added only from
    // confirmed factory construction rules.
    // ------------------------------------------------------

    parts,

    // ------------------------------------------------------
    // MACHINING
    //
    // Drilling/mounting will be added separately
    // from confirmed BAZIS rules.
    // ------------------------------------------------------

    machining,

    // ------------------------------------------------------
    // BAZIS
    //
    // BAZIS generation is the next layer.
    // ------------------------------------------------------

    bazis
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

      message:
        "Помилка Wardrobe Engine.",

      error:
        error instanceof Error
          ? error.message
          : String(error)
    };
  }
}

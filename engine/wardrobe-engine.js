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

export const WARDROBE_ENGINE_VERSION = "1.5.3-geometry-guard";

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
    const backAbsent = /^(немає|відсутня|без|none|no|absent)$/i.test(String(data.backPanel||"").trim()) || /^(none|no_back|absent)$/i.test(String(c.back_panel_type||"").trim());
    const facadesAbsent = /^(немає|відсутні|без|none|no|absent)$/i.test(String(data.facades||"").trim()) || /^(none|no_facades|absent)$/i.test(String(c.facade_type||"").trim());
    const requiredConstruction = [
      ["top_type", "Не визначена конструкція верху."],
      ["bottom_type", "Не визначена конструкція дна."],
      ["support_type", "Не визначений тип опори."],
      ["side_panels", "Не визначена схема боковин."]
    ];
    if (!backAbsent) requiredConstruction.push(["back_panel_type","Не визначений спосіб встановлення задньої стінки."]);
    if (!facadesAbsent) requiredConstruction.push(["facade_type","Не визначений тип фасадів."]);
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
  if (["full_height","to_floor","підлога","на всю висоту"].includes(String(c.side_panels||"").toLowerCase()) && data.height && data.depth) {
    parts.push(
      { id: "side_left", name: "ST_L", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: data.height,
        x_mm: 0, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null },
      { id: "side_right", name: "ST_R", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: data.height,
        x_mm: data.width - t, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null }
    );
  }

  // Only build panels whose geometry follows explicitly confirmed construction.
  // Unsupported constructions remain unresolved; never pretend a partial model is complete.
  const fullHeight = ["full_height","to_floor","підлога","на всю висоту"].includes(String(c.side_panels||"").toLowerCase());
  const insetTop = ["inset","inset_between_sides","вкладна","вкладний"].includes(String(c.top_type||"").toLowerCase());
  const insetBottom = ["inset","inset_between_sides","вкладне","вкладний"].includes(String(c.bottom_type||"").toLowerCase());
  if (fullHeight && insetTop && data.width>2*t && data.height>t) {
    parts.push({id:"top",name:"VERH",type:"horizontal",qty:1,size_x_mm:data.width-2*t,size_y_mm:data.depth,size_z_mm:t,
      x_mm:t,y_mm:0,z_mm:data.height-t,thickness_mm:t,material:data.material,edges:null});
  }
  if (fullHeight && insetBottom && data.width>2*t && Number.isFinite(Number(c.plinth_height_mm)) &&
      Number(c.plinth_height_mm)>=0 && Number(c.plinth_height_mm)+t<data.height) {
    parts.push({id:"bottom",name:"DNO",type:"horizontal",qty:1,size_x_mm:data.width-2*t,size_y_mm:data.depth,size_z_mm:t,
      x_mm:t,y_mm:0,z_mm:Number(c.plinth_height_mm),thickness_mm:t,material:data.material,edges:null});
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
    // Geometry preview only. Other orientations require BAZIS verification.
    if (part.type !== "side" && part.type !== "horizontal") continue;
    lines.push(
      "let " + v + " = objects3d.NewPanel(" + (part.type === "horizontal" ? part.size_x_mm : part.size_y_mm) + ", " + (part.type === "horizontal" ? part.size_y_mm : part.size_z_mm) + ", objects3d.PanelOrientation." + (part.type === "horizontal" ? "horizont" : "vertical") + ");",
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
  if (!parts.length) {
    return { ok: false, status: "ASK", engineVersion: WARDROBE_ENGINE_VERSION,
      message: "Конструкція підтверджена частково, але схема панелей ще не підтримується.",
      missing: [{field:"construction.side_panels",question:"Боковини шафи йдуть на всю висоту від низу до верху чи стоять на дні?"}], project:data };
  }
  // Never mark a partial carcass as READY. A 3D preview may be useful,
  // but a missing bottom/top or unmodelled sections cannot become BAZIS-ready.
  const requiredPartIds = ["side_left", "side_right", "bottom", "top"];
  const absentParts = requiredPartIds.filter(id => !parts.some(p => p.id === id));
  const sectionsStructured = Array.isArray(data.sections) && data.sections.length > 0 &&
    data.sections.every(section => section && typeof section === "object" &&
      positiveNumber(section.width_mm) && positiveNumber(section.depth_mm));
  const geometryMissing = [
    ...absentParts.map(id => ({field:"geometry."+id, question:"Не побудована обов'язкова деталь корпусу: "+id+"."})),
    ...(!sectionsStructured ? [{field:"sections",question:"Для точної 3D-моделі потрібні структуровані секції з шириною та глибиною."}] : []),
    {field:"geometry.internal_parts",question:"Розміщення внутрішніх полиць і перегородок ще не розраховується цим Engine."}
  ];
  if (geometryMissing.length) {
    return {
      ok: false, status: "GEOMETRY_INCOMPLETE", engineVersion: WARDROBE_ENGINE_VERSION,
      message: "Геометрія часткова: не можна позначати замовлення готовим до BAZIS.",
      missing: geometryMissing, project: data, parts,
      machining: [], bazis: {status:"BLOCKED_INCOMPLETE_GEOMETRY",script:null,productionReady:false}
    };
  }
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


/**
 * Isolated demonstration fixture, never a production order.
 * Explicit assumptions: 18 mm DSP, 80 mm plinth, 20 mm setback,
 * overlay HDF 3 mm, inset top/bottom, five equally spaced shelves.
 */
export function buildTestPenal() {
  const W=400,H=1500,D=350,T=18,plinthH=80,backT=3;
  const parts=[];
  const add=(id,name,type,x,y,z,dx,dy,dz,material="ДСП 18 мм")=>
    parts.push({id,name,type,qty:1,x_mm:x,y_mm:y,z_mm:z,
      size_x_mm:dx,size_y_mm:dy,size_z_mm:dz,thickness_mm:type==="back"?backT:T,
      material,edges:null});
  add("side_left","ST_L","side",0,0,0,T,D,H);
  add("side_right","ST_R","side",W-T,0,0,T,D,H);
  add("bottom","DNO","horizontal",T,0,plinthH,W-2*T,D,T);
  add("top","VERH","horizontal",T,0,H-T,W-2*T,D,T);
  const lower=plinthH+T,upper=H-T;
  for(let i=1;i<=5;i++){
    const z=lower+(upper-lower)*i/6-T/2;
    add("shelf_"+i,"POLKA_"+i,"horizontal",T,0,Math.round(z*100)/100,W-2*T,D-10,T);
  }
  add("plinth","COKOL","front",T,20,0,W-2*T,T,plinthH);
  add("back","HDF","back",2,D,2,W-4,backT,H-4,"ХДФ 3 мм");
  const project={projectName:"TEST-PENAL-400x1500x350",width:W,height:H,depth:D,
    material:"ДСП 18 мм",materialThickness:T};
  const machining=[];
  return {ok:true,status:"DEMO_ONLY",engineVersion:WARDROBE_ENGINE_VERSION,
    message:"Демонстраційна геометрія з припущеннями. Не для виробництва.",
    project,parts,machining,bazis:buildBazisPlan(project,parts,machining),
    assumptions:["Верх і дно вкладні","5 полиць розташовані рівномірно",
      "Цоколь 80 мм, відступ 20 мм","ХДФ 3 мм накладна, зазор 2 мм",
      "Кромкування та кріплення не розраховані"]};
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

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

import { validateGeometry, thicknessAxis, checkSheetLimits } from "./geometry.js";
import { WARDROBE_RULES } from "../rules/wardrobe-rules.js";
import { buildInterior } from "./interior-layout.js";
import { toBazisPlacement } from "./bazis-axes.js";
import { interiorFromAI } from "./interior-from-ai.js";
import { buildFacades } from "./facades.js";
import { applyEdging } from "./edging.js";
import { computeMounts } from "./mounting.js";
import { buildFillers } from "./fillers.js";

export const WARDROBE_ENGINE_VERSION = "1.8.1-fillers-200";

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

function isBackAbsent(data) {
  const c = data.construction || {};
  return /^(немає|відсутня|без|none|no|absent)$/i.test(String(data.backPanel||"").trim()) || /^(none|no_back|absent)$/i.test(String(c.back_panel_type||"").trim());
}

function isFacadesAbsent(data) {
  const c = data.construction || {};
  return /^(немає|відсутні|без|none|no|absent)$/i.test(String(data.facades||"").trim()) || /^(none|no_facades|absent)$/i.test(String(c.facade_type||"").trim());
}

// Factory rule depth.overallDepthIncludesFacade: when the drawing gives the
// depth WITH the facade, carcass depth = overall - facade thickness - clearance.
// Facades are made from the carcass material (same thickness as in buildFacades).
function applyFacadeDepth(data) {
  const c = data.construction || {};
  const rule = WARDROBE_RULES.depth?.overallDepthIncludesFacade;
  if (c.depth_includes_facade !== true || !rule || !data.depth) return [];
  if (isFacadesAbsent(data)) return ["Глибина вказана з фасадом, але фасадів немає: глибина корпусу = " + data.depth + " мм."];
  const t = data.materialThickness, gap = rule.adjustmentClearanceMm ?? 2;
  if (!t) return [];
  const overall = data.depth;
  data.overallDepth = overall;
  data.depth = overall - t - gap;
  return ["Глибина " + overall + " мм з фасадом: корпус " + overall + " − " + t + " − " + gap + " = " + data.depth + " мм (правило фабрики)."];
}

export function fillerOpts(data) {
  return { thickness_mm: data.materialThickness, material: data.material,
    stockWidth: WARDROBE_RULES.fillers?.stockWidthMm,
    edge: WARDROBE_RULES.facades?.edging?.code || WARDROBE_RULES.edging?.visible?.code || "KR08" };
}

function addMissing(list, field, question) {
  list.push({
    field,
    question
  });
}

// AI interior format (sections/openings) -> Engine split tree.
function normalizeConstruction(c) {
  if (!c || typeof c !== "object" || c.interior === undefined || c.interior === null) return c;
  const interior = interiorFromAI(c.interior);
  const { interior: _ai, ...rest } = c;
  return interior === undefined ? rest : { ...rest, interior };
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

    construction: normalizeConstruction(
      analysis.construction ??
      project.construction ??
      null),

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

  // A confirmed construction.interior tree replaces the free-text sections.
  if (!hasValue(data.sections) && !data.construction?.interior) {
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
    const backAbsent = isBackAbsent(data);
    const facadesAbsent = isFacadesAbsent(data);
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
      /паз|groove/i.test(c.back_panel_type) &&
      !hasValue(c.back_groove_offset_mm) &&
      !Number.isFinite(WARDROBE_RULES.backPanel?.paz?.rearOffsetMm)
    ) {
      addMissing(missing, "construction.back_groove_offset_mm", "Для ХДФ у паз не визначений відступ паза.");
    }
  }

  return missing;
}

// The factory uses only DSP 18 mm (rules). Another thickness is not
// blocked, but the technologist must see it.
function materialWarnings(data) {
  const allowed = WARDROBE_RULES.materials?.carcass?.allowedKnownThicknessesMm || [];
  return allowed.length && data.materialThickness && !allowed.includes(data.materialThickness)
    ? ["Товщина ДСП " + data.materialThickness + " мм: фабрика використовує лише ДСП " + allowed.join(", ") + " мм. Перевірте креслення."]
    : [];
}

// HDF in a groove: inner panels stop in front of it (factory standard:
// 14 mm from the back + 4 mm groove width = 18 mm).
function grooveSetback(data) {
  const c = data.construction || {};
  if (typeof c.back_panel_type !== "string" || !/паз|groove/i.test(c.back_panel_type)) return 0;
  const paz = WARDROBE_RULES.backPanel?.paz || {};
  const offset = positiveNumber(c.back_groove_offset_mm) ?? paz.rearOffsetMm;
  const width = paz.grooveWidthMm;
  return Number.isFinite(offset) && Number.isFinite(width) ? offset + width : 0;
}

// HDF in the groove (factory standard): groove in both sides and the
// bottom, the sheet slides in from the top behind an inset top.
// Width = opening + 2 x (groove depth - 1); bottom edge 8 mm into the
// bottom groove; top edge 1 mm below the carcass top.
function buildGrooveBack(data, parts) {
  const paz = WARDROBE_RULES.backPanel?.paz || {};
  const byId = Object.fromEntries(parts.map(p => [p.id, p]));
  const { side_left: l, side_right: r, bottom: b, top } = byId;
  if (!l || !r || !b || !top || !(top.size_x_mm < data.width)) return null; // only with an inset top
  const into = paz.grooveDepthMm - 1;
  const back = Math.min(l.y_mm + l.size_y_mm, r.y_mm + r.size_y_mm);
  const x0 = l.x_mm + l.size_x_mm - into;
  const z0 = b.z_mm + b.size_z_mm - into;
  const z1 = top.z_mm + top.size_z_mm - 1;
  return {
    id: "back", name: "TYL", type: "back", role: "back", qty: 1,
    x_mm: x0, y_mm: back - grooveSetback(data), z_mm: z0,
    size_x_mm: (r.x_mm + into) - x0, size_y_mm: paz.panelThicknessMm, size_z_mm: z1 - z0,
    thickness_mm: paz.panelThicknessMm, material: "ХДФ", edges: null,
    fits_into: ["side_left", "side_right", "bottom"]
  };
}

// DSP plinth (COKOL) at the front, factory standard: height from the order
// (standard 100), recess 20 mm from the carcass front. Between the sides
// when they stand on the floor, full width when the carcass stands on it.
function buildPlinth(data, parts) {
  const c = data.construction || {};
  if (!/^(plinth|цоколь)$/i.test(String(c.support_type || "")) || /plastic|пласт/i.test(String(c.plinth_type || ""))) return null;
  const h = positiveNumber(c.plinth_height_mm);
  const byId = Object.fromEntries(parts.map(p => [p.id, p]));
  const { side_left: l, side_right: r } = byId;
  if (!h || !l || !r) return null;
  const std = WARDROBE_RULES.plinth?.standard || {};
  const recess = Number.isFinite(Number(c.plinth_setback_mm)) && c.plinth_setback_mm !== null ? Number(c.plinth_setback_mm) : std.frontRecessMm;
  if (!Number.isFinite(recess)) return null;
  const t = data.materialThickness;
  const toFloor = l.z_mm < h - GEOMETRY_EPS;
  const x0 = toFloor ? l.x_mm + l.size_x_mm : 0;
  const x1 = toFloor ? r.x_mm : data.width;
  return { id: "plinth", name: "COKOL", type: "front", role: "plinth", qty: 1,
    x_mm: x0, y_mm: l.y_mm + recess, z_mm: 0, size_x_mm: x1 - x0, size_y_mm: t, size_z_mm: h,
    thickness_mm: t, material: data.material, edges: null };
}
const GEOMETRY_EPS = 0.01;

const isBackType = (data, re) => typeof data.construction?.back_panel_type === "string" && re.test(data.construction.back_panel_type);

// Overlay HDF nailed to the back (factory standard): one sheet per module,
// 2 mm smaller than the carcass (bottom panel .. top panel) on every side.
function buildOverlayBack(data, parts) {
  const rule = WARDROBE_RULES.backPanel?.hdfOverlay || {};
  const off = rule.edgeOffsetsMm;
  const byId = Object.fromEntries(parts.map(p => [p.id, p]));
  const { side_left: l, bottom: b, top } = byId;
  if (!off || !l || !b || !top) return null;
  const back = l.y_mm + l.size_y_mm;
  const z0 = b.z_mm + off.bottom;
  const z1 = top.z_mm + top.size_z_mm - off.top;
  const sheet = (id, x0, x1) => ({ id, name: "TYL", type: "back", role: "back", qty: 1,
    x_mm: x0, y_mm: back, z_mm: z0, size_x_mm: x1 - x0, size_y_mm: rule.thicknessMm,
    size_z_mm: z1 - z0, thickness_mm: rule.thicknessMm, material: "ХДФ", edges: null, outside_envelope_allowed: true });
  const single = sheet("back", off.left, data.width - off.left);
  // Too big for one sheet -> one sheet per section (confirmed 2026-10-18,
  // as in the factory reference script): each sheet = clear section width.
  const max = rule.maxSheetMm;
  const fits = p => !max || (Math.max(p.size_x_mm, p.size_z_mm) <= Math.max(max.length, max.width) + GEOMETRY_EPS &&
    Math.min(p.size_x_mm, p.size_z_mm) <= Math.min(max.length, max.width) + GEOMETRY_EPS);
  if (fits(single)) return [single];
  const r = byId.side_right;
  const innerH = top.z_mm - (b.z_mm + b.size_z_mm);
  const walls = parts.filter(p => p.role === "partition" && Math.abs(p.size_z_mm - innerH) <= GEOMETRY_EPS)
    .sort((a, c) => a.x_mm - c.x_mm);
  if (!r || !walls.length) return [single];
  const edges = [l.x_mm + l.size_x_mm, ...walls.flatMap(w => [w.x_mm, w.x_mm + w.size_x_mm]), r.x_mm];
  const sheets = [];
  for (let i = 0; i < edges.length; i += 2) sheets.push(sheet("back_" + (i / 2 + 1), edges[i], edges[i + 1]));
  return sheets;
}

// DSP back inside the carcass (open sections): on the bottom, between the
// sides, under the top, at the rear.
function buildDspBack(data, parts) {
  const rule = WARDROBE_RULES.backPanel?.dspBack || {};
  const byId = Object.fromEntries(parts.map(p => [p.id, p]));
  const { side_left: l, side_right: r, bottom: b, top } = byId;
  if (!rule.thicknessMm || !l || !r || !b || !top) return null;
  const back = Math.min(l.y_mm + l.size_y_mm, r.y_mm + r.size_y_mm);
  const t = rule.thicknessMm;
  return { id: "back", name: "ST_TYL", type: "back", role: "back", qty: 1,
    x_mm: l.x_mm + l.size_x_mm, y_mm: back - t, z_mm: b.z_mm + b.size_z_mm,
    size_x_mm: r.x_mm - (l.x_mm + l.size_x_mm), size_y_mm: t, size_z_mm: top.z_mm - (b.z_mm + b.size_z_mm),
    thickness_mm: t, material: data.material, edges: null };
}
const dspBackSetback = data => {
  const rule = WARDROBE_RULES.backPanel?.dspBack || {};
  return isBackType(data, /^(dsp|дсп)/i) && rule.thicknessMm ? rule.thicknessMm + (rule.shelfClearanceMm || 0) : 0;
};

function topFrontOverhang(data) {
  const rule = WARDROBE_RULES.carcassConstruction?.overlayTopOverhang;
  const c = data.construction || {};
  if (!rule || !["overlay","накладна","накладний"].includes(String(c.top_type||"").toLowerCase())) return 0;
  const type = String(data.furnitureType || "");
  const kind = /комод|chest/i.test(type) ? "CHEST" : /тумб|tumba/i.test(type) ? "TUMBA" : null;
  return kind && rule.appliesTo.includes(kind) ? rule.frontOverhangMm : 0;
}

function buildParts(data) {
  const t = data.materialThickness;
  const c = data.construction || {};
  const parts = [];

  // Geometry is emitted only when the Engine has exact dimensions.
  // Edging is intentionally NOT hardcoded here: it must come from active rules.
  // Full-height sides end under an overlay top, or at the top edge otherwise.
  const topOverSides = ["overlay","накладна","накладний"].includes(String(c.top_type||"").toLowerCase());
  const fullSideH = data.height - (topOverSides ? t : 0);
  if (["full_height","to_floor","підлога","на всю висоту"].includes(String(c.side_panels||"").toLowerCase()) && data.height && data.depth) {
    parts.push(
      { id: "side_left", name: "ST_L", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: fullSideH,
        x_mm: 0, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null },
      { id: "side_right", name: "ST_R", type: "side", qty: 1, size_x_mm: t, size_y_mm: data.depth, size_z_mm: fullSideH,
        x_mm: data.width - t, y_mm: 0, z_mm: 0, thickness_mm: t, material: data.material, edges: null }
    );
  }

  // Only build panels whose geometry follows explicitly confirmed construction.
  // Unsupported constructions remain unresolved; never pretend a partial model is complete.
  const fullHeight = ["full_height","to_floor","підлога","на всю висоту"].includes(String(c.side_panels||"").toLowerCase());
  const insetTop = ["inset","inset_between_sides","вкладна","вкладний"].includes(String(c.top_type||"").toLowerCase());
  const insetBottom = ["inset","inset_between_sides","вкладне","вкладний"].includes(String(c.bottom_type||"").toLowerCase());
  if (fullHeight && topOverSides && data.height>t) {
    parts.push({id:"top",name:"KR",type:"horizontal",qty:1,size_x_mm:data.width,size_y_mm:data.depth,size_z_mm:t,
      x_mm:0,y_mm:0,z_mm:data.height-t,thickness_mm:t,material:data.material,edges:null});
  }
  if (fullHeight && insetTop && data.width>2*t && data.height>t) {
    parts.push({id:"top",name:"KR",type:"horizontal",qty:1,size_x_mm:data.width-2*t,size_y_mm:data.depth,size_z_mm:t,
      x_mm:t,y_mm:0,z_mm:data.height-t,thickness_mm:t,material:data.material,edges:null});
  }
  if (fullHeight && insetBottom && data.width>2*t && Number.isFinite(Number(c.plinth_height_mm)) &&
      Number(c.plinth_height_mm)>=0 && Number(c.plinth_height_mm)+t<data.height) {
    parts.push({id:"bottom",name:"DNO",type:"horizontal",qty:1,size_x_mm:data.width-2*t,size_y_mm:data.depth,size_z_mm:t,
      x_mm:t,y_mm:0,z_mm:Number(c.plinth_height_mm),thickness_mm:t,material:data.material,edges:null});
  }
  // Bottom-supported carcass: sides stand ON the full-width bottom.
  // Coordinates: X width, Y depth, Z height. Support height is explicit.
  const bottomSupported = ["on_bottom","standing_on_bottom","на дні","стоять на дні"].includes(String(c.side_panels||"").toLowerCase());
  const bottomFull = ["full_width","full","суцільне","на всю ширину"].includes(String(c.bottom_type||"").toLowerCase());
  const supportH = Number(c.plinth_height_mm);
  // Top over the sides (overlay): sides stand between the full bottom and the full top.
  const overlayTop = ["overlay","накладна","накладний"].includes(String(c.top_type||"").toLowerCase());
  if (bottomSupported && bottomFull && (insetTop || overlayTop) && Number.isFinite(supportH) && supportH >= 0 &&
      data.width > 2*t && data.height > supportH + 2*t) {
    const sideH = data.height - supportH - t - (overlayTop ? t : 0);
    parts.push(
      {id:"bottom",name:"DNO",type:"horizontal",qty:1,size_x_mm:data.width,size_y_mm:data.depth,size_z_mm:t,
        x_mm:0,y_mm:0,z_mm:supportH,thickness_mm:t,material:data.material,edges:null},
      {id:"side_left",name:"ST_L",type:"side",qty:1,size_x_mm:t,size_y_mm:data.depth,size_z_mm:sideH,
        x_mm:0,y_mm:0,z_mm:supportH+t,thickness_mm:t,material:data.material,edges:null},
      {id:"side_right",name:"ST_R",type:"side",qty:1,size_x_mm:t,size_y_mm:data.depth,size_z_mm:sideH,
        x_mm:data.width-t,y_mm:0,z_mm:supportH+t,thickness_mm:t,material:data.material,edges:null},
      overlayTop
        ? {id:"top",name:"KR",type:"horizontal",qty:1,size_x_mm:data.width,size_y_mm:data.depth,size_z_mm:t,
            x_mm:0,y_mm:0,z_mm:data.height-t,thickness_mm:t,material:data.material,edges:null}
        : {id:"top",name:"KR",type:"horizontal",qty:1,size_x_mm:data.width-2*t,size_y_mm:data.depth,size_z_mm:t,
            x_mm:t,y_mm:0,z_mm:data.height-t,thickness_mm:t,material:data.material,edges:null}
    );
  }
  // Inset top in front of the HDF groove: shallower by the groove setback.
  const setback = grooveSetback(data);
  const insetTopPart = parts.find(p => p.id === "top" && insetTop);
  if (setback > 0 && insetTopPart && setback < insetTopPart.size_y_mm) insetTopPart.size_y_mm -= setback;

  // Chest / tumba with an overlay top: the top overhangs the carcass at the
  // front (factory rule). Overall depth = top depth; the carcass moves back.
  const overhang = topFrontOverhang(data);
  if (overhang > 0 && overhang < data.depth) {
    for (const p of parts) {
      if (p.id === "top") continue;
      p.y_mm += overhang;
      p.size_y_mm -= overhang;
    }
  }
  // Internal panels must be specified by confirmed coordinates, not guessed
  // from a sketch or evenly distributed. X=width, Y=depth, Z=height.
  // Supported: horizontal shelf and vertical partition parallel to depth.
  for (const p of (Array.isArray(c.internal_panels) ? c.internal_panels : [])) {
    if (!p || !["shelf","partition"].includes(p.type)) continue;
    const x=Number(p.x_mm), y=Number(p.y_mm), z=Number(p.z_mm);
    const w=Number(p.width_mm), d=Number(p.depth_mm), h=Number(p.height_mm);
    const valid=[x,y,z,w,d,h].every(Number.isFinite) &&
      x>=0 && y>=0 && z>=0 && w>0 && d>0 && h>0 &&
      x+w<=data.width && y+d<=data.depth && z+h<=data.height &&
      (p.type==="shelf" ? h===t : w===t);
    if (!valid) continue;
    parts.push({id:"internal_"+String(p.id),name:String(p.name||p.id),
      type:p.type==="shelf"?"horizontal":"partition",role:p.type,qty:1,
      x_mm:x,y_mm:y,z_mm:z,size_x_mm:w,size_y_mm:d,size_z_mm:h,
      thickness_mm:t,material:data.material,edges:null});
  }
  return parts.map(withRole);
}

// Role = construction function of the part (independent of its geometry).
const CARCASS_ROLES = { side_left: "side", side_right: "side", bottom: "bottom", top: "top" };
function withRole(part) {
  return part.role ? part : { ...part, role: CARCASS_ROLES[part.id] || part.type };
}

// Inner free box of the carcass: between sides, above bottom, below top.
function carcassInterior(parts) {
  const byId = Object.fromEntries(parts.map(p => [p.id, p]));
  const { side_left: l, side_right: r, bottom: b, top } = byId;
  if (!l || !r || !b || !top) return null;
  return {
    x0: l.x_mm + l.size_x_mm, x1: r.x_mm,
    y0: Math.max(l.y_mm, r.y_mm), y1: Math.min(l.y_mm + l.size_y_mm, r.y_mm + r.size_y_mm),
    z0: b.z_mm + b.size_z_mm, z1: top.z_mm
  };
}

// MountScheme pairs from real panel contacts (factory rule "mounting").
function buildMachining(parts) {
  return computeMounts(parts);
}

function safeBazisName(value) {
  return String(value || "").replace(/[\\"\r\n]/g, "_");
}

// BAZIS butt indices from the factory reference script ("ТИМА ПЕТРАШ Ш 1"):
//   vertical panel: 0 bottom, 1 front, 2 top, 3 back; horizontal panel:
//   0 front, 2 back, 1/3 the two ends (which is left/right is not verified,
//   so ends are emitted only when both have the same edge).
const BUTT_INDEX = {
  x: { bottom: 0, front: 1, top: 2, back: 3 },
  z: { front: 0, back: 2 }
};
const BUTT_VAR = { KR08: "KR08", BUM02: "BUM02" };

function buttLines(v, part) {
  const e = part.edges;
  if (!e) return [];
  const axis = thicknessAxis(part);
  const out = [];
  const add = (idx, code) => { if (code && BUTT_VAR[code]) out.push("panelOperations.AddButt(" + v + ", " + idx + ", " + BUTT_VAR[code] + ");"); };
  if (axis === "x") for (const [face, idx] of Object.entries(BUTT_INDEX.x)) add(idx, e[face]);
  if (axis === "z") {
    add(BUTT_INDEX.z.front, e.front);
    add(BUTT_INDEX.z.back, e.back);
    if (e.left === e.right) { add(1, e.left); add(3, e.right); }
    else if (e.left || e.right) out.push("// Кромка лише на одному торці (" + (e.left ? "лівий" : "правий") + ") — номер торця в BAZIS не перевірений.");
  }
  if (axis === "y") {
    const all = [e.top, e.bottom, e.left, e.right];
    if (all.every(c => c && c === all[0])) [0, 1, 2, 3].forEach(i => add(i, all[0]));
    // Bottom edge only (COKOL): index 0, as in the factory reference script.
    else if (e.bottom && !e.top && !e.left && !e.right) add(0, e.bottom);
    else if (all.some(Boolean)) out.push("// Кромка фронтальної деталі не на всіх торцях — номери торців у BAZIS не перевірені.");
  }
  if (out.length) out.push(v + ".Build();");
  return out;
}

// draft = incomplete geometry: the code is still generated so the
// technologist can open it in BAZIS, but every gap is listed on top.
function generateBazisScript(data, parts, draft = null, machining = []) {
  if (!parts.length) return null;

  const comment = text => "//   - " + String(text).replace(/[\r\n]+/g, " ");
  const lines = [
    "// ELVIN -> BAZIS 10",
    "// Project: " + safeBazisName(data.projectName),
    ...(draft
      ? ["// ЧЕРНЕТКА — НЕ ДЛЯ ВИРОБНИЦТВА. Конструкція неповна, перевірте в BAZIS.",
         "// Не вистачає / потребує уточнення:",
         ...draft.missing.map(m => comment(m.question || m.field))]
      : ["// Generated only from confirmed Wardrobe Engine geometry."]),
    "",
    "function moveMin(obj, x, y, z) {",
    "  obj.Build();",
    "  let g = obj.GabMin;",
    "  obj.Translate(x - g.x, y - g.y, z - g.z);",
    "  obj.Build();",
    "}",
    ""
  ];

  // Never silently drop a part: a script that misses panels is worse than
  // no script. Axis mapping Elvin -> BAZIS lives in bazis-axes.js.
  const placements = parts.map(part => toBazisPlacement(part, data.depth));
  if (placements.some(pl => !pl)) {
    if (!draft) return null;
    // In a draft an unplaceable part is listed, never silently dropped.
    lines.push("// Пропущено (невизначена орієнтація або розміри): " +
      parts.filter((_, i) => !placements[i]).map(p => safeBazisName(p.id)).join(", "), "");
  }

  // Edge materials as in the factory reference script (parameters to be checked in BAZIS).
  if (parts.some(p => p.edges && Object.values(p.edges).some(Boolean))) {
    lines.push(
      "let KR08 = materialData.CreateButtMaterialData(\"Кромка 0.8\", 0.8, 22, true, \"KR08\", 0, true, 0);",
      "let BUM02 = materialData.CreateButtMaterialData(\"Бумага 0.2\", 0.2, 22, true, \"BUM02\", 0, true, 0);",
      ""
    );
  }

  let activeMaterial = null;
  parts.forEach((part, i) => {
    const pl = placements[i];
    if (!pl) return;
    const material = safeBazisName(part.material) + "|" + part.thickness_mm;
    if (material !== activeMaterial) {
      lines.push("materialData.SetupActiveMaterial(\"" + safeBazisName(part.material) + "\", " + part.thickness_mm + ");");
      activeMaterial = material;
    }
    const v = "P_" + String(part.id).replace(/[^a-zA-Z0-9_]/g, "_");
    if (part.note) lines.push("// " + String(part.note).replace(/[\r\n]+/g, " "));
    lines.push(
      "let " + v + " = objects3d.NewPanel(" + pl.panel[0] + ", " + pl.panel[1] + ", objects3d.PanelOrientation." + pl.orientation + ");",
      v + ".Name = \"" + safeBazisName(part.name || part.id) + "\";",
      ...(pl.texture ? [v + ".TextureOrientation = panelOperations.textureOrientation." + pl.texture + ";"] : []),
      "moveMin(" + v + ", " + pl.min.x + ", " + pl.min.y + ", " + pl.min.z + ");",
      ...buttLines(v, part),
      ""
    );
  });

  // MountScheme exactly as in the factory reference script.
  const varOf = id => "P_" + String(id).replace(/[^a-zA-Z0-9_]/g, "_");
  const placed = new Set(parts.filter((_, i) => placements[i]).map(p => p.id));
  const mounts = (machining || []).filter(m => m.type === "MountScheme" && placed.has(m.a) && placed.has(m.b));
  if (mounts.length) {
    lines.push(
      "// MountScheme (конфірмат + шкант) за парами деталей, що торкаються.",
      "let Props = Action.Properties;",
      "let Furn = Props.NewFurniture(\"Схема кріплення\");",
      "Furn.Click();",
      "function M(a, b) {",
      "  Furn.Value.MountScheme(a, b, 0, {x: 0, y: 0, z: 0});",
      "}",
      ...mounts.map(m => "M(" + varOf(m.a) + ", " + varOf(m.b) + ");"),
      ""
    );
  }
  lines.push(
    "historyOperations.CommitCurrentChanges(\"" + safeBazisName(data.projectName) + "\");"
  );
  return lines.join("\n");
}

export function buildBazisPlan(data, parts, machining, draft = null) {
  const script = generateBazisScript(data, parts, draft, machining);
  return {
    status: !script ? "WAITING_FOR_PART_GEOMETRY" : draft ? "DRAFT_CODE" : "PREVIEW_CODE_READY",
    projectName: data.projectName,
    verifiedMethods: ["objects3d.NewPanel", "moveMin", "SetupActiveMaterial", "AddButt", "TextureOrientation", "MountScheme"],
    parts,
    machining,
    script,
    productionReady: false,
    note: script && draft
      ? "Чернетка коду BAZIS з неповної конструкції. Перелік того, чого бракує, — на початку коду."
      : script
      ? "Код геометрії доступний для перевірки. Виробничі кромки/кріплення додаються тільки з підтверджених правил."
      : "Немає достатньої підтвердженої геометрії для коду."
  };
}

// ============================================================
// ENGINE
// ============================================================

export function buildWardrobe(confirmedAnalysis = {}) {
  const data = normalizeAnalysis(confirmedAnalysis);

  // Unknown sections do not stop the carcass: the interior is reported later
  // (geometry questions), so a draft carcass + BAZIS code is still produced.
  data.depthNotes = applyFacadeDepth(data);
  const missing = validateRequiredData(data).filter(m => m.field !== "sections");

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

  // --------------------------------------------------------
  // INTERIOR
  //
  // Preferred: construction.interior (split tree, sizes from
  // the drawing). Legacy: construction.internal_panels with
  // explicit coordinates. Both at once is a conflict -> ASK.
  // --------------------------------------------------------

  const c = data.construction || {};
  const interiorMissing = [];
  let sections = null;
  const hasTree = c.interior !== undefined && c.interior !== null;
  const hasList = Array.isArray(c.internal_panels) && c.internal_panels.length > 0;
  if (hasTree && hasList) {
    interiorMissing.push({field:"construction.interior",question:"Внутрішнє наповнення передано двома способами (interior та internal_panels). Який із них правильний?"});
  } else if (hasTree) {
    const box = carcassInterior(parts);
    if (!box) {
      interiorMissing.push({field:"construction.interior",question:"Внутрішні секції неможливо розрахувати: корпус (боковини, дно, верх) побудований не повністю."});
    } else {
      // Shelves and partitions stop in front of the HDF groove (factory standard).
      box.y1 -= grooveSetback(data) || dspBackSetback(data);
      const layout = buildInterior(c.interior, box, { thickness_mm: data.materialThickness, material: data.material });
      if (layout.ok) {
        parts.push(...layout.parts);
        sections = layout.sections;
      } else {
        interiorMissing.push(...layout.errors);
      }
    }
  }

  // --------------------------------------------------------
  // GEOMETRY CHECK
  //
  // Collisions, envelope, physical support of shelves and
  // partitions. Runs on the SAME parts list that 3D and BAZIS use.
  // --------------------------------------------------------

  // Back panel: HDF in the groove is built from the factory standard.
  let backModelled = false;
  if (!isBackAbsent(data) && grooveSetback(data) > 0) {
    const hdf = buildGrooveBack(data, parts);
    if (hdf) { parts.push(hdf); backModelled = true; }
    else interiorMissing.push({field:"construction.back_panel_type",question:"ХДФ у паз при накладній кришці: до якої висоти доходить лист і чи є паз у кришці?"});
  } else if (!isBackAbsent(data) && isBackType(data, /^(overlay|накладн)/i)) {
    const sheets = buildOverlayBack(data, parts);
    if (sheets && sheets.length) { parts.push(...sheets); backModelled = true; }
  } else if (!isBackAbsent(data) && dspBackSetback(data) > 0) {
    const dsp = buildDspBack(data, parts);
    if (dsp) { parts.push(dsp); backModelled = true; }
  }

  // Facades: overlay facades from the confirmed layout and factory gaps.
  let facadesModelled = false;
  if (!isFacadesAbsent(data)) {
    const type = String(c.facade_type || "").toLowerCase();
    const byId = Object.fromEntries(parts.map(p => [p.id, p]));
    const { bottom: b, top: tp, side_left: sl } = byId;
    if (type !== "overlay" && type !== "накладні") {
      interiorMissing.push({field:"construction.facade_type",question:"Elvin поки розраховує лише накладні фасади. Які фасади на кресленні?"});
    } else if (!b || !tp || !sl) {
      interiorMissing.push({field:"construction.facades_layout",question:"Фасади неможливо розрахувати: корпус побудований не повністю."});
    } else {
      const overlay = WARDROBE_RULES.facades?.overlay || {};
      // A top that overhangs the carcass (chest) stays visible above the facades.
      const zoneTop = topFrontOverhang(data) > 0 ? tp.z_mm : tp.z_mm + tp.size_z_mm;
      const res = buildFacades(c.facades_layout, { x0: 0, x1: data.width, z0: b.z_mm, z1: zoneTop, yFront: sl.y_mm },
        { thickness_mm: data.materialThickness, material: data.material, gaps: overlay.preferredGapsMm, floating: overlay.floatingGapMm });
      if (res.ok) { parts.push(...res.parts); facadesModelled = true; }
      else interiorMissing.push(...res.errors);
    }
  }

  const plinth = buildPlinth(data, parts);
  if (plinth) parts.push(plinth);

  // Edge banding from the factory rules (needs the final part list of this carcass).
  applyEdging(parts, {
    visible: WARDROBE_RULES.edging?.visible?.code || "KR08",
    rear: WARDROBE_RULES.edging?.rearTechnical?.code || "BUM02"
  });

  // Wall/ceiling fillers (front strips) for a single carcass; the order
  // builder adds them for multi-module orders.
  const sideLeft = parts.find(p => p.id === "side_left");
  if (sideLeft) parts.push(...buildFillers(c.fillers, [{ x0: 0, x1: data.width, height: data.height, yFront: sideLeft.y_mm }],
    fillerOpts(data)));

  const geometryCheck = validateGeometry(parts, { width: data.width, depth: data.depth, height: data.height });
  // Sheet limits come from factory rules, not from the Engine.
  const hdfSheet = WARDROBE_RULES.backPanel?.hdfOverlay?.maxSheetMm;
  if (hdfSheet) {
    geometryCheck.errors.push(...checkSheetLimits(parts, { back: hdfSheet }));
    geometryCheck.ok = geometryCheck.errors.length === 0;
  }

  // Never mark a partial carcass as READY. A 3D preview may be useful,
  // but a missing bottom/top or unmodelled sections cannot become BAZIS-ready.
  const requiredPartIds = ["side_left", "side_right", "bottom", "top"];
  const absentParts = requiredPartIds.filter(id => !parts.some(p => p.id === id));
  const sectionsStructured = Array.isArray(data.sections) && data.sections.length > 0 &&
    data.sections.every(section => section && typeof section === "object" &&
      positiveNumber(section.width_mm) && positiveNumber(section.depth_mm));
  const internal = c.internal_panels;
  const invalidInternal = !Array.isArray(internal) || internal.some((p,i) => {
    if (!p || !["shelf","partition"].includes(p.type) || !hasValue(p.id)) return true;
    const x=Number(p.x_mm),y=Number(p.y_mm),z=Number(p.z_mm);
    const w=Number(p.width_mm),d=Number(p.depth_mm),h=Number(p.height_mm);
    return ![x,y,z,w,d,h].every(Number.isFinite) || x<0 || y<0 || z<0 ||
      w<=0 || d<=0 || h<=0 || x+w>data.width || y+d>data.depth || z+h>data.height ||
      (p.type==="shelf" ? h!==data.materialThickness : w!==data.materialThickness);
  }) || (Array.isArray(internal) && new Set(internal.map(p=>String(p?.id))).size!==internal.length);
  // Interior is defined either by a valid tree or by valid legacy panels + structured sections.
  const interiorDefined = hasTree ? (sections !== null && !hasList) : (sectionsStructured && !invalidInternal);
  const geometryMissing = [
    ...absentParts.map(id => ({field:"geometry."+id, question:"Не побудована обов'язкова деталь корпусу: "+id+"."})),
    ...interiorMissing,
    // No interior at all: one plain question, the carcass is still drafted.
    ...(!hasTree && !hasList ? [{field:"construction.interior",question:"Внутрішнє наповнення (стійки, полиці, штанги, шухляди) не визначене за кресленням. Поки побудовано лише корпус. Вкажіть секції та розміри у світлі."}] : []),
    ...(!hasTree && hasList && !sectionsStructured ? [{field:"sections",question:"Для точної 3D-моделі потрібні структуровані секції з шириною та глибиною."}] : []),
    ...(!hasTree && hasList && invalidInternal ? [{field:"construction.internal_panels",question:"Передайте підтверджені внутрішні деталі з унікальними ID, координатами і розмірами в межах корпусу."}] : []),
    ...(!interiorDefined && !interiorMissing.length && hasTree ? [{field:"construction.interior",question:"Внутрішнє наповнення не розраховано."}] : []),
    // Legacy coordinates are taken as-is and are not checked against a dimension
    // chain of the drawing, so their completeness stays unverified.
    ...(!hasTree && hasList ? [{field:"geometry.internal_parts",question:"Повнота внутрішньої конструкції не перевірена за кресленням; експорт BAZIS заблоковано."}] : []),
    ...geometryCheck.errors.map(e => ({field:"geometry."+e.code, question:e.message, parts:e.parts})),
    // Parts the Engine does not model yet must block export instead of being silently omitted.
    ...(!isBackAbsent(data) && !backModelled ? [{field:"geometry.back_panel",question:"Задня стінка ще не розраховується Wardrobe Engine — у коді BAZIS її немає."}] : []),
    ...(!isFacadesAbsent(data) && !facadesModelled ? [{field:"geometry.facades",question:"Фасади ще не розраховуються Wardrobe Engine — у коді BAZIS їх немає."}] : [])
  ];
  if (geometryMissing.length) {
    return {
      ok: false, status: "GEOMETRY_INCOMPLETE", engineVersion: WARDROBE_ENGINE_VERSION,
      message: "Геометрія часткова: не можна позначати замовлення готовим до BAZIS.",
      missing: geometryMissing, warnings: [...materialWarnings(data), ...(data.depthNotes || [])], project: data, parts, sections, geometryCheck,
      machining: buildMachining(parts), bazis: buildBazisPlan(data, parts, buildMachining(parts), { missing: geometryMissing })
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

    warnings: [...materialWarnings(data), ...(data.depthNotes || [])],

    sections,

    geometryCheck,

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
  add("top","KR","horizontal",T,0,H-T,W-2*T,D,T);
  const lower=plinthH+T,upper=H-T;
  for(let i=1;i<=5;i++){
    const z=lower+(upper-lower)*i/6-T/2;
    add("shelf_"+i,"POLKA","horizontal",T,0,Math.round(z*100)/100,W-2*T,D-10,T);
  }
  add("plinth","COKOL","front",T,20,0,W-2*T,T,plinthH);
  add("back","TYL","back",2,D,2,W-4,backT,H-4,"ХДФ 3 мм");
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

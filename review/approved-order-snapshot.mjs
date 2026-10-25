// Preparation only: no storage, authentication, or production approval.
// An API must authenticate the technologist before accepting review metadata.
// The snapshot is JSON-serializable and suitable for a future protected store.

const SOURCES = new Set(["drawing", "approved_rule", "technologist"]);
const text = value => typeof value === "string" && value.trim().length > 0;
const positive = value => typeof value === "number" && Number.isFinite(value) && value > 0;
const scalar = value => (typeof value === "number" && Number.isFinite(value)) ||
  typeof value === "boolean" || text(value);
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const timestamp = value => text(value) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
  Number.isFinite(Date.parse(value));

/** Prepare a technologist-reviewed analysis for future persistence.
 * Returns {ok, errors, record}; never writes to storage or approves BAZIS.
 * sourceImages contains storage IDs, never base64 image contents.
 */
export function createApprovedOrderSnapshot(order) {
  const errors = [];
  if (!object(order)) return { ok: false, errors: ["order_invalid"], record: null };
  if (!text(order.orderName)) errors.push("order_name_required");
  if (!text(order.rulesVersion)) errors.push("rules_version_required");

  const images = order.sourceImages;
  if (!Array.isArray(images) || !images.length ||
      images.some(id => !text(id) || id.length > 256 || /^data:/i.test(id)) ||
      new Set(images).size !== images.length) errors.push("source_image_ids_required");

  const dims = order.dimensionsMm;
  if (!object(dims) || !["width", "height", "depth"].every(key => positive(dims[key]))) {
    errors.push("dimensions_incomplete");
  }
  if (!Array.isArray(order.materials) || !order.materials.length) errors.push("materials_required");
  if (!object(order.construction) || !Object.keys(order.construction).length) errors.push("construction_required");
  if (!Array.isArray(order.openQuestions) || order.openQuestions.length) errors.push("open_questions_unresolved");

  const review = order.review;
  if (!object(review) || review.status !== "approved") errors.push("explicit_review_required");
  if (!object(review) || !text(review.approvedBy)) errors.push("reviewer_required");
  if (!object(review) || !timestamp(review.approvedAt)) errors.push("review_timestamp_required");

  const decisions = order.decisions;
  if (!Array.isArray(decisions)) {
    errors.push("decisions_invalid");
  } else {
    const seen = new Map();
    for (const decision of decisions) {
      if (!object(decision) || !text(decision.field) || !SOURCES.has(decision.source) ||
          !scalar(decision.value) || decision.status !== "approved") {
        errors.push("decision_invalid");
        continue;
      }
      const field = decision.field.trim();
      if (seen.has(field) && !Object.is(seen.get(field), decision.value)) {
        errors.push("conflicting_decisions");
      }
      seen.set(field, decision.value);
    }
  }
  if (errors.length) return { ok: false, errors: [...new Set(errors)], record: null };

  // Whitelist fields to avoid persisting raw uploads or arbitrary API tokens.
  const record = {
    schemaVersion: "0.1",
    orderName: order.orderName, // exact, not trimmed or invented
    sourceImages: [...images],
    rulesVersion: order.rulesVersion,
    dimensionsMm: { width: dims.width, height: dims.height, depth: dims.depth },
    materials: order.materials,
    construction: order.construction,
    sections: Array.isArray(order.sections) ? order.sections : [],
    facades: Array.isArray(order.facades) ? order.facades : [],
    parts: Array.isArray(order.parts) ? order.parts : [],
    decisions,
    openQuestions: [],
    warnings: Array.isArray(order.warnings) ? order.warnings : [],
    review: { status: "approved", approvedBy: review.approvedBy, approvedAt: review.approvedAt },
    productionReady: false // human review of analysis != BAZIS production authorization
  };
  try {
    const json = JSON.stringify(record);
    if (!json) throw new Error("not JSON");
    return { ok: true, errors: [], record: JSON.parse(json) };
  } catch {
    return { ok: false, errors: ["snapshot_not_serializable"], record: null };
  }
}

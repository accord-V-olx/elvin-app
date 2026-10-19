// Pure helper for a future technologist-review workflow.
// It does not persist decisions, authenticate reviewers, or approve production.
// Callers must apply reused values to the order and revalidate with Wardrobe Engine.

function isScalarAnswer(value) {
  return (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean";
}

export function planClarifications(missing = [], decisions = [], orderName = null) {
  const pending = [];
  const reused = [];
  const conflicts = [];
  const seen = new Set();
  const approvedByField = new Map();
  const hasOrderName = typeof orderName === "string" && orderName.trim().length > 0;

  if (hasOrderName && Array.isArray(decisions)) {
    for (const decision of decisions) {
      if (!decision || decision.orderName !== orderName ||
          decision.status !== "approved" || decision.source !== "technologist" ||
          typeof decision.approvedBy !== "string" || !decision.approvedBy.trim() ||
          typeof decision.field !== "string" || !decision.field.trim() ||
          !isScalarAnswer(decision.value)) continue;
      const field = decision.field.trim();
      if (!approvedByField.has(field)) approvedByField.set(field, []);
      approvedByField.get(field).push(decision);
    }
  }

  for (const item of Array.isArray(missing) ? missing : []) {
    if (!item || typeof item.field !== "string" || !item.field.trim()) continue;
    const field = item.field.trim();
    if (seen.has(field)) continue;
    seen.add(field);
    const approved = approvedByField.get(field) || [];
    if (!approved.length) {
      pending.push(item);
    } else if (approved.some(decision => !Object.is(decision.value, approved[0].value))) {
      // Never silently choose between conflicting approved values.
      conflicts.push({ field, reason: "conflicting_approved_decisions" });
      pending.push(item);
    } else {
      reused.push({ field, value: approved[0].value, approvedBy: approved[0].approvedBy });
    }
  }
  return { pending, reused, conflicts };
}

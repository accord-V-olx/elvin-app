// Shared validation for short, explicit answers from a furniture technologist.
// This helper is not wired into the browser form yet.
export function isValidTechnologistAnswer(value) {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (typeof value !== "string") return false;
  return /[\p{L}\p{N}]/u.test(value.trim());
}

// Shared validation for short, explicit answers from a furniture technologist.
// This helper is not wired into the browser form yet.
export function isValidTechnologistAnswer(value) {
  const text = String(value ?? "").trim();
  return text.length > 0 && /[\p{L}\p{N}]/u.test(text);
}

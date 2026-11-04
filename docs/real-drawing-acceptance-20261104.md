# Elvin — real drawing acceptance checklist (draft, 2026-11-04)

This document defines **manual acceptance scenarios**, not implemented features or passing tests.
Run only on a test branch with a technologist. Never approve production or export to BAZIS from these scenarios automatically.

## Required evidence for every run
Record: exact order name; input image IDs; rules version; Engine status and missing questions; dimensions; resulting part list; reviewer identity and decision; test date. Keep source drawings available for comparison. Do not invent missing values.

## Scenario A — two photos, one wardrobe
Input: two images containing complementary halves of the same wardrobe drawing.
Expected: one order with the **exact** confirmed name, both images retained, no silent omission of dimensions from either photo. If name or a dimension is ambiguous, ask before generating parts.

## Scenario B — back panel in groove
Input: drawing specifies 3 mm HDF in a groove but omits groove offset.
Expected: ask for the **offset from the rear edge** even if the back-panel type was previously approved. Do not infer an offset or mark READY before clarification.

## Scenario C — plinth missing
Input: wardrobe drawing without plinth or leg details.
Expected: ask whether plinth/legs are present and their type/height. Do not silently apply 100 mm.

## Scenario D — repeated analysis
Input: re-analyze the same drawing after technologist approved a specific construction choice.
Expected: reuse that choice only when the same question/field and order context are unambiguous. A distinct dimensional question (shelf depth, groove offset, panel thickness) must still be asked. Changes in source drawing must trigger re-review.

## Scenario E — approval gate
Input: analysis has an open question, geometry error, or status other than READY.
Expected: no approved snapshot and no production-ready output, even if UI questions appear empty. Explicit technologist approval must not override Engine errors.

## Scenario F — 3D / BAZIS consistency (future)
Input: approved order parts from `buildOrder()` in `engine/order-builder.js`.
Expected: viewer uses the same `wardrobe.parts` array, with X width, Y height, Z depth and minimum-corner coordinates; no manually reconstructed geometry. Compare each part's dimensions, material and position with BAZIS output before any production use.

## Exit criteria
Each scenario needs a real drawing, observed actual result, screenshot or log, and technologist sign-off. Until then status is **NOT VERIFIED**.

// ============================================================
// AI INTERIOR -> ENGINE INTERIOR
// ============================================================
// The AI returns a simple, fixed-depth description that is easy
// to read from a drawing:
//
//   interior: {
//     size_reference: "clear" | "axis" | "outer" | "unknown",
//     shelf_front_setback_mm: number | null,
//     sections: [                        // left -> right
//       { width_mm, openings: [          // bottom -> top
//           { height_mm, subsections: [ { width_mm } ] }  // optional split of one opening
//       ] }
//     ]
//   }
//
// This module converts it into the Engine split tree
// (engine/interior-layout.js). It never fills in missing sizes:
// null stays null, and the Engine asks about it.
// ============================================================

function opening(o) {
  const subs = Array.isArray(o?.subsections) ? o.subsections : [];
  return subs.length >= 2
    ? { size_mm: o?.height_mm ?? null, split: "vertical", cells: subs.map(s => ({ size_mm: s?.width_mm ?? null })) }
    : { size_mm: o?.height_mm ?? null };
}

function section(s) {
  const openings = Array.isArray(s?.openings) ? s.openings : [];
  const size_mm = s?.width_mm ?? null;
  if (openings.length >= 2) return { size_mm, split: "horizontal", cells: openings.map(opening) };
  // One opening split by partitions = more vertical cells inside this section.
  if (openings.length === 1) {
    const { size_mm: _height, ...inner } = opening(openings[0]);
    return { size_mm, ...inner };
  }
  return { size_mm };
}

/**
 * @returns Engine interior tree, the input unchanged if it is already
 *          an Engine tree, or undefined if the AI found no sections.
 */
export function interiorFromAI(ai) {
  if (!ai || typeof ai !== "object" || !Array.isArray(ai.sections)) return ai ?? undefined;
  if (!ai.sections.length) return undefined;

  const root = ai.sections.length === 1
    ? (({ size_mm, ...rest }) => rest)(section(ai.sections[0]))
    : { split: "vertical", cells: ai.sections.map(section) };

  root.size_reference = ai.size_reference;
  if (ai.shelf_front_setback_mm !== null && ai.shelf_front_setback_mm !== undefined) {
    root.shelf_front_setback_mm = ai.shelf_front_setback_mm;
  }
  return root;
}

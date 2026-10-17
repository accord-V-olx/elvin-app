// ============================================================
// ELVIN GEOMETRY CHECK
// ============================================================
// Purpose:
// Verify a calculated part list BEFORE it is shown as a
// construction, sent to 3D or exported to BAZIS.
//
// Coordinate system (single for Engine, 3D and BAZIS export):
//   X = width  (left -> right)
//   Y = depth  (front -> back, Y=0 is the carcass front plane)
//   Z = height (floor -> up)
// x_mm/y_mm/z_mm is the MIN corner of the part bounding box,
// size_*_mm are sizes along the same axes. Parts are always
// axis-aligned; arbitrary rotations are not allowed.
//
// IMPORTANT:
// - This module never moves or resizes parts. It only reports.
// - Touching faces are allowed; any positive overlap volume is
//   a collision.
// ============================================================

export const GEOMETRY_EPS_MM = 0.01;

const AXES = ["x", "y", "z"];

// Panel orientation by the axis that carries the thickness.
export const ORIENTATION = {
  x: "vertical_yz", // sides, vertical partitions (normal along X)
  y: "vertical_xz", // back panel, facades, plinth (normal along Y)
  z: "horizontal"   // bottom, top, shelves (normal along Z)
};

const near = (a, b) => Math.abs(a - b) <= GEOMETRY_EPS_MM;

export function partBox(p) {
  return {
    x0: p.x_mm, y0: p.y_mm, z0: p.z_mm,
    x1: p.x_mm + p.size_x_mm,
    y1: p.y_mm + p.size_y_mm,
    z1: p.z_mm + p.size_z_mm
  };
}

// Length of the overlap of [a0,a1] and [b0,b1] (negative = gap).
function overlap1d(a0, a1, b0, b1) {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

export function overlapVolume(a, b) {
  const dx = overlap1d(a.x0, a.x1, b.x0, b.x1);
  const dy = overlap1d(a.y0, a.y1, b.y0, b.y1);
  const dz = overlap1d(a.z0, a.z1, b.z0, b.z1);
  if (dx <= GEOMETRY_EPS_MM || dy <= GEOMETRY_EPS_MM || dz <= GEOMETRY_EPS_MM) return 0;
  return dx * dy * dz;
}

// Axis whose size equals the part thickness, or null if not unique.
export function thicknessAxis(p) {
  const t = Number(p.thickness_mm);
  const hits = AXES.filter(a => near(Number(p["size_" + a + "_mm"]), t));
  return hits.length === 1 ? hits[0] : null;
}

// Do two boxes touch face-to-face on `axis` with a real contact area?
// `side` = "min" means b touches a's min face along the axis.
function facesTouch(a, b, axis, side) {
  const touch = side === "min"
    ? near(b[axis + "1"], a[axis + "0"])
    : near(b[axis + "0"], a[axis + "1"]);
  if (!touch) return false;
  return AXES.filter(o => o !== axis)
    .every(o => overlap1d(a[o + "0"], a[o + "1"], b[o + "0"], b[o + "1"]) > GEOMETRY_EPS_MM);
}

/**
 * Check a part list.
 *
 * @param {Array} parts      Engine parts.
 * @param {Object} envelope  {width, depth, height} overall product size.
 * @param {Object} [options]
 * @param {Array<string>} [options.supportChecked]  Part types whose
 *   physical support must be proven ("shelf", "partition").
 * @returns {{ok:boolean, errors:Array, checkedPairs:number}}
 */
export function validateGeometry(parts, envelope, options = {}) {
  const errors = [];
  const supportChecked = options.supportChecked || ["shelf", "partition"];
  const add = (code, ids, message) => errors.push({ code, parts: ids, message });

  // --- 1. Identity and numeric sanity ------------------------------------
  const ids = new Set();
  const valid = [];
  for (const p of parts) {
    if (!p || p.id === undefined || p.id === null || p.id === "") {
      add("PART_WITHOUT_ID", [], "Деталь без ID.");
      continue;
    }
    if (ids.has(p.id)) add("DUPLICATE_ID", [p.id], "Повторюваний ID деталі: " + p.id + ".");
    ids.add(p.id);

    const nums = ["x_mm", "y_mm", "z_mm", "size_x_mm", "size_y_mm", "size_z_mm", "thickness_mm"].map(k => Number(p[k]));
    if (!nums.every(Number.isFinite) || nums.slice(3).some(n => n <= 0)) {
      add("INVALID_NUMBERS", [p.id], "Деталь " + p.id + " має нечислові або непозитивні розміри.");
      continue;
    }
    if (!thicknessAxis(p)) {
      add("THICKNESS_AXIS", [p.id], "Деталь " + p.id + ": жоден розмір (або більше одного) не дорівнює товщині " + p.thickness_mm + " мм — орієнтація неоднозначна.");
      continue;
    }
    valid.push(p);
  }

  // --- 2. Envelope -------------------------------------------------------
  if (envelope) {
    const lim = { x: envelope.width, y: envelope.depth, z: envelope.height };
    for (const p of valid) {
      // Back panels / facades may sit outside the carcass along Y.
      if (p.outside_envelope_allowed) continue;
      const b = partBox(p);
      const out = AXES.filter(a => b[a + "0"] < -GEOMETRY_EPS_MM || b[a + "1"] > lim[a] + GEOMETRY_EPS_MM);
      if (out.length) add("OUT_OF_ENVELOPE", [p.id], "Деталь " + p.id + " виходить за габарит по осі " + out.join(", ").toUpperCase() + ".");
    }
  }

  // --- 3. Collisions (pairwise, touching allowed) ------------------------
  const boxes = valid.map(p => [p, partBox(p)]);
  let checkedPairs = 0;
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      checkedPairs++;
      const v = overlapVolume(boxes[i][1], boxes[j][1]);
      if (v > 0) {
        add("COLLISION", [boxes[i][0].id, boxes[j][0].id],
          "Деталі " + boxes[i][0].id + " і " + boxes[j][0].id + " перетинаються (" + Math.round(v) + " мм³).");
      }
    }
  }

  // --- 4. Physical support of internal panels ----------------------------
  // Shelf: both X-ends must rest on a vertical panel (side/partition).
  // Partition: must stand on a horizontal panel and be closed from above.
  const vertical = boxes.filter(([p]) => thicknessAxis(p) === "x");
  const horizontal = boxes.filter(([p]) => thicknessAxis(p) === "z");
  for (const [p, b] of boxes) {
    if (!supportChecked.includes(p.role)) continue;
    if (p.role === "shelf") {
      const left = vertical.some(([, o]) => facesTouch(b, o, "x", "min"));
      const right = vertical.some(([, o]) => facesTouch(b, o, "x", "max"));
      if (!left || !right) {
        add("UNSUPPORTED_SHELF", [p.id], "Полиця " + p.id + " не спирається на " + (!left && !right ? "обидві" : !left ? "ліву" : "праву") + " вертикальну деталь.");
      }
    } else if (p.role === "partition") {
      const below = horizontal.some(([, o]) => facesTouch(b, o, "z", "min"));
      const above = horizontal.some(([, o]) => facesTouch(b, o, "z", "max"));
      if (!below || !above) {
        add("UNSUPPORTED_PARTITION", [p.id], "Перегородка " + p.id + " не має опори " + (!below && !above ? "знизу і зверху" : !below ? "знизу" : "зверху") + ".");
      }
    }
  }

  return { ok: errors.length === 0, errors, checkedPairs };
}

/**
 * Sheet size limits by part role, e.g. { back: { length: 2800, width: 2070 } }.
 * Limits come from factory rules; parts over the limit must be split.
 */
export function checkSheetLimits(parts, limitsByRole) {
  const errors = [];
  for (const p of parts) {
    const limit = limitsByRole[p.role];
    const axis = thicknessAxis(p);
    if (!limit || !axis) continue;
    const [a, b] = AXES.filter(o => o !== axis).map(o => p["size_" + o + "_mm"]).sort((m, n) => n - m);
    const [la, lb] = [limit.length, limit.width].sort((m, n) => n - m);
    if (a > la + GEOMETRY_EPS_MM || b > lb + GEOMETRY_EPS_MM) {
      errors.push({ code: "SHEET_TOO_LARGE", parts: [p.id],
        message: "Деталь " + p.id + " (" + a + "×" + b + " мм) більша за лист " + la + "×" + lb + " мм — потрібно розділити." });
    }
  }
  return errors;
}

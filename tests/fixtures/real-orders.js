// Real factory orders, anonymised: only part sizes and construction.
// Source of truth: the technologist's GibLab cutting list (finished part
// sizes, mm). Each module is one carcass; "parts" are GibLab rows
// [name, length, width, qty]. Parts the Engine does not model yet
// (drawers, rails, rods, desk, plinth, panels) are listed in "notModelled".

export const REAL_ORDERS = [
  {
    id: "REAL-A",
    description: "Kids room: 4 modules (32 | 104 | 35 | 52) + desk, height 2884 incl. 80 plinth and 18 ceiling filler, depth 600",
    modules: [
      {
        id: "A-104", width: 1040, height: 2786, depth: 576, thickness: 18,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay", facade_type: "overlay", back_panel_type: "overlay",
          facades_layout: { columns: [0, 1].map(() => ({ width_mm: null, rows: [{ height_mm: 2255, kind: "door" }, { height_mm: 521, kind: "door" }] })) } },
        // Facades with factory gaps 3 / 3 / 2 / 4 match GibLab.
        parts: [["KR", 1040, 576, 1], ["DNO", 1040, 576, 1], ["ST_L", 2750, 576, 1], ["ST_R", 2750, 576, 1],
          ["FASAD", 521, 516, 2], ["FASAD", 2255, 516, 2], ["TYL", 2782, 1036, 1]],
        // Factory standard (2026-10-16) would give 1004x576; 575 / 497 were the technologist's choice.
        technologistVariant: [["POLKA", 1004, 575, 2], ["POLKA", 1004, 497, 1]],
        pending: [],
        notModelled: ["RAST 1004x60 x3", "RAST 930x60", "drawers 2x", "rod 995", "37 mm inner panels"]
      },
      {
        id: "A-52", width: 520, height: 2786, depth: 576, thickness: 18, shelves: 7,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay", facade_type: "overlay", back_panel_type: "overlay",
          facades_layout: { columns: [{ width_mm: null, rows: [{ height_mm: 2255, kind: "door" }, { height_mm: 521, kind: "door" }] }] } },
        parts: [["KR", 520, 576, 1], ["DNO", 520, 576, 1], ["ST_L", 2750, 576, 1], ["ST_R", 2750, 576, 1], ["POLKA", 484, 576, 7],
          ["FASAD", 521, 516, 1], ["FASAD", 2255, 516, 1], ["TYL", 2782, 516, 1]],
        pending: [],
        notModelled: []
      },
      {
        id: "A-35", width: 350, height: 2786, depth: 600, thickness: 18, shelves: 6,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "inset", back_panel_type: "dsp" },
        // DSP back standard (2026-10-18): ST_TYL under the top, shelves depth - 19.
        parts: [["DNO", 350, 600, 1], ["ST_L", 2768, 600, 1], ["ST_R", 2768, 600, 1], ["KR", 314, 600, 1], ["POLKA", 314, 581, 6], ["ST_TYL", 2750, 314, 1]],
        // This technologist ran ST_TYL to the top and set KR in front of it.
        technologistVariant: [["KR", 314, 581, 1], ["POLKA", 314, 580, 6], ["ST_TYL", 2768, 314, 1]],
        pending: [],
        notModelled: []
      }
    ]
  },
  {
    id: "REAL-B",
    description: "Wardrobe 1500 x 2000 x 300 + facades, plinth 150 on legs, sections 973 | 473",
    modules: [
      {
        id: "B-1500", width: 1500, height: 1850, depth: 300, thickness: 18,
        construction: { side_panels: "full_height", bottom_type: "inset", top_type: "inset" },
        interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 973 }, { size_mm: 473 }] },
        // Factory standard (2026-10-16): inner panels exactly in the opening, full depth.
        parts: [["ST_L", 1850, 300, 1], ["ST_R", 1850, 300, 1], ["KR", 1464, 300, 1], ["DNO", 1464, 300, 1], ["ST_SR", 1814, 300, 1]],
        technologistVariant: [["KR", 1464, 299, 1], ["DNO", 1464, 299, 1], ["ST_SR", 1813, 298, 1],
          ["POLKA", 473, 293, 1], ["POLKA", 472, 293, 4], ["POLKA", 472, 292, 1], ["POLKA_SR", 973, 298, 1]],
        pending: [["TYL", 1832, 492, 1], ["FASAD", 1845, 496, 3]],
        notModelled: ["COKOL 1500x150", "COKOL 262x150 x2", "rasp_TYL 973x100", "ST_SR 834x298"]
      }
    ]
  },
  {
    id: "REAL-C",
    description: "Chest 1350 x 750 x 350 (overlay top, sides to the floor, HDF in groove 10 mm) + aquarium stand 600 x 850 x 400 (37 mm sides and top, DSP back)",
    modules: [
      {
        id: "C-1350", width: 1350, height: 750, depth: 350, thickness: 18, furnitureType: "комод",
        construction: { side_panels: "full_height", bottom_type: "inset", top_type: "overlay", plinth_height_mm: 60 },
        interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 423 }, { size_mm: 873 }] },
        // KR overhangs the carcass at the front by 20 mm (factory rule, 2026-10-16).
        parts: [["ST_L", 732, 330, 1], ["ST_R", 732, 330, 1], ["KR", 1350, 350, 1], ["DNO", 1314, 330, 1]],
        // This technologist made the inset bottom 2 mm narrower (technologist's choice, not a rule).
        technologistVariant: [["DNO", 1312, 330, 1]],
        // Made with a 10 mm groove before the 14 mm standard: partition/shelves 316 (standard gives 312).
        technologistVariantGroove: [["ST_SR", 654, 316, 1], ["POLKA", 423, 316, 1], ["POLKA", 871, 316, 1]],
        pending: [["TYL", 1328, 670, 1], ["FASAD", 678, 445, 3], ["COKOL", 1312, 60, 2]],
        notModelled: []
      }
    ],
    notModelledModules: ["aquarium stand: sides and top glued 2x18 = 37 mm, DNO 524x380, ST_SR 795x361, ST_TYL 795x524, shelves 253x361 x2, inset facades 799x257 x2"]
  },
  {
    id: "REAL-D",
    description: "Chest of 6 drawers 1800 x 980 x 500 on plastic feet: overlay top, sides to the floor, inset bottom, HDF in groove 10 mm, two drawer columns",
    modules: [
      {
        id: "D-1800", width: 1800, height: 980, depth: 500, thickness: 18, furnitureType: "комод",
        construction: { side_panels: "full_height", bottom_type: "inset", top_type: "overlay", plinth_height_mm: 0 },
        interior: { size_reference: "clear", split: "vertical", cells: [{ size_mm: 873 }, { size_mm: 873 }] },
        parts: [["ST_L", 962, 480, 1], ["ST_R", 962, 480, 1], ["KR", 1800, 500, 1], ["DNO", 1764, 480, 1]],
        technologistVariant: [["DNO", 1762, 480, 1]],
        // Partition stops in front of the HDF groove; HDF = opening + 14 (width) / + 16 (height), not confirmed yet.
        // Partition 465 was made before the groove standard (standard gives 480 - 18 = 462).
        technologistVariantGroove: [["ST_SR", 944, 465, 1]],
        pending: [["TYL", 1778, 960, 1],
          ["FASAD", 896, 291, 4], ["FASAD", 896, 285, 2]],
        notModelled: ["drawer boxes 6x (sides 450x210.5, back 828x200.5, bottom 828x431)", "rails 872x60 x6"]
      }
    ]
  },
  {
    id: "REAL-E",
    description: "Wall unit around a niche: lower cabinets, upper cabinets, top boxes, 37 mm frame panels. Height 2575, depth 550 with facades",
    modules: [
      {
        id: "E-S84", width: 840, height: 1570, depth: 528, thickness: 18, shelves: 4,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay" },
        // New factory standard holds: shelves 804 = 840 - 36, full depth.
        parts: [["KR", 840, 528, 1], ["DNO", 840, 528, 1], ["ST_L", 1534, 528, 1], ["ST_R", 1534, 528, 1], ["POLKA", 804, 528, 4]],
        // Facades 2 + 416 + 4 + 416 + 2 = 840 (rule); height 1566 = 1570 - 2 - 2 (rule says 3 + 3).
        pending: [["FASAD", 1566, 416, 2]],
        notModelled: []
      },
      {
        id: "E-A84", width: 840, height: 500, depth: 528, thickness: 18,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "inset", back_panel_type: "groove" },
        // Groove standard 2026-10-17 (14 + 4): inset KR 528 - 18 = 510, as in GibLab.
        // HDF in the groove (confirmed 2026-10-17): opening + 16 = 820, height 489.
        parts: [["DNO", 840, 528, 1], ["ST_L", 482, 528, 1], ["ST_R", 482, 528, 1], ["KR", 804, 510, 1], ["TYL", 820, 489, 1]],
        pending: [["FASAD", 496, 416, 2]],
        notModelled: []
      }
    ],
    notModelledModules: ["lower cabinets with drawers and DSP back", "open green cabinet with LED grooves", "37 mm niche frame panels 2180x550, 2038x550"]
  },
  {
    id: "REAL-F",
    description: "Hallway wardrobe 1900: closed wardrobe 1400 (two sections) + open shelf unit 500 with DSP back + hanging drawer + mirror panel. Height 2763 incl. 100 plinth",
    modules: [
      {
        id: "F-S140", width: 1401, height: 2663, depth: 580, thickness: 18,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay" },
        interior: { size_reference: "clear", split: "vertical", cells: [
          { size_mm: 907, split: "horizontal", cells: [{ size_mm: 863 }, { size_mm: 864 }, { size_mm: 864 }] },
          { size_mm: 440, split: "horizontal", cells: [{ size_mm: 863 }, { size_mm: 864 }, { size_mm: 864 }] }] },
        parts: [["KR", 1401, 580, 1], ["DNO", 1401, 580, 1], ["ST_L", 2627, 580, 1], ["ST_R", 2627, 580, 1],
          ["ST_SR", 2627, 580, 1], ["POLKA", 907, 580, 2], ["POLKA", 440, 580, 2]],
        // Removable shelf 906x579 (-1/-1): before the factory standard of 2026-10-16.
        technologistVariant: [["POLKA", 906, 579, 1]],
        pending: [["FASAD", 2607, 462, 3]],
        notModelled: ["COKOL 1898x100, 558x100", "PLANKA 1397x50"]
      },
      {
        id: "F-S50", width: 500, height: 2663, depth: 600, thickness: 18, shelves: 5,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "inset", back_panel_type: "dsp" },
        parts: [["DNO", 500, 600, 1], ["ST_L", 2645, 600, 1], ["ST_R", 2645, 600, 1], ["KR", 464, 600, 1],
          ["POLKA", 464, 581, 5], ["ST_TYL", 2627, 464, 1]],
        pending: [],
        notModelled: []
      }
    ],
    notModelledModules: ["hanging cabinet with drawer 800x200x400", "mirror panels 800x1855, 800x700"]
  }
];

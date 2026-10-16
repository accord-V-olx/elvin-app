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
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay" },
        parts: [["KR", 1040, 576, 1], ["DNO", 1040, 576, 1], ["ST_L", 2750, 576, 1], ["ST_R", 2750, 576, 1]],
        pending: [["POLKA", 1004, 575, 2], ["POLKA", 1004, 497, 1], ["TYL", 2782, 1036, 1],
          ["FASAD", 521, 516, 2], ["FASAD", 2255, 516, 2]],
        notModelled: ["RAST 1004x60 x3", "RAST 930x60", "drawers 2x", "rod 995", "37 mm inner panels"]
      },
      {
        id: "A-52", width: 520, height: 2786, depth: 576, thickness: 18, shelves: 7,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "overlay" },
        parts: [["KR", 520, 576, 1], ["DNO", 520, 576, 1], ["ST_L", 2750, 576, 1], ["ST_R", 2750, 576, 1], ["POLKA", 484, 576, 7]],
        pending: [["TYL", 2782, 516, 1], ["FASAD", 521, 516, 1], ["FASAD", 2255, 516, 1]],
        notModelled: []
      },
      {
        id: "A-35", width: 350, height: 2786, depth: 600, thickness: 18, shelves: 6,
        construction: { side_panels: "on_bottom", bottom_type: "full_width", top_type: "inset" },
        parts: [["DNO", 350, 600, 1], ["ST_L", 2768, 600, 1], ["ST_R", 2768, 600, 1]],
        // DSP back inside the carcass (ST_TYL) reduces KR and shelf depth.
        pending: [["KR", 314, 581, 1], ["POLKA", 314, 580, 6], ["ST_TYL", 2768, 314, 1]],
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
        parts: [["ST_L", 1850, 300, 1], ["ST_R", 1850, 300, 1]],
        pending: [["KR", 1464, 299, 1], ["DNO", 1464, 299, 1], ["ST_SR", 1813, 298, 1],
          ["POLKA", 473, 293, 1], ["POLKA", 472, 293, 4], ["POLKA", 472, 292, 1], ["POLKA_SR", 973, 298, 1],
          ["TYL", 1832, 492, 1], ["FASAD", 1845, 496, 3]],
        notModelled: ["COKOL 1500x150", "COKOL 262x150 x2", "rasp_TYL 973x100", "ST_SR 834x298"]
      }
    ]
  }
];

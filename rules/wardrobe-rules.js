// ============================================================
// ELVIN WARDROBE RULES v1
// Factory wardrobe rules for Elvin
// ============================================================
//
// STATUS:
// AUTO   = Elvin may apply automatically
// ASK    = Elvin must ask the technologist
// PAUSED = recognize/store, but do not automate
//
// CRITICAL:
// Never invent production-critical information.
// Conflict / uncertainty / missing rule => STOP -> ASK.
//
// New confirmed ELVIN rules have priority over older
// conflicting reference rules.
// ============================================================

export const WARDROBE_RULES_VERSION = "1.0";

export const WARDROBE_RULES = {

  // ==========================================================
  // GLOBAL SAFETY
  // ==========================================================

  safety: {
    status: "FIXED",

    rules: [
      "Never invent production-critical information.",

      "If the drawing or order conflicts with an approved factory rule, STOP and ASK the technologist.",

      "If a critical dimension or construction condition is unknown or ambiguous, STOP and ASK.",

      "The exact order/project name is mandatory before BAZIS generation.",

      "Do not silently change factory rules.",

      "A PAUSED construction must not be generated automatically.",

      "New confirmed ELVIN rules have priority over older conflicting reference rules."
    ]
  },


  // ==========================================================
  // MATERIALS
  // ==========================================================

  materials: {

    carcass: {
      status: "AUTO",

      standardMaterial: "DSP",
      standardThicknessMm: 18,

      allowedKnownThicknessesMm: [
        10,
        16,
        18
      ],

      laminatedConstruction: {
        status: "ASK",
        layersMm: [18, 18],
        glueApproxMm: 1,
        totalApproxMm: 37
      },

      rules: [
        "Standard carcass DSP thickness is 18 mm.",

        "DSP 10 mm and 16 mm are also used when specified by the project.",

        "If another thickness is explicitly specified in the drawing/order, use the project value.",

        "If material or thickness is contradictory or unclear, ASK."
      ]
    },


    facade: {
      status: "AUTO_WITH_PROJECT_OVERRIDE",

      standardMaterial: "DSP",
      standardThicknessMm: 18,

      knownOptions: [
        "DSP 16 mm",
        "DSP 18 mm",
        "MDF - thickness depends on project"
      ],

      rules: [
        "Standard facade material is DSP 18 mm.",

        "Facade material and thickness may differ when explicitly specified by the project."
      ]
    },


    physicalParts: {
      status: "AUTO",

      rules: [
        "Every physical furniture part must remain a separate editable BAZIS panel/object."
      ]
    }
  },


  // ==========================================================
  // CARCASS CONSTRUCTION
  // ==========================================================

  carcassConstruction: {

    bottom: {
      status: "AUTO",
      type: "FULL_WIDTH",

      rules: [
        "Standard wardrobe bottom uses the full overall wardrobe width.",

        "Example: wardrobe width 1500 mm -> bottom width 1500 mm.",

        "Left upright, right upright and internal uprights stand ON the bottom."
      ]
    },


    outerUprights: {
      status: "AUTO",

      rules: [
        "Standard left and right uprights stand on the full-width bottom.",

        "If the project explicitly requires another construction, use project data.",

        "If the construction is unclear, ASK."
      ]
    },


    top: {
      status: "AUTO",
      type: "INSET_BETWEEN_OUTER_UPRIGHTS",

      rules: [
        "Standard wardrobe top is inset between left and right uprights.",

        "This is the preferred standard wardrobe construction.",

        "If the project explicitly requires an overlay top or another construction, use project data.",

        "If unclear, ASK."
      ]
    },


    internalUprights: {
      status: "AUTO",

      rules: [
        "Internal vertical uprights stand on the bottom.",

        "Internal uprights connect to the top.",

        "Their height must account for the top panel thickness."
      ]
    }
  },


  // ==========================================================
  // DEPTH
  // ==========================================================

  depth: {

    overallDepthIncludesFacade: {
      status: "AUTO",

      formula:
        "carcassDepth = overallDepth - facadeThickness - 2",

      adjustmentClearanceMm: 2,

      examples: [
        {
          overallDepthMm: 600,
          facadeThicknessMm: 18,
          carcassDepthMm: 580
        }
      ],

      rules: [
        "When overall depth includes the facade, subtract facade thickness and 2 mm adjustment clearance.",

        "Do NOT additionally subtract HDF unless a specific confirmed construction rule explicitly requires it."
      ]
    }
  },


  // ==========================================================
  // SHELVES
  // ==========================================================

  shelves: {

    depth: {
      status: "AUTO",

      formula: "shelfDepth = carcassDepth",

      rules: [
        "Standard shelf depth equals carcass/side depth.",

        "Do not automatically subtract 10 mm."
      ]
    }
  },


  // ==========================================================
  // BACK PANEL
  // ==========================================================

  backPanel: {

    selection: {
      status: "ASK",

      knownTypes: [
        "HDF_OVERLAY",
        "HDF_PAZ",
        "DSP_BACK"
      ],

      rules: [
        "If the back construction is clearly specified in the project, use it.",

        "If back construction is not specified, ASK."
      ]
    },


    hdfOverlay: {
      status: "AUTO_WHEN_SELECTED",

      material: "HDF/DVP",
      thicknessMm: 3,
      fastening: "NAILS",

      rules: [
        "Standard overlay HDF/DVP thickness is 3 mm.",

        "Overlay HDF is nailed to the carcass."
      ]
    },


    paz: {
      status: "PAUSED",

      operationName: "PAZ",

      panelThicknessMm: 3,
      grooveWidthMm: 4,
      grooveDepthMm: 9,

      rearOffsetMm: {
        min: 5,
        max: 20
      },

      grooveSides: [
        "LEFT_UPRIGHT",
        "RIGHT_UPRIGHT",
        "BOTTOM"
      ],

      rules: [
        "PAZ is currently stored as a known construction but must NOT be generated automatically.",

        "PAZ must be tested in real BAZIS before activation.",

        "Maximum allowed HDF dimension for this construction still requires confirmation."
      ]
    },


    dspBack: {
      status: "ASK",

      rules: [
        "DSP back is treated as a separate furniture part.",

        "Exact geometry and fastening rules are not fully defined yet.",

        "Do not invent the fastening method."
      ]
    }
  },


  // ==========================================================
  // PLINTH / LEGS
  // ==========================================================

  plinth: {

    selection: {
      status: "ASK",

      rules: [
        "If the drawing/order does not specify whether a plinth is used, ASK.",

        "Do not silently add a plinth."
      ]
    },


    standard: {
      status: "AUTO_WHEN_SELECTED",

      heightMm: 100,
      frontRecessMm: 20,

      knownTypes: [
        "PLASTIC",
        "WOODEN"
      ],

      rules: [
        "Standard plinth height is 100 mm.",

        "Standard plinth front recess is 20 mm from the front edge of the carcass/bottom."
      ]
    }
  },


  legs: {

    standard100or150: {
      status: "AUTO_WHEN_SELECTED",

      supportedHeightsMm: [
        100,
        150
      ],

      minimumQuantity: 4,

      placement: {
        sideOffsetMm: 50,
        frontOffsetMm: 70,
        rearOffsetMm: 50,
        targetMaxSpacingAlongWidthMm: 500
      },

      frontLeg: {
        plinthClip: true
      },

      rearLeg: {
        plinthClip: false
      },

      rules: [
        "Extreme leg centers are 50 mm from left/right side edges.",

        "Front leg centers are 70 mm from the front edge.",

        "Rear leg centers are 50 mm from the rear edge.",

        "Minimum quantity is 4 legs.",

        "For wider wardrobes, add leg pairs so spacing along width is approximately no more than 500 mm.",

        "Example: width 1500 mm -> 3 front legs + 3 rear legs.",

        "Front legs use clips for the plinth.",

        "Rear legs do not use plinth clips."
      ]
    },


    lowLegNoPlinth: {
      status: "PAUSED",

      approximateHeightMm: 7,

      rules: [
        "Some wardrobes may use a low support without a plinth.",

        "Exact hardware name will be supplied later.",

        "Do not automate until the exact hardware and construction are confirmed."
      ]
    }
  },


  // ==========================================================
  // EDGING
  // ==========================================================

  edging: {

    visible: {
      status: "AUTO",
      code: "KR08",
      thicknessMm: 0.8
    },


    rearTechnical: {
      status: "AUTO",
      code: "BUM02",
      thicknessMm: 0.2,
      type: "PAPER"
    },


    rules: [
      "All visible edges must receive KR08 0.8 mm.",

      "Rear technical edges use BUM02 0.2 mm paper.",

      "Do not add unnecessary visible edging to an end that is actually covered by another panel."
    ],


    standardFullWidthBottom: {
      status: "AUTO",

      front: "KR08",
      left: "KR08",
      right: "KR08",
      rear: "BUM02"
    }
  },


  // ==========================================================
  // FACADES
  // ==========================================================

  facades: {

    typeSelection: {
      status: "ASK_WITH_STANDARD_RECOMMENDATION",

      standard: "OVERLAY",

      options: [
        "OVERLAY",
        "INSET"
      ],

      rules: [
        "Standard facade type is overlay.",

        "Overlay facades cover the front edges of the left/right uprights.",

        "If facade type is not sufficiently clear, ASK."
      ]
    },


    overlay: {
      status: "AUTO_WHEN_SELECTED",

      preferredGapsMm: {
        top: 3,
        left: 2,
        right: 2,
        betweenAdjacentFacades: 2,
        bottom: null
      },

      floatingGapMm: {
        enabled: true,
        min: 1.5,
        max: 4
      },

      rules: [
        "Preferred top gap is 3 mm.",

        "Preferred left/right gaps are 2 mm.",

        "Preferred gap between adjacent facades is 2 mm.",

        "Bottom gap is not yet finally confirmed.",

        "If equal whole-number facade sizes cannot be achieved with preferred gaps, use a symmetric floating gap from 1.5 to 4 mm.",

        "Preserve equal facade widths when the design requires equal facades."
      ]
    },


    inset: {
      status: "ASK_PARTIALLY_DEFINED",

      preferredGapsMm: {
        left: 2,
        right: 2,
        betweenAdjacentFacades: 2,
        top: null,
        bottom: null
      },

      rules: [
        "Inset facade side clearance is 2 mm.",

        "Gap between adjacent inset facades is 2 mm.",

        "Top and bottom inset facade gaps still require confirmation."
      ]
    },


    edging: {
      status: "AUTO_FIXED",

      code: "KR08",
      thicknessMm: 0.8,
      sides: 4,

      rules: [
        "Facade edging is KR08 0.8 mm on all four sides."
      ]
    }
  },


  // ==========================================================
  // TEXTURE
  // ==========================================================

  texture: {
    status: "AUTO",

    verticalParts: "VERTICAL",
    horizontalParts: "HORIZONTAL",
    facades: "VERTICAL",

    rules: [
      "Vertical parts use vertical texture.",

      "Horizontal parts use horizontal texture.",

      "Facades use vertical texture unless the project explicitly specifies otherwise."
    ]
  },


  // ==========================================================
  // DRILLING / FASTENING
  // ==========================================================

  mounting: {

    carcass: {
      status: "AUTO",

      type: "CONFIRMAT_PLUS_DOWEL",
      bazisMethod: "MountScheme",

      rules: [
        "Standard carcass fastening is confirmat + dowel through the tested BAZIS MountScheme.",

        "Drilling must correspond to actual touching panel pairs.",

        "Do not manually duplicate holes after MountScheme.",

        "Do not replace tested MountScheme with guessed low-level BAZIS drilling API."
      ]
    }
  },


  // ==========================================================
  // WIDE SPANS / TIES
  // ==========================================================

  wideSpanTie: {
    status: "TESTED_REFERENCE_ASK_OUTSIDE_TESTED_CONDITIONS",

    unsupportedSpanThresholdMm: 900,

    testedTie: {
      material: "DSP",
      thicknessMm: 18,
      heightMm: 100,
      orientation: "VERTICAL",
      position: "BACK_UNDER_SHELF",
      visibleEdge: "KR08",
      dowelsPerEnd: 2
    },

    rules: [
      "Do not add a tie merely because the overall section is wide if a middle vertical upright already supports the span.",

      "For an unsupported span of 900 mm or wider, a rear tie may be required.",

      "Outside tested geometry or conditions, ASK before automating."
    ]
  },


  // ==========================================================
  // PAUSED FEATURES
  // ==========================================================

  pausedFeatures: {
    status: "PAUSED",

    features: [
      "SLIDING_DOORS",
      "MIRROR_FACADES",
      "ALUMINIUM_FACADES",
      "ALUMINIUM_FACADE_SYSTEMS",
      "DRAWERS",
      "PAZ",
      "LOW_7MM_LEG",
      "UNDEFINED_NON_STANDARD_CONSTRUCTION"
    ],

    rules: [
      "Elvin may recognize and report these elements.",

      "Elvin must not invent or automatically construct them yet."
    ]
  },


  // ==========================================================
  // VERSION CONTROL
  // ==========================================================

  versionControl: {
    status: "FIXED",

    rules: [
      "Factory rules are expected to evolve over time.",

      "Elvin must never silently modify an approved factory rule.",

      "Repeated technologist corrections may create a proposal to review a rule.",

      "Only human approval creates a new approved rule version.",

      "Keep important rule-change history and reasons.",

      "Previously tested BAZIS projects remain regression/reference fixtures."
    ]
  },


  // ==========================================================
  // LEGACY / TESTED BAZIS REFERENCE
  // ==========================================================

  bazisV4Reference: {
    status: "REFERENCE_NOT_UNIVERSAL_DEFAULT",

    source: "BAZIS_WARDROBE_RULES_v4",

    testedFeatures: [
      "DSP 18 mm",
      "HDF 3 mm",
      "KR08 0.8 mm",
      "BUM02 0.2 mm",
      "Separate panels",
      "Texture orientation",
      "MountScheme",
      "1250 + 600 + 1250 tested wardrobe",
      "Rear vertical ties",
      "Tested HDF positioning",
      "Project-specific 100 mm plinth"
    ],

    rules: [
      "When BAZIS_WARDROBE_RULES_v4 conflicts with a newer confirmed ELVIN rule, the newer ELVIN rule has priority.",

      "Do not delete old tested behavior.",

      "Keep old tested constructions as regression/reference cases."
    ]
  },


  // ==========================================================
  // OPEN ITEMS
  // ==========================================================

  openItems: {
    status: "ASK",

    items: [
      "Confirm bottom gap for standard overlay facade.",

      "Confirm top and bottom gaps/formula for inset facades.",

      "Confirm maximum HDF dimension for PAZ construction.",

      "Define exact DSP back geometry and fastening.",

      "Supply exact hardware name for approximately 7 mm low support.",

      "Test PAZ in real BAZIS before changing PAZ from PAUSED to AUTO."
    ]
  }
};


// ============================================================
// TEXT VERSION FOR AI PROMPT
// ============================================================

export function getWardrobeRulesForAI() {
  return `
ELVIN WARDROBE FACTORY RULES v${WARDROBE_RULES_VERSION}

IMPORTANT:
These are factory production rules.
Do not invent missing construction information.

PRIORITY:
1. Explicit confirmed project/order information.
2. Approved AUTO factory rules.
3. ASK when a construction choice is not defined.
4. PAUSED means recognize it but do not construct it.
5. Conflict or uncertainty = STOP -> ASK.

MATERIALS:
- Standard carcass DSP: 18 mm.
- DSP 10 mm and 16 mm may be used when specified.
- Standard DSP facade: 18 mm.
- Other facade materials/thicknesses may be project-specific.
- Laminated 18+18 construction exists but must be explicitly confirmed.

STANDARD CARCASS:
- Bottom: full overall wardrobe width.
- Left/right/internal uprights stand ON the bottom.
- Standard top: inset between left/right uprights.
- Internal uprights stand on bottom and connect to top.

DEPTH:
- If overall depth includes facade:
  carcass depth = overall depth - facade thickness - 2 mm.
- Example: 600 overall with 18 mm facade = 580 mm carcass.
- Do not automatically subtract HDF.

SHELVES:
- Standard shelf depth = carcass depth.

BACK:
- Known options:
  1. HDF/DVP 3 mm overlay, nailed.
  2. HDF/DVP in PAZ.
  3. DSP back as a separate furniture part.
- If back type is not defined -> ASK.
- PAZ is currently PAUSED.

PAZ REFERENCE ONLY:
- Name: PAZ.
- Width: 4 mm.
- Depth: 9 mm.
- Rear offset: 5-20 mm.
- On left upright + right upright + bottom.
- Do not generate automatically yet.

PLINTH:
- If plinth is not defined -> ASK.
- Standard when selected: 100 mm.
- Standard front recess: 20 mm.

LEGS:
- Known standard heights: 100 or 150 mm.
- Front legs have plinth clips.
- Rear legs do not.
- Side offset: 50 mm.
- Front offset: 70 mm.
- Rear offset: 50 mm.
- Minimum 4 legs.
- For wider wardrobes, add pairs with approximately max 500 mm spacing along width.
- Example 1500 mm -> 3 front + 3 rear.

EDGING:
- Visible edges: KR08 0.8 mm.
- Rear technical edges: BUM02 0.2 mm paper.
- Standard full-width bottom:
  front/left/right = KR08;
  rear = BUM02.

FACADES:
- Standard type: overlay.
- If facade type is unclear -> ASK overlay/inset.
- Overlay preferred gaps:
  top 3 mm;
  left/right 2 mm;
  between adjacent facades 2 mm.
- Bottom overlay gap is not yet confirmed.
- Floating symmetric gap 1.5-4 mm is allowed when needed to obtain equal whole-number facade sizes.
- Inset facade:
  left/right clearance 2 mm;
  between adjacent facades 2 mm;
  top/bottom still need confirmation.
- Facade edging: KR08 0.8 mm on all 4 sides.

TEXTURE:
- Vertical parts: vertical.
- Horizontal parts: horizontal.
- Facades: vertical unless project specifies otherwise.

MOUNTING:
- Standard carcass fastening:
  confirmat + dowel using tested BAZIS MountScheme.
- Never invent low-level drilling.
- Drilling must correspond to real panel contacts.

WIDE UNSUPPORTED SPANS:
- A tested reference rule exists for rear ties at unsupported spans >= 900 mm.
- Do not add a tie if a middle upright already supports/divides the span.
- Outside tested conditions -> ASK.

PAUSED:
- sliding doors;
- mirror/aluminium facades;
- aluminium facade systems;
- drawers;
- PAZ;
- low ~7 mm support until hardware is confirmed;
- undefined non-standard construction.

ABSOLUTE STOP -> ASK:
- exact project name unknown;
- contradictory critical dimensions;
- drawing conflicts with factory rule;
- construction choice affects manufacturing but is undefined;
- required rule is missing;
- PAUSED construction would be required;
- you are not certain which construction applies.

Do not silently modify these rules.
`;
}

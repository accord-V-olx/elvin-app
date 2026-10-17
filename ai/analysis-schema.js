// ============================================================
// ELVIN AI ANALYSIS SCHEMA
// ============================================================
// JSON schema for the OpenAI structured output (strict mode):
// every object has additionalProperties:false and lists all of
// its properties in "required"; unknown values are null.
// construction.* values are fixed so the Wardrobe Engine can use
// them directly; interior is converted by engine/interior-from-ai.js.
// ============================================================

const nullableNumber = { type: ["number", "null"] };

const TOP_TYPES = ["inset", "overlay", null];
const BOTTOM_TYPES = ["inset", "full_width", null];
const SIDE_PANELS = ["full_height", "on_bottom", null];

const INTERIOR_SCHEMA = {
  type: ["object", "null"],
  additionalProperties: false,
  properties: {
    size_reference: { type: "string", enum: ["clear", "axis", "outer", "unknown"] },
    shelf_front_setback_mm: nullableNumber,
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          width_mm: nullableNumber,
          openings: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                height_mm: nullableNumber,
                subsections: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: { width_mm: nullableNumber },
                    required: ["width_mm"]
                  }
                }
              },
              required: ["height_mm", "subsections"]
            }
          }
        },
        required: ["width_mm", "openings"]
      }
    }
  },
  required: ["size_reference", "shelf_front_setback_mm", "sections"]
};

// One carcass of a multi-module order. null = same as the project.
const MODULE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    name: { type: ["string", "null"] },
    width_mm: nullableNumber,
    height_mm: nullableNumber,
    depth_mm: nullableNumber,
    furniture_type: { type: ["string", "null"] },
    top_type: { type: ["string", "null"], enum: TOP_TYPES },
    bottom_type: { type: ["string", "null"], enum: BOTTOM_TYPES },
    side_panels: { type: ["string", "null"], enum: SIDE_PANELS },
    interior: INTERIOR_SCHEMA
  },
  required: ["name", "width_mm", "height_mm", "depth_mm", "furniture_type", "top_type", "bottom_type", "side_panels", "interior"]
};

export const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    status: {
      type: "string",
      enum: [
        "needs_clarification",
        "ready"
      ]
    },

    summary: {
      type: "string"
    },

    project: {
      type: "object",
      additionalProperties: false,

      properties: {
        name: {
          type: ["string", "null"]
        },

        furniture_type: {
          type: ["string", "null"]
        },

        width_mm: {
          type: ["number", "null"]
        },

        height_mm: {
          type: ["number", "null"]
        },

        depth_mm: {
          type: ["number", "null"]
        },

        sections_description: {
          type: ["string", "null"]
        },

        material: {
          type: ["string", "null"]
        },

        back_panel: {
          type: ["string", "null"]
        },

        material_thickness_mm: {
          type: ["number", "null"]
        },

        construction: {
          type: "object",
          additionalProperties: false,
          properties: {
            // Fixed values: the Wardrobe Engine understands only these.
            top_type: { type: ["string", "null"], enum: TOP_TYPES },
            bottom_type: { type: ["string", "null"], enum: BOTTOM_TYPES },
            support_type: { type: ["string", "null"], enum: ["plinth", "legs", "none", null] },
            plinth_height_mm: { type: ["number", "null"] },
            plinth_setback_mm: { type: ["number", "null"] },
            back_panel_type: { type: ["string", "null"], enum: ["overlay", "groove", "rebate", "dsp", "none", null] },
            back_groove_offset_mm: { type: ["number", "null"] },
            facade_type: { type: ["string", "null"], enum: ["overlay", "inset", "none", null] },
            side_panels: { type: ["string", "null"], enum: SIDE_PANELS },
            interior: INTERIOR_SCHEMA
          },
          required: ["top_type","bottom_type","support_type","plinth_height_mm","plinth_setback_mm","back_panel_type","back_groove_offset_mm","facade_type","side_panels","interior"]
        },

        // Separate carcasses standing side by side, left -> right.
        // Empty array = the order is one carcass.
        modules: { type: "array", items: MODULE_SCHEMA }
      },

      required: [
        "name",
        "furniture_type",
        "width_mm",
        "height_mm",
        "depth_mm",
        "sections_description",
        "material",
        "back_panel",
        "material_thickness_mm",
        "construction",
        "modules"
      ]
    },

    warnings: {
      type: "array",
      items: {
        type: "string"
      }
    },

    questions: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          id: {
            type: "string"
          },

          title: {
            type: "string"
          },

          question: {
            type: "string"
          },

          options: {
            type: "array",

            items: {
              type: "object",
              additionalProperties: false,

              properties: {
                label: {
                  type: "string"
                },

                value: {
                  type: "string"
                },

                recommended: {
                  type: "boolean"
                }
              },

              required: [
                "label",
                "value",
                "recommended"
              ]
            }
          }
        },

        required: [
          "id",
          "title",
          "question",
          "options"
        ]
      }
    }
  },

  required: [
    "status",
    "summary",
    "project",
    "warnings",
    "questions"
  ]
};

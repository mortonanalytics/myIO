import { describe, expect, test } from "vitest";
import {
  validateSpec,
  getChartSchema,
  listChartTypes
} from "../../mcp/lib/validate.mjs";

// Regression guard for issue #52: single-mapping chart types had their
// required_mappings serialized as a scalar string, so the validator iterated
// the string character-by-character and reported a bogus MISSING_MAPPING per
// letter. A minimal valid spec for every chart type must validate cleanly.
describe("MCP validateSpec — every chart type accepts its minimal spec", function() {
  for (const type of listChartTypes()) {
    test(`${type} validates with its required mappings`, function() {
      const schema = getChartSchema(type);
      const mapping = {};
      for (const field of schema.required_mappings) mapping[field] = field;
      const transform = schema.valid_transforms[0] || "identity";

      const result = validateSpec({ type, mapping, transform });

      expect(schema.required_mappings.every((f) => typeof f === "string")).toBe(true);
      expect(result).toEqual({ valid: true, errors: [] });
    });
  }
});

describe("MCP validateSpec — issue #52 repro", function() {
  test("histogram with only `value` does not split the string into characters", function() {
    const result = validateSpec({
      type: "histogram",
      mapping: { value: "mag" },
      transform: "identity"
    });
    expect(result.valid).toBe(true);
  });

  test("a genuinely missing single mapping reports exactly one error", function() {
    const result = validateSpec({ type: "histogram", mapping: {}, transform: "identity" });
    expect(result.valid).toBe(false);
    const missing = result.errors.filter((e) => e.code === "MISSING_MAPPING");
    expect(missing).toHaveLength(1);
    expect(missing[0].field).toBe("value");
  });
});

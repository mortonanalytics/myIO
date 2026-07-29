import { describe, expect, test } from "vitest";
import fixture from "../fixtures/spec-contract.json";
import { validateAgainstContract, validateComposition, validateSpecContract } from "../../inst/htmlwidgets/myIO/src/derive/validate.js";
import { WaterfallRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/WaterfallRenderer.js";

function waterfallLayer(totalValue) {
  return {
    label: "Revenue Bridge",
    mapping: { x_var: "step", y_var: "value" },
    data: [
      { step: "Start", value: 100, _base_y: 0, _cumulative_y: 100, _is_total: false },
      { step: "Up", value: 35, _base_y: 100, _cumulative_y: 135, _is_total: false },
      { step: "Down", value: -15, _base_y: 135, _cumulative_y: 120, _is_total: false },
      { step: "Down", value: -10, _base_y: 120, _cumulative_y: 110, _is_total: false },
      { step: "End", value: totalValue, _base_y: 0, _cumulative_y: 110, _is_total: true }
    ]
  };
}

describe("validate", function() {
  test("compatibility matrix allows and blocks expected combos", function() {
    expect(validateComposition([{ type: "line" }, { type: "point" }]).valid).toBe(true);
    expect(validateComposition([{ type: "histogram" }, { type: "line" }]).valid).toBe(true);
    expect(validateComposition([{ type: "boxplot" }]).valid).toBe(true);
    expect(validateComposition([{ type: "boxplot" }, { type: "line" }]).valid).toBe(true);
    expect(validateComposition([{ type: "treemap" }, { type: "bar" }]).valid).toBe(false);
  });

  test("spec contract validator checks required layer fields", function() {
    const errors = validateSpecContract(
      {
        specVersion: 1,
        layers: [{ id: "layer_001", type: "line", label: "series", mapping: {}, data: [], transform: "identity", transformMeta: {}, encoding: {}, sourceKey: "_source_key", derivedFrom: null, order: 1, visibility: true }]
      },
      fixture.requiredLayerFields
    );

    expect(errors).toEqual([]);
  });

  test("a waterfall total row carrying a materialised value emits no null/NaN warning", function() {
    const result = validateAgainstContract(waterfallLayer(110), WaterfallRenderer.dataContract);

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test("the validator still warns when a total row ships a genuine null", function() {
    const result = validateAgainstContract(waterfallLayer(null), WaterfallRenderer.dataContract);

    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("contains 1 null/NaN values");
  });

  test("a materialised total row keeps the tooltip free of the literal 'null'", function() {
    const layer = waterfallLayer(110);
    const totalRow = layer.data[4];
    const body = new WaterfallRenderer().formatTooltip({}, totalRow, layer).body;

    expect(body).toBe("Delta: 110, Total: 110");
    expect(body).not.toContain("null");
    // What the same row produced while the transform shipped its NA through.
    const stale = waterfallLayer(null);
    expect(new WaterfallRenderer().formatTooltip({}, stale.data[4], stale).body)
      .toBe("Delta: null, Total: 110");
  });
});

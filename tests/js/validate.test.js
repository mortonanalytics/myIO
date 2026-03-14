import { describe, expect, test } from "vitest";
import fixture from "../fixtures/spec-contract.json";
import { validateComposition, validateSpecContract } from "../../inst/htmlwidgets/myIO/src/derive/validate.js";

describe("validate", function() {
  test("compatibility matrix allows and blocks expected combos", function() {
    expect(validateComposition([{ type: "line" }, { type: "point" }]).valid).toBe(true);
    expect(validateComposition([{ type: "histogram" }, { type: "line" }]).valid).toBe(true);
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
});

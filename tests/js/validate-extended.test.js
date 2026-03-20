import { describe, expect, test, beforeEach } from "vitest";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";
import {
  validateComposition,
  validateAgainstContract,
  validateSpecContract,
  validateLayers
} from "../../inst/htmlwidgets/myIO/src/derive/validate.js";

describe("validateComposition extended", function() {
  test("single layer is always valid", function() {
    expect(validateComposition([{ type: "treemap" }]).valid).toBe(true);
    expect(validateComposition([{ type: "gauge" }]).valid).toBe(true);
    expect(validateComposition([{ type: "donut" }]).valid).toBe(true);
  });

  test("empty layers is valid", function() {
    expect(validateComposition([]).valid).toBe(true);
  });

  test("standalone mixed with any type is invalid", function() {
    expect(validateComposition([{ type: "treemap" }, { type: "line" }]).valid).toBe(false);
    expect(validateComposition([{ type: "gauge" }, { type: "point" }]).valid).toBe(false);
    expect(validateComposition([{ type: "donut" }, { type: "bar" }]).valid).toBe(false);
  });

  test("two standalones are invalid", function() {
    var result = validateComposition([{ type: "treemap" }, { type: "donut" }]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("continuous + categorical is valid", function() {
    expect(validateComposition([{ type: "line" }, { type: "bar" }]).valid).toBe(true);
    expect(validateComposition([{ type: "point" }, { type: "groupedBar" }]).valid).toBe(true);
  });

  test("continuous + binned is valid", function() {
    expect(validateComposition([{ type: "line" }, { type: "histogram" }]).valid).toBe(true);
    expect(validateComposition([{ type: "histogram" }, { type: "point" }]).valid).toBe(true);
    expect(validateComposition([{ type: "ridgeline" }, { type: "line" }]).valid).toBe(true);
  });

  test("hexbin + other axes types is invalid", function() {
    expect(validateComposition([{ type: "hexbin" }, { type: "line" }]).valid).toBe(false);
    expect(validateComposition([{ type: "hexbin" }, { type: "bar" }]).valid).toBe(false);
  });

  test("categorical + binned is invalid", function() {
    expect(validateComposition([{ type: "bar" }, { type: "histogram" }]).valid).toBe(false);
  });

  test("unknown type maps to unknown group", function() {
    var result = validateComposition([{ type: "unknown" }, { type: "line" }]);
    expect(result.valid).toBe(false);
  });
});

describe("validateAgainstContract", function() {
  test("returns no errors for valid layer", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 2 }, { x: 2, y: 4 }]
    };
    var contract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors).toEqual([]);
  });

  test("returns error for missing required field", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x" },
      data: [{ x: 1 }]
    };
    var contract = { x_var: { required: true }, y_var: { required: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain("y_var");
  });

  test("returns error for non-numeric data", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: "abc" }]
    };
    var contract = { x_var: { required: true }, y_var: { required: true, numeric: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0]).toContain("numeric");
  });

  test("returns error for non-positive data", function() {
    var layer = {
      label: "test",
      mapping: { radius: "r" },
      data: [{ r: -5 }]
    };
    var contract = { radius: { required: true, numeric: true, positive: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(function(e) { return e.includes("positive"); })).toBe(true);
  });

  test("returns warning for unsorted data", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x" },
      data: [{ x: 3 }, { x: 1 }, { x: 2 }]
    };
    var contract = { x_var: { required: true, sorted: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain("sorted");
  });

  test("returns no issues when contract is null", function() {
    var result = validateAgainstContract({ label: "test" }, null);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  test("skips optional fields when not mapped", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x" },
      data: [{ x: 1 }]
    };
    var contract = { x_var: { required: true }, group: { required: false } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors).toEqual([]);
  });

  test("warns on null/NaN values", function() {
    var layer = {
      label: "test",
      mapping: { x_var: "x" },
      data: [{ x: null }, { x: 1 }]
    };
    var contract = { x_var: { required: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.warnings.some(function(w) { return w.includes("null/NaN"); })).toBe(true);
  });

  test("handles numeric mapping value (non-string)", function() {
    var layer = {
      label: "test",
      mapping: { radius: 20 },
      data: [{ x: 1 }]
    };
    var contract = { radius: { required: true, numeric: true, positive: true } };
    var result = validateAgainstContract(layer, contract);
    expect(result.errors).toEqual([]);
  });
});

describe("validateSpecContract extended", function() {
  test("returns error for missing specVersion", function() {
    var errors = validateSpecContract({ layers: [] }, []);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("specVersion");
  });

  test("returns error for wrong specVersion", function() {
    var errors = validateSpecContract({ specVersion: 2, layers: [] }, []);
    expect(errors.length).toBe(1);
  });

  test("returns errors for missing layer fields", function() {
    var errors = validateSpecContract(
      { specVersion: 1, layers: [{ label: "test", type: "line" }] },
      ["id", "type", "label", "mapping"]
    );
    expect(errors.length).toBe(2); // missing id and mapping
  });

  test("returns empty for valid spec", function() {
    var errors = validateSpecContract(
      { specVersion: 1, layers: [{ id: "l1", type: "line", label: "s" }] },
      ["id", "type", "label"]
    );
    expect(errors).toEqual([]);
  });

  test("handles empty config object", function() {
    var errors = validateSpecContract({}, []);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain("specVersion");
  });
});

describe("validateLayers integration", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("returns valid layers for valid composition", function() {
    var chart = {
      derived: {
        currentLayers: [
          {
            type: "line",
            label: "trend",
            mapping: { x_var: "x", y_var: "y" },
            data: [{ x: 1, y: 2 }, { x: 2, y: 4 }]
          }
        ]
      },
      config: { layers: [] },
      emit: function() {}
    };
    var result = validateLayers(chart);
    expect(result.length).toBe(1);
  });

  test("returns empty for invalid composition", function() {
    var emitted = [];
    var chart = {
      derived: {
        currentLayers: [
          { type: "treemap", label: "tree" },
          { type: "bar", label: "bars" }
        ]
      },
      config: { layers: [] },
      emit: function(type, data) { emitted.push(data); }
    };
    var result = validateLayers(chart);
    expect(result).toEqual([]);
    expect(emitted.length).toBeGreaterThan(0);
  });

  test("filters out layers with contract errors", function() {
    var emitted = [];
    var chart = {
      derived: {
        currentLayers: [
          {
            type: "point",
            label: "pts",
            mapping: {},  // missing required x_var, y_var
            data: []
          }
        ]
      },
      config: { layers: [] },
      emit: function(type, data) { emitted.push(data); }
    };
    var result = validateLayers(chart);
    expect(result.length).toBe(0);
    expect(emitted.length).toBeGreaterThan(0);
  });
});

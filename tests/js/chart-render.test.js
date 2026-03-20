import { describe, expect, test, beforeEach } from "vitest";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";
import {
  getPrimaryType,
  isAxesChart,
  usesHistogramBins,
  usesContinuousLegend,
  usesOrdinalLegend,
  needsReferenceLines,
  deriveChartRender
} from "../../inst/htmlwidgets/myIO/src/derive/chart-render.js";

describe("chart-render utility functions", function() {
  test("getPrimaryType returns null when no layers", function() {
    expect(getPrimaryType({})).toBeNull();
    expect(getPrimaryType({ currentLayers: [] })).toBeNull();
  });

  test("getPrimaryType returns first layer type", function() {
    expect(getPrimaryType({ currentLayers: [{ type: "line" }, { type: "point" }] })).toBe("line");
  });

  test("isAxesChart returns false for standalone types", function() {
    expect(isAxesChart("treemap")).toBe(false);
    expect(isAxesChart("gauge")).toBe(false);
    expect(isAxesChart("donut")).toBe(false);
  });

  test("isAxesChart returns true for axes types", function() {
    expect(isAxesChart("line")).toBe(true);
    expect(isAxesChart("point")).toBe(true);
    expect(isAxesChart("bar")).toBe(true);
    expect(isAxesChart("area")).toBe(true);
    expect(isAxesChart("histogram")).toBe(true);
    expect(isAxesChart("hexbin")).toBe(true);
    expect(isAxesChart("groupedBar")).toBe(true);
  });

  test("usesHistogramBins only true for histogram", function() {
    expect(usesHistogramBins("histogram")).toBe(true);
    expect(usesHistogramBins("bar")).toBe(false);
    expect(usesHistogramBins("line")).toBe(false);
  });

  test("usesContinuousLegend only true for hexbin", function() {
    expect(usesContinuousLegend("hexbin")).toBe(true);
    expect(usesContinuousLegend("heatmap")).toBe(true);
    expect(usesContinuousLegend("line")).toBe(false);
  });

  test("usesOrdinalLegend true for treemap and donut", function() {
    expect(usesOrdinalLegend("treemap")).toBe(true);
    expect(usesOrdinalLegend("donut")).toBe(true);
    expect(usesOrdinalLegend("bar")).toBe(false);
  });

  test("needsReferenceLines for supported types", function() {
    expect(needsReferenceLines("bar")).toBe(true);
    expect(needsReferenceLines("groupedBar")).toBe(true);
    expect(needsReferenceLines("line")).toBe(true);
    expect(needsReferenceLines("point")).toBe(true);
    expect(needsReferenceLines("area")).toBe(true);
    expect(needsReferenceLines("candlestick")).toBe(true);
    expect(needsReferenceLines("treemap")).toBe(false);
    expect(needsReferenceLines("donut")).toBe(false);
    expect(needsReferenceLines("gauge")).toBe(false);
    expect(needsReferenceLines("histogram")).toBe(false);
    expect(needsReferenceLines("hexbin")).toBe(false);
  });
});

describe("deriveChartRender", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("derives correct state for line layers", function() {
    var chart = { derived: { currentLayers: [{ type: "line" }] } };
    var state = deriveChartRender(chart);
    expect(state.type).toBe("line");
    expect(state.axesChart).toBe(true);
    expect(state.histogram).toBe(false);
    expect(state.continuousLegend).toBe(false);
    expect(state.ordinalLegend).toBe(false);
    expect(state.referenceLines).toBe(true);
  });

  test("derives correct state for histogram layers", function() {
    var chart = { derived: { currentLayers: [{ type: "histogram" }] } };
    var state = deriveChartRender(chart);
    expect(state.histogram).toBe(true);
    expect(state.axesChart).toBe(true);
    expect(state.referenceLines).toBe(false);
  });

  test("derives correct state for hexbin layers", function() {
    var chart = { derived: { currentLayers: [{ type: "hexbin" }] } };
    var state = deriveChartRender(chart);
    expect(state.continuousLegend).toBe(true);
    expect(state.ordinalLegend).toBe(false);
  });

  test("derives correct state for donut layers", function() {
    var chart = { derived: { currentLayers: [{ type: "donut" }] } };
    var state = deriveChartRender(chart);
    expect(state.ordinalLegend).toBe(true);
    expect(state.axesChart).toBe(false);
  });

  test("derives correct state for treemap layers", function() {
    var chart = { derived: { currentLayers: [{ type: "treemap" }] } };
    var state = deriveChartRender(chart);
    expect(state.ordinalLegend).toBe(true);
    expect(state.axesChart).toBe(false);
    expect(state.referenceLines).toBe(false);
  });

  test("derives correct state for mixed line+point layers", function() {
    var chart = { derived: { currentLayers: [{ type: "line" }, { type: "point" }] } };
    var state = deriveChartRender(chart);
    expect(state.type).toBe("line");
    expect(state.axesChart).toBe(true);
    expect(state.referenceLines).toBe(true);
  });

  test("derives correct state for empty layers", function() {
    var chart = { derived: { currentLayers: [] } };
    var state = deriveChartRender(chart);
    expect(state.type).toBeNull();
  });

  test("derives correct state for gauge layers", function() {
    var chart = { derived: { currentLayers: [{ type: "gauge" }] } };
    var state = deriveChartRender(chart);
    expect(state.axesChart).toBe(false);
    expect(state.ordinalLegend).toBe(false);
    expect(state.continuousLegend).toBe(false);
  });
});

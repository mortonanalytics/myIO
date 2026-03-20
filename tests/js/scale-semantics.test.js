import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { resolveScaleSemantics } from "../../inst/htmlwidgets/myIO/src/derive/scale-semantics.js";
import { processScales } from "../../inst/htmlwidgets/myIO/src/derive/scales.js";

globalThis.d3 = d3;

function makeChart(overrides) {
  return Object.assign({
    width: 640,
    height: 480,
    margin: { top: 30, bottom: 60, left: 50, right: 5 },
    config: {
      scales: {
        xlim: { min: null, max: null },
        ylim: { min: null, max: null },
        categoricalScale: { xAxis: false, yAxis: false },
        flipAxis: false,
        colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false }
      }
    },
    derived: {},
    syncLegacyAliases: function() {}
  }, overrides);
}

describe("scale semantics", function() {
  test("heatmap resolves to dual band scales", function() {
    var layer = {
      type: "heatmap",
      label: "cells",
      mapping: { x_var: "x", y_var: "y", value: "value" },
      data: [
        { x: "A", y: "Low", value: 2 },
        { x: "B", y: "High", value: 4 }
      ],
      scaleHints: { xScaleType: "band", yScaleType: "band", yExtentFields: ["value"], domainMerge: "union" }
    };
    var chart = makeChart();
    var semantics = resolveScaleSemantics(chart, [layer]);

    expect(semantics.xScaleType).toBe("band");
    expect(semantics.yScaleType).toBe("band");
    expect(semantics.yExtentFields).toEqual(["value"]);

    processScales(chart, [layer], semantics);
    expect(typeof chart.derived.xScale.bandwidth).toBe("function");
    expect(typeof chart.derived.yScale.bandwidth).toBe("function");
  });

  test("candlestick y extent includes high and low fields", function() {
    var layer = {
      type: "candlestick",
      label: "ohlc",
      mapping: { x_var: "x", open: "open", high: "high", low: "low", close: "close" },
      data: [
        { x: 1, open: 10, high: 20, low: 5, close: 15 },
        { x: 2, open: 30, high: 40, low: 25, close: 35 }
      ],
      scaleHints: {
        xScaleType: "linear",
        yScaleType: "linear",
        yExtentFields: ["open", "high", "low", "close"],
        domainMerge: "union"
      }
    };
    var chart = makeChart();
    var semantics = resolveScaleSemantics(chart, [layer]);

    processScales(chart, [layer], semantics);
    var domain = chart.derived.yScale.domain();

    expect(domain[0]).toBeLessThanOrEqual(5);
    expect(domain[1]).toBeGreaterThanOrEqual(40);
  });

  test("mismatched scale types across layers throw a validation error", function() {
    var heatmapLayer = {
      type: "heatmap",
      label: "cells",
      mapping: { x_var: "x", y_var: "y", value: "value" },
      data: [{ x: "A", y: "B", value: 1 }],
      scaleHints: { xScaleType: "band", yScaleType: "band", yExtentFields: ["value"], domainMerge: "union" }
    };
    var lineLayer = {
      type: "line",
      label: "trend",
      mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 2 }],
      scaleHints: { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" }
    };
    var chart = makeChart();

    expect(function() {
      resolveScaleSemantics(chart, [heatmapLayer, lineLayer]);
    }).toThrow(/Mismatched scaleTypes/);
  });
});

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

function barLayer() {
  return {
    type: "bar",
    label: "sales",
    mapping: { x_var: "region", y_var: "sales" },
    data: [{ region: "A", sales: 0 }, { region: "B", sales: 510 }]
  };
}

describe("y domain padding", function() {
  test("regression y domain does not overshoot a near-zero minimum", function() {
    var pts = {
      type: "point",
      label: "pts",
      mapping: { x_var: "x", y_var: "y" },
      data: [
        { x: 1, y: 0.4181835961073048 },
        { x: 40, y: 35.83393362307351 }
      ]
    };
    var band = {
      type: "area",
      label: "ci",
      mapping: { x_var: "x", low_y: "low_y", high_y: "high_y" },
      scaleHints: {
        xScaleType: "linear",
        yScaleType: "linear",
        yExtentFields: ["low_y", "high_y"],
        domainMerge: "union"
      },
      data: [
        { x: 1, low_y: -0.3562001449330974, high_y: 5.970091866138727 },
        { x: 40, low_y: 27.06724565326316, high_y: 33.39353766433499 }
      ]
    };
    var chart = makeChart();
    processScales(chart, [pts, band], resolveScaleSemantics(chart, [pts, band]));
    var dom = chart.derived.yScale.domain();
    expect(dom[0]).toBeCloseTo(-2.1657, 3);
    expect(dom[1]).toBeCloseTo(37.6434, 3);
    expect(d3.scaleLinear().domain(dom).ticks(10).every(function(t) {
      return t >= 0;
    })).toBe(true);
  });

  test("non-negative data never gets a negative y domain", function() {
    var bars = barLayer();
    var chart = makeChart();
    processScales(chart, [bars], resolveScaleSemantics(chart, [bars]));
    expect(chart.derived.yScale.domain()[0]).toBe(0);
    expect(chart.derived.yScale.domain()[1]).toBeCloseTo(535.5, 3);
  });

  test("explicit ylim still wins", function() {
    var bars = barLayer();
    var chart = makeChart();
    chart.config.scales.ylim = { min: -10, max: 100 };
    processScales(chart, [bars], resolveScaleSemantics(chart, [bars]));
    expect(chart.derived.yScale.domain()).toEqual([-10, 100]);
  });

  test("genuinely negative data keeps its padded negative bound", function() {
    var layer = {
      type: "line",
      label: "delta",
      mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: -20 }, { x: 2, y: 80 }]
    };
    var chart = makeChart();
    processScales(chart, [layer], resolveScaleSemantics(chart, [layer]));
    expect(chart.derived.yScale.domain()[0]).toBeCloseTo(-25, 6);
    expect(chart.derived.yScale.domain()[1]).toBeCloseTo(85, 6);
  });
});

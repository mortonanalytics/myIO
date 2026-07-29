import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

// jsdom does not implement SVGGraphicsElement.transform, which d3-interpolate
// reads to tween a "transform" attribute. Without it any transitioned axis
// throws on the first animation frame. An empty baseVal makes the interpolator
// fall back to its identity start, which is all these tests need.
if (typeof SVGElement !== "undefined" && !("transform" in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, "transform", {
    get: function() {
      return { baseVal: { consolidate: function() { return null; } } };
    }
  });
}

function groupedLayer(id, label, color, order) {
  return {
    id: id,
    type: "groupedBar",
    label: label,
    data: [
      { q: "Q1", rev: 500000, series: label },
      { q: "Q2", rev: 500000, series: label }
    ],
    mapping: { x_var: "q", y_var: "rev", group: "series" },
    options: {},
    transform: "identity",
    transformMeta: {},
    encoding: {},
    sourceKey: "_source_key",
    derivedFrom: null,
    order: order,
    visibility: true,
    color: color
  };
}

function buildChart() {
  return new myIOchart({
    element: document.getElementById("chart"),
    width: 876,
    height: 500,
    config: {
      specVersion: 1,
      layers: [
        groupedLayer("layer_001", "North", "#E69F00", 1),
        groupedLayer("layer_002", "South", "#56B4E9", 2),
        groupedLayer("layer_003", "West", "#009E73", 3)
      ],
      layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
      scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: true, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
      axes: { xAxisFormat: "s", yAxisFormat: "$,.0f", xAxisLabel: null, yAxisLabel: "Revenue", toolTipFormat: "s" },
      interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
      theme: {},
      transitions: { speed: 0 },
      referenceLines: { x: null, y: null }
    }
  });
}

describe("grouped/stacked layout left-margin fit", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("toggling to the stacked layout re-fits the left margin", function() {
    var chart = buildChart();
    var grouped = chart.config.layout.margin.left;

    // The stacked total carries a digit group the grouped scale never showed,
    // so the tick labels get wider than the fit that ran before the bars drew.
    chart.toggleGroupedLayout(chart.derived.currentLayers);

    expect(chart.runtime.layout).toBe("stacked");
    expect(chart.config.layout.margin.left).toBeGreaterThan(grouped);
  });

  test("toggling back and forth converges instead of ratcheting", function() {
    var chart = buildChart();
    var grouped = chart.config.layout.margin.left;

    chart.toggleGroupedLayout(chart.derived.currentLayers);
    var stacked = chart.config.layout.margin.left;

    chart.toggleGroupedLayout(chart.derived.currentLayers);
    expect(chart.runtime.layout).toBe("grouped");
    expect(chart.config.layout.margin.left).toBe(grouped);

    chart.toggleGroupedLayout(chart.derived.currentLayers);
    expect(chart.config.layout.margin.left).toBe(stacked);
  });
});

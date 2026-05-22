import * as d3 from "d3";
import { describe, expect, test, beforeEach } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { buildLegendData } from "../../inst/htmlwidgets/myIO/src/layout/legend-data.js";
import { getRenderer, registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function baseConfig(layers) {
  return {
    specVersion: 1,
    layers: layers,
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: "Species", yAxisLabel: "Sepal Width", toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  };
}

function quantileLayer() {
  var rows = [];
  ["setosa", "versicolor", "virginica"].forEach(function(species, speciesIndex) {
    for (var rank = 1; rank <= 20; rank += 1) {
      rows.push({
        Species: species,
        value: 2 + speciesIndex + rank / 20,
        quantile_rank: rank,
        threshold_relationship: rank < 8 ? "below" : "above",
        _source_key: species + "_" + rank
      });
    }
  });
  return {
    id: "layer_001",
    type: "quantile_dots",
    label: "Sepal width dots",
    data: rows,
    mapping: { x_var: "Species", y_var: "value", quantile_rank: "quantile_rank", threshold_relationship: "threshold_relationship" },
    options: { n: 20, source: "empirical", threshold: 3 },
    transform: "quantile_dots",
    transformMeta: {},
    encoding: {},
    sourceKey: "_source_key",
    derivedFrom: null,
    order: 1,
    visibility: true,
    color: "#E69F00"
  };
}

describe("quantile dots renderer", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("renders accessible quantile dot symbols and frequency chart label", function() {
    new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig([quantileLayer()])
    });

    var dots = document.querySelectorAll(".tag-quantile_dots-layer_001 [role='graphics-symbol']");
    expect(dots.length).toBe(60);
    expect(dots[0].getAttribute("aria-label")).toMatch(/^Q1 of 20: [0-9.]+/);
    expect(document.querySelector("#chart svg").getAttribute("aria-label")).toMatch(/\d+ of 20 .*below threshold of 3/);
  });

  test("tooltip and legend expose source", function() {
    var layer = quantileLayer();
    var renderer = getRenderer("quantile_dots");
    var tooltip = renderer.formatTooltip({ runtime: {} }, layer.data[0], layer);
    expect(tooltip.items[0].label).toContain("empirical");

    var legend = buildLegendData({ plotLayers: [layer], currentLayers: [layer], options: {} });
    expect(legend.items[0].label).toContain("empirical");
  });
});

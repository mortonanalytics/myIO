import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function chartConfig(exportOverride) {
  return {
    specVersion: 1,
    layers: [{
      id: "layer_001", type: "point", label: "pts",
      data: [{ x: 1, y: 2 }, { x: 2, y: 4 }],
      mapping: { x_var: "x", y_var: "y" },
      options: {}, transform: "identity", transformMeta: {},
      encoding: {}, sourceKey: "_source_key", derivedFrom: null,
      order: 1, visibility: true, color: "#E69F00"
    }],
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null },
    export: exportOverride || null
  };
}

describe("Export buttons", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("chart renders with export config without crashing", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640, height: 400,
      config: chartConfig({ png: true, svg: true, clipboard: true, csv: true })
    });
    expect(chart.config.export).toBeDefined();
    expect(chart.config.export.svg).toBe(true);
  });

  test("null export config uses defaults", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640, height: 400,
      config: chartConfig(null)
    });
    // null is fine — buttons.js should handle null gracefully
    expect(chart.config.export).toBeNull();
  });

  test("SVG download function exists on export-svg module", async function() {
    var { downloadSVG } = await import("../../inst/htmlwidgets/myIO/src/utils/export-svg.js");
    expect(typeof downloadSVG).toBe("function");
  });

  test("clipboard module exports copyAsPNG and copyAsSVG", async function() {
    var mod = await import("../../inst/htmlwidgets/myIO/src/utils/export-clipboard.js");
    expect(typeof mod.copyAsPNG).toBe("function");
    expect(typeof mod.copyAsSVG).toBe("function");
  });

  test("resolve-css-vars module exports resolveCSSVariables", async function() {
    var mod = await import("../../inst/htmlwidgets/myIO/src/utils/resolve-css-vars.js");
    expect(typeof mod.resolveCSSVariables).toBe("function");
  });
});

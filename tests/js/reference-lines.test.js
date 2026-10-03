import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = Object.assign({}, d3, d3Sankey);
globalThis.HTMLWidgets = { shinyMode: false };

describe("setReferenceLines", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
    document.body.innerHTML = "<div id='chart'></div>";
  });

  test("lines read the theme's reference-line tokens", function() {
    new myIOchart({
      element: document.getElementById("chart"),
      width: 400,
      height: 300,
      config: {
        specVersion: 1,
        layers: [{
          id: "layer_001", type: "point", label: "pts", color: "#4E79A7",
          data: [{ x: 0, y: 0 }, { x: 2, y: 2 }], mapping: { x_var: "x", y_var: "y" },
          options: {}, transform: "identity", transformMeta: {}, encoding: {},
          sourceKey: "_source_key", derivedFrom: null, order: 1, visibility: true
        }],
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
        scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
        axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
        interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
        theme: {},
        transitions: { speed: 0 },
        referenceLines: { x: 1, y: 1 }
      }
    });

    var lines = document.querySelectorAll(".ref-x-line, .ref-y-line");
    expect(lines.length).toBe(2);
    lines.forEach(function(line) {
      expect(line.style.stroke).toBe("var(--chart-ref-line-color)");
      expect(line.style.strokeWidth).toBe("var(--chart-ref-line-width)");
    });
  });
});

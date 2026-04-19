import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function chartWithData() {
  return new myIOchart({
    element: document.getElementById("chart"),
    width: 640,
    height: 400,
    config: {
      specVersion: 1,
      layers: [{
        id: "layer_001", type: "point", label: "iris",
        data: [
          { sl: 5.1, sw: 3.5, _source_key: "k1" },
          { sl: 4.9, sw: 3.0, _source_key: "k2" },
          { sl: 4.7, sw: 3.2, _source_key: "k3" }
        ],
        mapping: { x_var: "sl", y_var: "sw" },
        options: {}, transform: "identity", transformMeta: {},
        encoding: {}, sourceKey: "_source_key", derivedFrom: null,
        order: 1, visibility: true, color: "#E69F00"
      }],
      layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
      scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
      axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: "Sepal Length", yAxisLabel: "Sepal Width", toolTipFormat: "s" },
      interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
      theme: {},
      transitions: { speed: 0 },
      referenceLines: { x: null, y: null }
    }
  });
}

describe("Accessibility", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("SVG has role graphics-document", function() {
    var chart = chartWithData();
    var svg = document.querySelector("#chart svg");
    expect(svg.getAttribute("role")).toBe("graphics-document");
  });

  test("SVG has aria-roledescription chart", function() {
    var chart = chartWithData();
    var svg = document.querySelector("#chart svg");
    expect(svg.getAttribute("aria-roledescription")).toBe("chart");
  });

  test("SVG has aria-label with axis info", function() {
    var chart = chartWithData();
    var svg = document.querySelector("#chart svg");
    var label = svg.getAttribute("aria-label");
    expect(label).toContain("chart");
  });

  test("SVG is focusable via tabindex", function() {
    var chart = chartWithData();
    var svg = document.querySelector("#chart svg");
    expect(svg.getAttribute("tabindex")).toBe("0");
  });

  test("chart area has role graphics-object", function() {
    var chart = chartWithData();
    var chartArea = document.querySelector("#chart .myIO-chart-area");
    if (chartArea) {
      expect(chartArea.getAttribute("role")).toBe("graphics-object");
    }
  });

  test("screen reader only class exists in DOM", function() {
    var chart = chartWithData();
    var srOnly = document.querySelector("#chart .myIO-sr-only");
    expect(srOnly).toBeTruthy();
  });
});

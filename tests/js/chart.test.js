import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

describe("Chart", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("constructor accepts specVersion config without crashing", function() {
    const chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: {
        specVersion: 1,
        layers: [],
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
        scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
        axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
        interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
        theme: {},
        transitions: { speed: 0 },
        referenceLines: { x: null, y: null }
      }
    });

    expect(chart.config.specVersion).toBe(1);
    expect(chart.runtime.width).toBe(640);
  });

  test("updateRegression refreshes lm line layers from point data", function() {
    const chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: {
        specVersion: 1,
        layers: [
          {
            id: "layer_001",
            type: "point",
            label: "points",
            data: [{ wt: 1, mpg: 2 }, { wt: 2, mpg: 4 }],
            mapping: { x_var: "wt", y_var: "mpg" },
            options: {},
            transform: "identity",
            transformMeta: {},
            encoding: {},
            sourceKey: "_source_key",
            derivedFrom: null,
            order: 1,
            visibility: true,
            color: "#E69F00"
          },
          {
            id: "layer_002",
            type: "line",
            label: "trend",
            data: [{ wt: 1, mpg: 0 }, { wt: 2, mpg: 0 }],
            mapping: { x_var: "wt", y_var: "mpg" },
            options: {},
            transform: "lm",
            transformMeta: {},
            encoding: {},
            sourceKey: "_source_key",
            derivedFrom: null,
            order: 2,
            visibility: true,
            color: "#D55E00"
          }
        ],
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
        scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
        axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
        interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
        theme: {},
        transitions: { speed: 0 },
        referenceLines: { x: null, y: null }
      }
    });

    chart.updateRegression("#D55E00", "points");
    expect(chart.config.layers[1].data[0].mpg).toBe(2);
    expect(chart.config.layers[1].data[1].mpg).toBe(4);
  });

  test("renderEmptyState hides the FAB and clearEmptyState restores it", function() {
    const chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: {
        specVersion: 1,
        layers: [
          {
            id: "layer_001",
            type: "point",
            label: "points",
            data: [{ wt: 1, mpg: 2 }],
            mapping: { x_var: "wt", y_var: "mpg" },
            options: {},
            transform: "identity",
            transformMeta: {},
            encoding: {},
            sourceKey: "_source_key",
            derivedFrom: null,
            order: 1,
            visibility: true,
            color: "#E69F00"
          }
        ],
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
        scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
        axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
        interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
        theme: {},
        transitions: { speed: 0 },
        referenceLines: { x: null, y: null }
      }
    });

    expect(chart.element.querySelector(".myIO-fab")).toBeTruthy();

    chart.renderEmptyState();
    expect(chart.element.querySelector(".myIO-fab").style.display).toBe("none");

    chart.clearEmptyState();
    expect(chart.element.querySelector(".myIO-fab").style.display).not.toBe("none");
  });
});

import * as d3 from "d3";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";
import "./support/jsdom-svg-transform.js";

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

  test("chart.element and chart.dom.element stay the same node across the render lifecycle", function() {
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

    // Renderers read chart.element.id when they draw and chart.dom.element.id
    // when they remove. That asymmetry is only harmless while the two are the
    // same node; if a future refactor reassigns dom.element without re-running
    // syncLegacyAliases, every remove() would silently stop matching.
    expect(chart.element).toBe(chart.dom.element);

    chart.syncLegacyAliases();
    expect(chart.element).toBe(chart.dom.element);

    chart.captureLegacyAliases();
    expect(chart.element).toBe(chart.dom.element);

    chart.renderCurrentLayers();
    expect(chart.element).toBe(chart.dom.element);

    chart.updateData([{ label: "points", data: [{ wt: 3, mpg: 6 }, { wt: 4, mpg: 8 }] }]);
    expect(chart.element).toBe(chart.dom.element);
  });
});

function stabilityChart(labels = ["A"], options = {}, layerOptions = {}) {
  return new myIOchart({
    element: document.getElementById("chart"), width: 640, height: 400,
    config: {
      specVersion: 1,
      layers: labels.map((label) => ({ type: "point", label, data: [{ x: 1, y: 2 }], mapping: { x_var: "x", y_var: "y" }, options: { ...layerOptions }, color: "#444" })),
      layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: true, suppressAxis: { xAxis: false, yAxis: false } },
      scales: { xlim: { min: 0, max: 10 }, ylim: { min: 0, max: 10 }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { enabled: false } },
      axes: { xAxisFormat: "s", yAxisFormat: "s", toolTipFormat: "s" },
      interactions: { dragPoints: false, toggleY: {}, toolTipOptions: {}, ...options },
      theme: {}, transitions: { speed: 0 }, referenceLines: { x: null, y: null }
    }
  });
}

describe("chart stability regressions", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });
  test("restoring all hidden layers retains clipping definitions", () => {
    const chart = stabilityChart();
    chart.derived.currentLayers = [];
    chart.renderCurrentLayers();
    chart.derived.currentLayers = chart.config.layers;
    chart.renderCurrentLayers();
    expect(document.getElementById("chartclip")).not.toBeNull();
    expect(document.querySelector("circle.tag-point-chart-A")).not.toBeNull();
    chart.destroy();
  });
  test.each(["A+B", "O'Reilly", "A"])("hides exactly the layer %s", (label) => {
    const neighborLabel = label === "A" ? "foo-chart-A" : "AB-extra";
    const chart = stabilityChart([label, neighborLabel]);
    const neighbor = chart.chart.select(".tag-point-chart-" + neighborLabel).node();
    chart.derived.currentLayers = [chart.config.layers[1]];
    expect(() => chart.renderCurrentLayers()).not.toThrow();
    expect(chart.chart.selectAll("circle").size()).toBe(1);
    expect(chart.chart.select("circle").attr("class")).toBe("tag-point-chart-" + neighborLabel);
    expect(chart.chart.select("circle").node()).toBe(neighbor);
    chart.destroy();
  });
  test("punctuated opacity does not affect a label prefix neighbor", () => {
    const chart = stabilityChart(["A+B", "AB-extra"]);
    d3.timerFlush();
    chart.config.layers[0].options.opacity = 0.3;
    chart.routeLayers(chart.config.layers);
    expect(chart.chart.select(".tag-point-chart-AB").style("opacity")).toBe("0.3");
    expect(chart.chart.select(".tag-point-chart-AB-extra").style("opacity")).toBe("1");
    chart.destroy();
  });
  test("pending drag regression updates tolerate destruction", () => {
    vi.useFakeTimers();
    try {
      const chart = stabilityChart(["A"], { dragPoints: true });
      chart.destroy();
      expect(() => vi.runOnlyPendingTimers()).not.toThrow();
    } finally { vi.useRealTimers(); }
  });
});

 test("yearMon formats negative R days and zero consistently", () => {
   document.body.innerHTML = "<div id='chart'></div>";
   registerBuiltInRenderers();
   const chart = stabilityChart();
   chart.config.axes.xAxisFormat = "yearMon";
   chart.config.scales.xlim = { min: -10, max: 0 };
   chart.syncLegacyAliases();
   chart.renderCurrentLayers({ isInitialRender: true });
   const ticks = chart.plot.selectAll(".x-axis .tick text").nodes().map(n => n.textContent);
   expect(ticks).toContain("Dec 22");
   expect(ticks).toContain("Jan 01");
   chart.destroy();
 });

test("hiding an ID-based renderer removes its root marks", () => {
  document.body.innerHTML = "<div id='chart'></div>";
  registerBuiltInRenderers();
  const chart = stabilityChart(["swarm", "points"]);
  chart.config.layers[0].type = "beeswarm";
  chart.config.layers[0].id = "swarm-layer";
  chart.config.layers[0].options.opacity = 0.3;
  chart.chart.selectAll("circle").remove();
  chart.renderCurrentLayers({ isInitialRender: true });
  expect(chart.chart.select(".tag-beeswarm-swarm-layer").empty()).toBe(false);
  expect(chart.chart.select(".tag-beeswarm-swarm-layer").style("opacity")).toBe("0.3");
  expect(chart.chart.select(".beeswarm-point").node().style.opacity).toBe("");
  chart.derived.currentLayers = [chart.config.layers[1]];
  chart.renderCurrentLayers({ isInitialRender: true });
  expect(chart.chart.select(".tag-beeswarm-swarm-layer").empty()).toBe(true);
  chart.destroy();
});

test("initial opacity survives transitions and resets to one", async () => {
  document.body.innerHTML = "<div id='chart'></div>";
  registerBuiltInRenderers();
  const chart = stabilityChart(["A"], {}, { opacity: 0.3 });
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(chart.chart.select("circle").style("opacity")).toBe("0.3");
  chart.config.layers[0].options.opacity = 1;
  chart.renderCurrentLayers({ isInitialRender: true });
  await new Promise(resolve => setTimeout(resolve, 50));
  expect(chart.chart.select("circle").style("opacity")).toBe("1");
  chart.destroy();
});

import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function baseConfig(overrides) {
  return Object.assign({
    specVersion: 1,
    sparkline: false,
    layers: [],
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  }, overrides);
}

describe("Sparkline mode", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("sparkline config is recognized by Chart constructor", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({ sparkline: true })
    });
    expect(chart.config.sparkline).toBe(true);
  });

  test("sparkline mode suppresses legend", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({ sparkline: true })
    });
    // After sparkline overrides, legend should be suppressed
    expect(chart.config.layout.suppressLegend).toBe(true);
  });

  test("sparkline mode suppresses axes", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({ sparkline: true })
    });
    expect(chart.config.layout.suppressAxis.xAxis).toBe(true);
    expect(chart.config.layout.suppressAxis.yAxis).toBe(true);
  });

  test("sparkline mode sets compact margins", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({ sparkline: true })
    });
    expect(chart.config.layout.margin.top).toBeLessThanOrEqual(2);
    expect(chart.config.layout.margin.bottom).toBeLessThanOrEqual(2);
    expect(chart.config.layout.margin.left).toBeLessThanOrEqual(2);
    expect(chart.config.layout.margin.right).toBeLessThanOrEqual(2);
  });

  test("sparkline mode sets data-sparkline attribute", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({ sparkline: true })
    });
    expect(document.getElementById("chart").dataset.sparkline).toBe("true");
  });

  test("non-sparkline mode does not set data-sparkline", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ sparkline: false })
    });
    expect(document.getElementById("chart").dataset.sparkline).toBeUndefined();
  });

  test("sparkline mode disables interactions", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 100,
      height: 20,
      config: baseConfig({
        sparkline: true,
        interactions: {
          dragPoints: false,
          brush: { enabled: true },
          annotation: { enabled: true },
          linked: { enabled: true },
          sliders: [{ variable: "x" }],
          toggleY: { variable: null, format: null },
          toolTipOptions: { suppressY: false }
        }
      })
    });
    expect(chart.config.interactions.brush.enabled).toBe(false);
    expect(chart.config.interactions.annotation.enabled).toBe(false);
    expect(chart.config.interactions.linked.enabled).toBe(false);
    expect(chart.config.interactions.sliders).toEqual([]);
  });
});

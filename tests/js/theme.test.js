import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function baseConfig(themeOverride) {
  return {
    specVersion: 1,
    layers: [],
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: themeOverride || {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  };
}

describe("Theme system", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  // --- v1.1 backward compat: flat dict ---
  test("v1.1.0 flat theme dict still applies CSS vars", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ "chart-bg": "#1a1a2e", "chart-text-color": "#fff" })
    });
    var el = document.getElementById("chart");
    // ThemeManager normalizes flat dicts and applies as CSS vars
    expect(el.style.getPropertyValue("--chart-bg")).toBe("#1a1a2e");
    expect(el.style.getPropertyValue("--chart-text-color")).toBe("#fff");
  });

  // --- v1.2 nested config ---
  test("dark mode applies DARK palette CSS vars", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ mode: "dark", preset: null, values: {} })
    });
    var el = document.getElementById("chart");
    expect(el.style.getPropertyValue("--chart-bg")).toBe("#1e1e2e");
    expect(el.style.getPropertyValue("--chart-text-color")).toBe("#d1d5db");
  });

  test("light mode applies LIGHT palette CSS vars", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ mode: "light", preset: null, values: {} })
    });
    var el = document.getElementById("chart");
    expect(el.style.getPropertyValue("--chart-bg")).toBe("#ffffff");
    expect(el.style.getPropertyValue("--chart-text-color")).toBe("#6b7280");
  });

  test("user overrides take precedence over palette", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ mode: "dark", preset: null, values: { "--chart-bg": "#000000" } })
    });
    var el = document.getElementById("chart");
    // User override wins over dark palette
    expect(el.style.getPropertyValue("--chart-bg")).toBe("#000000");
    // But other dark palette vars still applied
    expect(el.style.getPropertyValue("--chart-text-color")).toBe("#d1d5db");
  });

  test("data-theme attribute is set on container", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ mode: "dark", preset: null, values: {} })
    });
    expect(document.getElementById("chart").dataset.theme).toBe("dark");
  });

  test("null mode defaults to light", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({ mode: null, preset: null, values: {} })
    });
    var el = document.getElementById("chart");
    expect(el.style.getPropertyValue("--chart-bg")).toBe("#ffffff");
    expect(el.dataset.theme).toBe("light");
  });

  test("empty theme config does not crash", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig({})
    });
    expect(chart.config).toBeDefined();
  });
});

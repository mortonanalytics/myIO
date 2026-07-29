import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { fitTopMargin } from "../../inst/htmlwidgets/myIO/src/layout/axes.js";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function makeChart(totalWidth, overrides) {
  var extra = overrides || {};
  return {
    config: {
      sparkline: extra.sparkline === true,
      layout: {
        margin: { top: 30, bottom: 60, left: 50, right: 5 },
        marginSet: extra.marginSet === true
      }
    },
    runtime: { totalWidth: totalWidth },
    plot: {}
  };
}

var AXES = { axesChart: true };

describe("Floating action button top-margin reservation", function() {
  test("a narrow axes chart reserves the button's band as top margin", function() {
    var chart = makeChart(420);

    expect(fitTopMargin(chart, AXES)).toBe(true);
    expect(chart.config.layout.margin.top).toBe(48);
  });

  // The button is pinned to the same corner on both tiers, so a wide chart is
  // just as capable of drawing a mark underneath it.
  test("a wide axes chart reserves the same band", function() {
    var chart = makeChart(900);

    expect(fitTopMargin(chart, AXES)).toBe(true);
    expect(chart.config.layout.margin.top).toBe(48);
  });

  test("the reservation does not depend on the width tier", function() {
    var narrow = makeChart(420);
    var wide = makeChart(1600);
    fitTopMargin(narrow, AXES);
    fitTopMargin(wide, AXES);

    expect(wide.config.layout.margin.top).toBe(narrow.config.layout.margin.top);
  });

  test("the fit is idempotent", function() {
    var chart = makeChart(420);
    fitTopMargin(chart, AXES);

    expect(fitTopMargin(chart, AXES)).toBe(false);
    expect(chart.config.layout.margin.top).toBe(48);
  });

  test("resizing the container does not re-fit an already reserved band", function() {
    var chart = makeChart(420);
    fitTopMargin(chart, AXES);
    chart.runtime.totalWidth = 900;

    expect(fitTopMargin(chart, AXES)).toBe(false);
    expect(chart.config.layout.margin.top).toBe(48);
  });

  test("a top margin already larger than the band is left alone", function() {
    var chart = makeChart(420);
    chart.config.layout.margin.top = 80;

    expect(fitTopMargin(chart, AXES)).toBe(false);
    expect(chart.config.layout.margin.top).toBe(80);
  });

  test("setMargin() opts the chart out", function() {
    var chart = makeChart(420, { marginSet: true });

    expect(fitTopMargin(chart, AXES)).toBe(false);
    expect(chart.config.layout.margin.top).toBe(30);
  });

  test("sparklines are exempt", function() {
    var chart = makeChart(420, { sparkline: true });

    expect(fitTopMargin(chart, AXES)).toBe(false);
    expect(chart.config.layout.margin.top).toBe(30);
  });

  test("non-axes charts are exempt -- they vacate the band horizontally", function() {
    var chart = makeChart(420);

    expect(fitTopMargin(chart, { axesChart: false })).toBe(false);
    expect(chart.config.layout.margin.top).toBe(30);
  });
});

function renderConfig(overrides) {
  return Object.assign({
    specVersion: 1,
    sparkline: false,
    layers: [{
      id: "l1",
      label: "series",
      type: "line",
      color: "#E69F00",
      mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 2 }, { x: 2, y: 4 }]
    }],
    layout: {
      margin: { top: 30, bottom: 60, left: 50, right: 5 },
      suppressLegend: false,
      suppressAxis: { xAxis: false, yAxis: false }
    },
    scales: {
      xlim: { min: null, max: null },
      ylim: { min: null, max: null },
      categoricalScale: { xAxis: false, yAxis: false },
      flipAxis: false,
      colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false }
    },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  }, overrides);
}

// The unit tests above exercise fitTopMargin in isolation; these prove it is
// actually reached from renderCurrentLayers(), which is what the || -> two-call
// change in Chart.js is for.
describe("Floating action button reservation through the render path", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("a narrow chart lands its plot below the button", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 420,
      height: 300,
      config: renderConfig()
    });

    expect(chart.config.layout.margin.top).toBe(48);
  });

  test("a wide chart lands its plot below the button too", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 900,
      height: 300,
      config: renderConfig()
    });

    expect(chart.config.layout.margin.top).toBe(48);
  });

  test("a narrow chart that called setMargin() is untouched", function() {
    var config = renderConfig();
    config.layout.marginSet = true;
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 420,
      height: 300,
      config: config
    });

    expect(chart.config.layout.margin.top).toBe(30);
  });
});

describe("Floating action button CSS placement", function() {
  test("the button is pinned to the top on every width tier", async function() {
    var fs = await import("fs");
    var css = fs.readFileSync("inst/htmlwidgets/myIO/style.css", "utf8");

    expect(css).toMatch(/\.myIO-fab\s*\{[^}]*top:\s*8px/);
    expect(css).not.toMatch(/\.myIO-fab\s*\{[^}]*bottom:\s*12px/);
    expect(css).not.toContain(".myIO-container:not(.myIO-container--narrow) .myIO-fab");
  });
});

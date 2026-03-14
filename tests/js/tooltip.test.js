import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { sanitize, initializeTooltip, showChartTooltip, hideChartTooltip, removeHoverOverlay, createHoverOverlay } from "../../inst/htmlwidgets/myIO/src/tooltip.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

describe("sanitize", function() {
  test("escapes HTML entities", function() {
    expect(sanitize("<script>alert('xss')</script>")).toBe("&lt;script&gt;alert('xss')&lt;/script&gt;");
  });

  test("preserves normal text", function() {
    expect(sanitize("Hello World")).toBe("Hello World");
  });

  test("escapes ampersands and quotes", function() {
    expect(sanitize("A & B")).toBe("A &amp; B");
  });

  test("handles numeric input", function() {
    expect(sanitize(42)).toBe("42");
  });

  test("handles null/undefined gracefully", function() {
    expect(sanitize(null)).toBe("null");
    expect(sanitize(undefined)).toBe("undefined");
  });
});

describe("initializeTooltip", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
  });

  test("creates tooltip DOM elements", function() {
    var chart = {
      dom: { element: document.getElementById("chart") },
      runtime: {},
      captureLegacyAliases: function() {}
    };
    initializeTooltip(chart);
    expect(chart.dom.tooltip).toBeDefined();
    expect(chart.dom.tooltipTitle).toBeDefined();
    expect(chart.dom.tooltipBody).toBeDefined();
    expect(chart.runtime.tooltipHideTimer).toBeNull();
  });

  test("tooltip has correct ARIA attributes", function() {
    var chart = {
      dom: { element: document.getElementById("chart") },
      runtime: {},
      captureLegacyAliases: function() {}
    };
    initializeTooltip(chart);
    var tooltip = document.querySelector(".toolTip");
    expect(tooltip.getAttribute("role")).toBe("status");
    expect(tooltip.getAttribute("aria-live")).toBe("polite");
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("showChartTooltip", function() {
  var chart;

  beforeEach(function() {
    document.body.innerHTML = "<div id='chart' style='width:400px;height:300px'></div>";
    chart = {
      dom: { element: document.getElementById("chart") },
      runtime: { tooltipHideTimer: null },
      captureLegacyAliases: function() {}
    };
    initializeTooltip(chart);
  });

  test("shows tooltip with title and items", function() {
    showChartTooltip(chart, {
      pointer: [100, 100],
      title: { text: "x: 5" },
      items: [{ color: "red", label: "Series A", value: 42 }]
    });
    expect(chart.dom.tooltip.style("display")).toBe("inline-block");
    expect(chart.dom.tooltip.attr("aria-hidden")).toBe("false");
  });

  test("handles empty items", function() {
    showChartTooltip(chart, {
      pointer: [50, 50],
      title: { text: "Test" },
      items: []
    });
    expect(chart.dom.tooltip.style("display")).toBe("inline-block");
  });

  test("handles missing config gracefully", function() {
    showChartTooltip(chart, {});
    expect(chart.dom.tooltip.style("display")).toBe("inline-block");
  });

  test("does not throw when tooltip is not initialized", function() {
    var emptyChart = { dom: {}, runtime: {} };
    expect(function() {
      showChartTooltip(emptyChart, { pointer: [0, 0] });
    }).not.toThrow();
  });
});

describe("hideChartTooltip", function() {
  test("sets up hide timer", function() {
    document.body.innerHTML = "<div id='chart'></div>";
    var chart = {
      dom: { element: document.getElementById("chart") },
      runtime: { tooltipHideTimer: null },
      captureLegacyAliases: function() {}
    };
    initializeTooltip(chart);
    hideChartTooltip(chart);
    expect(chart.runtime.tooltipHideTimer).not.toBeNull();
  });

  test("does not throw when tooltip not initialized", function() {
    var emptyChart = { dom: {}, runtime: {} };
    expect(function() {
      hideChartTooltip(emptyChart);
    }).not.toThrow();
  });
});

describe("removeHoverOverlay", function() {
  test("removes overlay elements", function() {
    document.body.innerHTML = "<div id='chart'><div class='toolTipBox'></div><div class='toolLine'></div><div class='toolPointLayer'></div></div>";
    var chart = {
      dom: { element: document.getElementById("chart") },
      runtime: {},
      syncLegacyAliases: function() {}
    };
    removeHoverOverlay(chart);
    expect(document.querySelector(".toolTipBox")).toBeNull();
    expect(chart.runtime.toolTipBox).toBeNull();
    expect(chart.runtime.toolLine).toBeNull();
    expect(chart.runtime.toolPointLayer).toBeNull();
  });
});

describe("createHoverOverlay", function() {
  test("creates overlay elements", function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var svg = d3.select(el).select("svg");
    var chartArea = svg.select(".myIO-chart-area");
    var chart = {
      dom: { element: el, svg: svg, chartArea: chartArea },
      runtime: {},
      margin: { left: 10, right: 10, top: 10, bottom: 10 },
      width: 400,
      height: 300,
      syncLegacyAliases: function() {}
    };
    var onMove = function() {};
    var onEnd = function() {};
    createHoverOverlay(chart, onMove, onEnd);
    expect(chart.runtime.toolLine).toBeDefined();
    expect(chart.runtime.toolPointLayer).toBeDefined();
    expect(chart.runtime.toolTipBox).toBeDefined();
  });
});

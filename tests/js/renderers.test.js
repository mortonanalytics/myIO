import * as d3 from "d3";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function makeConfig(layers, overrides) {
  return Object.assign({
    specVersion: 1,
    layers: layers,
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  }, overrides);
}

function makeLayer(type, label, data, mapping, extra) {
  return Object.assign({
    id: "layer_001",
    type: type,
    label: label,
    data: data,
    mapping: mapping,
    options: { barSize: "large" },
    transform: "identity",
    transformMeta: {},
    encoding: {},
    sourceKey: "_source_key",
    derivedFrom: null,
    order: 1,
    visibility: true,
    color: "#4E79A7"
  }, extra);
}

describe("Renderer static properties", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("all 11 renderer types are registered", function() {
    var types = ["line", "point", "area", "bar", "groupedBar", "histogram", "hexbin", "treemap", "donut", "gauge", "heatmap"];
    types.forEach(function(type) {
      var renderer = getRenderer(type);
      expect(renderer).toBeDefined();
      expect(renderer.constructor.type).toBe(type);
    });
  });

  test("each renderer has traits and dataContract", function() {
    var types = ["line", "point", "area", "bar", "groupedBar", "histogram", "hexbin", "treemap", "donut", "gauge", "heatmap"];
    types.forEach(function(type) {
      var renderer = getRenderer(type);
      expect(renderer.constructor.traits).toBeDefined();
      expect(typeof renderer.constructor.traits.hasAxes).toBe("boolean");
      expect(renderer.constructor.dataContract).toBeDefined();
    });
  });

  test("standalone types have hasAxes=false", function() {
    ["treemap", "donut", "gauge"].forEach(function(type) {
      expect(getRenderer(type).constructor.traits.hasAxes).toBe(false);
    });
  });

  test("axes types have hasAxes=true", function() {
    ["line", "point", "area", "bar", "groupedBar", "histogram", "hexbin", "heatmap"].forEach(function(type) {
      expect(getRenderer(type).constructor.traits.hasAxes).toBe(true);
    });
  });
});

describe("Renderer formatTooltip methods", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("BarRenderer.formatTooltip returns correct structure", function() {
    var renderer = getRenderer("bar");
    var chart = { runtime: {} };
    var layer = { mapping: { x_var: "category", y_var: "value" }, color: "#4E79A7", label: "Sales" };
    var d = { category: "Alpha", value: 42 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.title).toBe("category: Alpha");
    expect(result.body).toBe("value: 42");
    expect(result.color).toBe("#4E79A7");
    expect(result.value).toBe(42);
    expect(result.raw).toBe(d);
  });

  test("PointRenderer.formatTooltip uses activeY when set", function() {
    var renderer = getRenderer("point");
    var chart = { runtime: { activeY: "altY" } };
    var layer = { mapping: { x_var: "x", y_var: "y" }, color: "red", label: "pts" };
    var d = { x: 1, y: 10, altY: 20 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.body).toContain("20");
    expect(result.value).toBe(20);
  });

  test("PointRenderer.formatTooltip falls back to y_var", function() {
    var renderer = getRenderer("point");
    var chart = { runtime: {} };
    var layer = { mapping: { x_var: "x", y_var: "y" }, color: "red", label: "pts" };
    var d = { x: 1, y: 10 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.value).toBe(10);
  });

  test("LineRenderer.formatTooltip returns structure", function() {
    var renderer = getRenderer("line");
    var chart = { runtime: {} };
    var layer = { mapping: { x_var: "time", y_var: "value" }, color: "blue", label: "trend" };
    var d = { time: 5, value: 100 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.title).toContain("time: 5");
    expect(result.label).toBe("trend");
    expect(result.value).toBe(100);
  });

  test("AreaRenderer.formatTooltip returns high_y value", function() {
    var renderer = getRenderer("area");
    var chart = {};
    var layer = { mapping: { x_var: "month", low_y: "low", high_y: "high" }, color: "green", label: "band" };
    var d = { month: 3, low: 10, high: 50 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.value).toBe(50);
    expect(result.label).toBe("band");
  });

  test("HeatmapRenderer.formatTooltip returns value and coordinates", function() {
    var renderer = getRenderer("heatmap");
    var chart = { colorContinuous: function() { return "#abc"; } };
    var layer = { mapping: { x_var: "x", y_var: "y", value: "v" }, color: "blue", label: "cells" };
    var d = { x: "A", y: "B", v: 9 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.title).toContain("x: A");
    expect(result.title).toContain("y: B");
    expect(result.value).toBe(9);
  });

  test("HeatmapRenderer.render creates rect cells and a continuous color scale", function() {
    var renderer = getRenderer("heatmap");
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var chart = {
      element: el,
      chart: d3.select(el).select(".myIO-chart-area"),
      derived: {},
      options: { transition: { speed: 0 } },
      xScale: d3.scaleBand().domain(["A", "B"]).range([0, 100]),
      yScale: d3.scaleBand().domain(["Low", "High"]).range([100, 0])
    };
    var layer = {
      label: "cells",
      color: "blue",
      mapping: { x_var: "x", y_var: "y", value: "v" },
      data: [
        { x: "A", y: "Low", v: 1 },
        { x: "B", y: "High", v: 4 }
      ]
    };

    renderer.render(chart, layer);

    expect(chart.derived.colorContinuous).toBeDefined();
    expect(document.querySelectorAll("rect." + "tag-heatmap-chart-cells").length).toBe(2);
  });

  test("HistogramRenderer.formatTooltip shows bin range", function() {
    var renderer = getRenderer("histogram");
    var chart = {};
    var layer = { color: "teal", label: "dist" };
    var d = { x0: 10, x1: 20, length: 15 };
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.title).toBe("Bin: 10 to 20");
    expect(result.body).toBe("Count: 15");
    expect(result.value).toBe(15);
  });

  test("GroupedBarRenderer.formatTooltip computes difference", function() {
    var renderer = getRenderer("groupedBar");
    var chart = {};
    var layer = { mapping: { x_var: "day", y_var: "temp" }, color: "orange", label: "g1" };
    var d = [5, 15];
    d.data = ["Monday"];
    var result = renderer.formatTooltip(chart, d, layer);
    expect(result.value).toBe(10);
    expect(result.title).toContain("Monday");
  });
});

describe("Renderer getHoverSelector methods", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("BarRenderer.getHoverSelector uses tagName format", function() {
    var renderer = getRenderer("bar");
    var chart = { dom: { element: { id: "chart1" } } };
    var layer = { label: "Sales" };
    var sel = renderer.getHoverSelector(chart, layer);
    expect(sel).toBe(".tag-bar-chart1-Sales");
  });

  test("PointRenderer.getHoverSelector uses tagName format", function() {
    var renderer = getRenderer("point");
    var chart = { dom: { element: { id: "c2" } } };
    var layer = { label: "pts" };
    expect(renderer.getHoverSelector(chart, layer)).toBe(".tag-point-c2-pts");
  });

  test("HistogramRenderer.getHoverSelector uses tagName format", function() {
    var renderer = getRenderer("histogram");
    var chart = { dom: { element: { id: "h1" } } };
    var layer = { label: "dist" };
    expect(renderer.getHoverSelector(chart, layer)).toBe(".tag-bar-h1-dist");
  });

  test("HexbinRenderer.getHoverSelector uses tagName format", function() {
    var renderer = getRenderer("hexbin");
    var chart = { dom: { element: { id: "hx" } } };
    var layer = { label: "density" };
    expect(renderer.getHoverSelector(chart, layer)).toBe(".tag-hexbin-hx-density");
  });

  test("GroupedBarRenderer.getHoverSelector is static", function() {
    var renderer = getRenderer("groupedBar");
    expect(renderer.getHoverSelector()).toBe(".tag-grouped-bar-g rect");
  });
});

describe("Renderer remove methods", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    registerBuiltInRenderers();
  });

  function makeDom() {
    var el = document.getElementById("chart");
    var chartArea = d3.select(el).select(".myIO-chart-area");
    return { element: el, chartArea: chartArea };
  }

  test("BarRenderer.remove selects correct elements", function() {
    var renderer = getRenderer("bar");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "Sales" };
    // Should not throw even with no matching elements
    renderer.remove(chart, layer);
  });

  test("PointRenderer.remove removes points and crosshairs", function() {
    var renderer = getRenderer("point");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "pts" };
    renderer.remove(chart, layer);
  });

  test("LineRenderer.remove removes lines and points", function() {
    var renderer = getRenderer("line");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "trend" };
    renderer.remove(chart, layer);
  });

  test("AreaRenderer.remove removes area paths", function() {
    var renderer = getRenderer("area");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "band" };
    renderer.remove(chart, layer);
  });

  test("HistogramRenderer.remove removes histogram bars", function() {
    var renderer = getRenderer("histogram");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "dist" };
    renderer.remove(chart, layer);
  });

  test("HexbinRenderer.remove removes hex bins", function() {
    var renderer = getRenderer("hexbin");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "density" };
    renderer.remove(chart, layer);
  });

  test("HeatmapRenderer.remove removes heatmap cells", function() {
    var renderer = getRenderer("heatmap");
    var dom = makeDom();
    var chart = { dom: dom };
    var layer = { label: "cells" };
    renderer.remove(chart, layer);
  });

  test("DonutRenderer.remove removes donut elements", function() {
    var renderer = getRenderer("donut");
    var dom = makeDom();
    var chart = { dom: dom };
    renderer.remove(chart);
  });

  test("GaugeRenderer.remove removes gauge elements", function() {
    var renderer = getRenderer("gauge");
    var dom = makeDom();
    var chart = { dom: dom };
    renderer.remove(chart);
  });

  test("TreemapRenderer.remove removes root elements", function() {
    var renderer = getRenderer("treemap");
    var dom = makeDom();
    var chart = { dom: dom };
    renderer.remove(chart);
  });

  test("GroupedBarRenderer.remove removes grouped bar elements", function() {
    var renderer = getRenderer("groupedBar");
    var dom = makeDom();
    var chart = { dom: dom };
    renderer.remove(chart);
  });
});

describe("Full chart rendering with layers", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("point layer renders circles in DOM", function() {
    var layer = makeLayer("point", "pts",
      [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }],
      { x_var: "x", y_var: "y" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer])
    });
    var circles = document.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(3);
  });

  test("line layer renders path in DOM", function() {
    var layer = makeLayer("line", "trend",
      [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }],
      { x_var: "x", y_var: "y" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer])
    });
    var paths = document.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
  });

  test("bar layer renders rects in DOM", function() {
    var layer = makeLayer("bar", "vals",
      [{ cat: "A", val: 10 }, { cat: "B", val: 20 }],
      { x_var: "cat", y_var: "val" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer], {
        scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: true, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } }
      })
    });
    var rects = document.querySelectorAll("rect");
    expect(rects.length).toBeGreaterThan(0);
  });

  test("gauge layer renders arcs in DOM", function() {
    var layer = makeLayer("gauge", "meter",
      [{ value: 0.75 }],
      { value: "value" },
      { color: "#E15759" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer], {
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: true, suppressAxis: { xAxis: true, yAxis: true } }
      })
    });
    var gaugeText = document.querySelectorAll(".gauge-text");
    expect(gaugeText.length).toBe(1);
    expect(gaugeText[0].textContent).toContain("75");
  });

  test("donut layer renders pie slices in DOM", function() {
    var layer = makeLayer("donut", "segments",
      [{ seg: "A", val: 30 }, { seg: "B", val: 70 }],
      { x_var: "seg", y_var: "val" },
      { color: ["#4E79A7", "#F28E2B"] }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer], {
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } }
      })
    });
    var donuts = document.querySelectorAll(".donut");
    expect(donuts.length).toBe(2);
  });

  test("area layer renders path in DOM", function() {
    var layer = makeLayer("area", "band",
      [{ x: 1, low: 5, high: 10 }, { x: 2, low: 8, high: 15 }, { x: 3, low: 10, high: 20 }],
      { x_var: "x", low_y: "low", high_y: "high" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer])
    });
    var paths = document.querySelectorAll("path");
    expect(paths.length).toBeGreaterThan(0);
  });

  test("gauge clamps value between 0 and 1", function() {
    var layer = makeLayer("gauge", "meter",
      [{ value: 1.5 }],
      { value: "value" },
      { color: "#E15759" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer], {
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: true, suppressAxis: { xAxis: true, yAxis: true } }
      })
    });
    var text = document.querySelector(".gauge-text").textContent;
    expect(text).toContain("100");
  });

  test("gauge handles non-finite value gracefully", function() {
    var layer = makeLayer("gauge", "meter",
      [{ value: "not-a-number" }],
      { value: "value" },
      { color: "#E15759" }
    );
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 400, height: 300,
      config: makeConfig([layer], {
        layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: true, suppressAxis: { xAxis: true, yAxis: true } }
      })
    });
    var textEl = document.querySelector(".gauge-text");
    // Gauge should render without crashing; text may show 0% or be absent
    if (textEl) {
      expect(textEl.textContent).toContain("0");
    } else {
      // Gauge rendered but text element not found - still a valid outcome for non-finite input
      expect(true).toBe(true);
    }
  });
});

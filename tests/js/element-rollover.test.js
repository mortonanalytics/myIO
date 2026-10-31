import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = Object.assign({}, d3, d3Sankey);
globalThis.HTMLWidgets = { shinyMode: false };

function config(layer, categoricalX) {
  return {
    specVersion: 1,
    layers: [layer],
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: !!categoricalX, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  };
}

function render(type, data, mapping, categoricalX) {
  document.body.innerHTML = "<div id='chart'></div>";
  var layer = {
    id: "layer_001", type: type, label: "L", data: data, mapping: mapping, options: {},
    transform: "identity", transformMeta: {}, encoding: {}, sourceKey: "_source_key",
    derivedFrom: null, order: 1, visibility: true, color: "#4E79A7"
  };
  new myIOchart({ element: document.getElementById("chart"), width: 400, height: 300, config: config(layer, categoricalX) });
  d3.timerFlush();
}

function hover(selector) {
  var node = document.querySelector(selector);
  expect(node, selector).not.toBeNull();
  node.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
  return {
    node: node,
    title: document.querySelector(".toolTipTitle").textContent,
    items: Array.from(document.querySelectorAll(".toolTipItem")).map(function(row) { return row.textContent; })
  };
}

var cats = ["A", "B", "C"];
var SANKEY = [{ source: "A", target: "B", value: 2 }, { source: "B", target: "C", value: 3 }];

// [type, data, mapping, categoricalX, hover target, expected title, expected text in first row]
var CASES = [
  ["lollipop", cats.map(function(c, i) { return { k: c, v: i + 1 }; }), { x_var: "k", y_var: "v" }, true,
    ".tag-lollipop-layer_001 .lollipop-head", "A", "1"],
  ["dumbbell", cats.map(function(c, i) { return { k: c, lo: i + 1, hi: i + 5 }; }), { x_var: "k", low_y: "lo", high_y: "hi" }, true,
    ".tag-dumbbell-layer_001 .dumbbell-high", "A", "Low"],
  ["rangeBar", cats.map(function(c, i) { return { k: c, lo: i + 1, hi: i + 5 }; }), { x_var: "k", low_y: "lo", high_y: "hi" }, true,
    ".tag-rangeBar-chart-L", "k: A", "lo: 1, hi: 5"],
  ["candlestick", [{ x: 1, open: 10, high: 20, low: 5, close: 15 }, { x: 2, open: 30, high: 40, low: 25, close: 35 }],
    { x_var: "x", open: "open", high: "high", low: "low", close: "close" }, false,
    ".tag-candlestick-chart-L", "x: 1", "O: 10, H: 20, L: 5, C: 15"],
  ["heatmap", [{ x: "A", y: "Low", value: 2 }, { x: "B", y: "High", value: 4 }], { x_var: "x", y_var: "y", value: "value" }, true,
    ".tag-heatmap-chart-L", "x: A, y: Low", "value: 2"],
  ["waffle", cats.map(function(c, i) { return { c: c, v: i + 1 }; }), { category: "c", value: "v" }, false,
    ".tag-waffle-layer_001 .waffle-cell", "A", "1"],
  ["beeswarm", cats.map(function(c, i) { return { v: i + 1, g: c }; }), { x_var: "v", y_var: "g" }, false,
    ".tag-beeswarm-layer_001 .beeswarm-point", "1", "A"],
  ["quantile_dots", [{ k: "A", v: 1, q: 1 }, { k: "A", v: 2, q: 2 }], { x_var: "k", y_var: "v", quantile_rank: "q" }, true,
    ".tag-quantile_dots-layer_001 .quantile-dots-point", "A", "Q1"],
  ["bump", [{ t: 1, r: 1, s: "a" }, { t: 2, r: 2, s: "a" }, { t: 1, r: 2, s: "b" }, { t: 2, r: 1, s: "b" }], { x_var: "t", y_var: "r", group: "s" }, false,
    ".tag-bump-layer_001 .bump-dot", "a", "1"],
  ["radar", cats.map(function(c, i) { return { a: c, v: i + 1 }; }), { axis: "a", value: "v" }, false,
    ".tag-radar-layer_001 .radar-polygon", "L", "A"],
  ["funnel", cats.map(function(c, i) { return { s: c, v: 10 - i }; }), { stage: "s", value: "v" }, false,
    ".tag-funnel-layer_001 .funnel-stage", "A", "10"],
  ["parallel", [{ a: 1, b: 2 }, { a: 2, b: 1 }], { dimensions: ["a", "b"] }, false,
    ".tag-parallel-layer_001 .parallel-line", "L", "a"],
  ["waterfall", [{ k: "A", d: 5, _base_y: 0, _cumulative_y: 5 }, { k: "B", d: -2, _base_y: 5, _cumulative_y: 3 }], { x_var: "k", y_var: "d" }, true,
    ".tag-waterfall-chart-L", "k: A", "Delta: 5, Total: 5"],
  ["sankey", SANKEY, { source: "source", target: "target", value: "value" }, false,
    "path.tag-sankey-chart-L", "A -> B", "Value: 2"]
];

describe("element rollover binds every renderer that declares it (#179)", function() {
  beforeEach(function() { registerBuiltInRenderers(); });

  test.each(CASES)("%s shows its tooltip on hover", function(type, data, mapping, categoricalX, selector, title, rowText) {
    render(type, data, mapping, categoricalX);
    var tip = hover(selector);
    expect(tip.title).toContain(title);
    expect(tip.items.length).toBeGreaterThan(0);
    expect(tip.items[0]).toContain(rowText);
  });

  test("bar and point tooltips are unchanged", function() {
    render("bar", [{ k: "a", v: 3 }, { k: "b", v: 5 }], { x_var: "k", y_var: "v" }, true);
    expect(hover(".tag-bar-chart-L")).toMatchObject({ title: "k: a", items: ["L3.00000"] });
    render("point", [{ x: 1, y: 3 }, { x: 2, y: 5 }], { x_var: "x", y_var: "y" }, false);
    expect(hover(".tag-point-chart-L")).toMatchObject({ title: "x: 1", items: ["L3.00000"] });
  });

  test("hovering a sankey link leaves its own stroke in place after mouseout", function() {
    render("sankey", SANKEY, { source: "source", target: "target", value: "value" }, false);
    var link = hover("path.tag-sankey-chart-L").node;
    var width = link.getAttribute("stroke-width");
    expect(link.style.strokeWidth).toBe("");
    link.dispatchEvent(new MouseEvent("mouseout", { bubbles: true }));
    expect(link.style.stroke).toBe("");
    expect(link.style.strokeWidth).toBe("");
    expect(link.style.strokeOpacity).toBe("");
    expect(link.getAttribute("stroke-width")).toBe(width);
  });
});

describe("Shiny rollover input", function() {
  afterEach(function() {
    globalThis.HTMLWidgets.shinyMode = false;
    delete globalThis.Shiny;
  });

  test("fires for newly bound types, including sankey links whose data is cyclic", function() {
    registerBuiltInRenderers();
    globalThis.HTMLWidgets.shinyMode = true;
    globalThis.Shiny = { onInputChange: vi.fn(), addCustomMessageHandler: vi.fn(), setInputValue: vi.fn() };
    render("sankey", SANKEY, { source: "source", target: "target", value: "value" }, false);
    hover("path.tag-sankey-chart-L");
    var call = globalThis.Shiny.onInputChange.mock.calls.find(function(c) { return c[0] === "myIO-chart-rollover"; });
    expect(call).toBeDefined();
    expect(JSON.parse(call[1]).value).toBe(2);
  });
});

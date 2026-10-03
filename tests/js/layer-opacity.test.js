import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import { beforeEach, describe, expect, test } from "vitest";
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

var cats = ["A", "B", "C"];
var CASES = [
  ["beeswarm", cats.map(function(c, i) { return { v: i + 1, g: c }; }), { x_var: "v", y_var: "g" }, false],
  ["bump", [{ t: 1, r: 1, s: "a" }, { t: 2, r: 2, s: "a" }, { t: 1, r: 2, s: "b" }, { t: 2, r: 1, s: "b" }], { x_var: "t", y_var: "r", group: "s" }, false],
  ["calendarHeatmap", [{ d: "2026-01-01", v: 1 }, { d: "2026-01-02", v: 2 }], { date: "d", value: "v" }, false],
  ["donut", cats.map(function(c, i) { return { k: c, v: i + 1 }; }), { x_var: "k", y_var: "v" }, false],
  ["dumbbell", cats.map(function(c, i) { return { k: c, lo: i, hi: i + 2 }; }), { x_var: "k", low_y: "lo", high_y: "hi" }, true],
  ["funnel", cats.map(function(c, i) { return { s: c, v: 10 - i }; }), { stage: "s", value: "v" }, false],
  ["gauge", [{ v: 0.4 }], { value: "v" }, false],
  ["groupedBar", [{ k: "A", v: 1, g: "x" }, { k: "B", v: 2, g: "x" }], { x_var: "k", y_var: "v", group: "g" }, true],
  ["lollipop", cats.map(function(c, i) { return { k: c, v: i + 1 }; }), { x_var: "k", y_var: "v" }, true],
  ["parallel", [{ a: 1, b: 2 }, { a: 2, b: 1 }], { dimensions: ["a", "b"] }, false],
  ["quantile_dots", [{ k: "A", v: 1, q: 0.5 }, { k: "A", v: 2, q: 0.9 }], { x_var: "k", y_var: "v", quantile_rank: "q" }, true],
  ["radar", cats.map(function(c, i) { return { a: c, v: i + 1 }; }), { axis: "a", value: "v" }, false],
  ["waffle", cats.map(function(c, i) { return { c: c, v: i + 1 }; }), { category: "c", value: "v" }, false]
];

function opacities(type, data, mapping, categoricalX, opacity) {
  document.body.innerHTML = "<div id='chart'></div>";
  var layer = {
    id: "layer_001", type: type, label: "Sales (Q1)", data: data, mapping: mapping,
    options: opacity == null ? {} : { opacity: opacity },
    transform: "identity", transformMeta: {}, encoding: {}, sourceKey: "_source_key",
    derivedFrom: null, order: 1, visibility: true, color: "#4E79A7"
  };
  new myIOchart({ element: document.getElementById("chart"), width: 400, height: 300, config: config(layer, categoricalX) });
  d3.timerFlush();
  return Array.from(document.querySelectorAll("#chart *")).map(function(n) { return n.style && n.style.opacity; });
}

describe("setLayerOpacity reaches every renderer", function() {
  beforeEach(function() { registerBuiltInRenderers(); });

  test.each(CASES)("%s", function(type, data, mapping, categoricalX) {
    expect(opacities(type, data, mapping, categoricalX, null)).not.toContain("0.25");
    expect(opacities(type, data, mapping, categoricalX, 0.25)).toContain("0.25");
  });
});

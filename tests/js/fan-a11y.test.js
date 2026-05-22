import * as d3 from "d3";
import { describe, expect, test, beforeEach } from "vitest";
import { KeyboardNavigator } from "../../inst/htmlwidgets/myIO/src/a11y/keyboard-nav.js";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function baseConfig(layers) {
  return {
    specVersion: 1,
    layers: layers,
    layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
    scales: { xlim: { min: null, max: null }, ylim: { min: null, max: null }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#E69F00"], domain: ["none"], enabled: false } },
    axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: "day", yAxisLabel: "value", toolTipFormat: "s" },
    interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
    theme: {},
    transitions: { speed: 0 },
    referenceLines: { x: null, y: null }
  };
}

function areaLayer(id, label, pct, lowOffset, highOffset) {
  return {
    id: id,
    type: "area",
    label: label,
    data: [1, 2, 3].map(function(day) {
      return {
        x_var: day,
        low_y: day * 10 - lowOffset,
        high_y: day * 10 + highOffset,
        density_label: pct + "% interval",
        interval_pct: pct,
        intervalType: "prediction",
        _source_key: id + "_" + day
      };
    }),
    mapping: { x_var: "x_var", low_y: "low_y", high_y: "high_y" },
    options: { interval_pct: pct, density_label: pct + "% interval", intervalType: "prediction", areaOpacity: 0.3, boundaryStroke: true },
    transform: "identity",
    transformMeta: {},
    encoding: {},
    sourceKey: "_source_key",
    derivedFrom: null,
    order: 1,
    visibility: true,
    color: "#E69F00",
    _composite: "fan",
    _compositeRole: "fan_" + pct
  };
}

describe("fan chart accessibility", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  test("data table merges fan bands into one interval table", function() {
    var chart = new myIOchart({
      element: document.getElementById("chart"),
      width: 640,
      height: 400,
      config: baseConfig([
        areaLayer("layer_001_sub_01", "fan - 95% interval", 95, 5, 5),
        areaLayer("layer_001_sub_02", "fan - 80% interval", 80, 4, 4),
        areaLayer("layer_001_sub_03", "fan - 50% interval", 50, 2, 2)
      ])
    });

    chart.dataTable.generate();
    var tables = document.querySelectorAll("#chart .myIO-data-table table");
    expect(tables.length).toBe(1);
    var headers = Array.from(tables[0].querySelectorAll("th")).map(function(th) { return th.textContent; });
    expect(headers).toEqual(["x_var", "low_50", "high_50", "low_80", "high_80", "low_95", "high_95"]);
  });

  test("keyboard layer changes announce the destination layer label first", async function() {
    var pointA = {
      id: "layer_001",
      type: "point",
      label: "first",
      data: [{ x: 1, y: 2, _source_key: "a" }],
      mapping: { x_var: "x", y_var: "y" },
      options: {},
      transform: "identity",
      transformMeta: {},
      encoding: {},
      sourceKey: "_source_key",
      derivedFrom: null,
      order: 1,
      visibility: true,
      color: "#E69F00"
    };
    var pointB = Object.assign({}, pointA, {
      id: "layer_002",
      label: "second",
      data: [{ x: 2, y: 3, _source_key: "b" }],
      color: "#56B4E9"
    });
    var element = document.getElementById("chart");
    var svg = d3.select(element).append("svg");
    var chart = {
      config: { layers: [pointA, pointB] },
      dom: {
        element: element,
        svg: svg,
        chartArea: svg.append("g")
      }
    };
    chart.keyboardNav = new KeyboardNavigator(chart);
    chart.keyboardNav.initialize();

    chart.keyboardNav.moveLayer(1);
    await new Promise(function(resolve) { setTimeout(resolve, 250); });
    expect(document.querySelector("#chart [role='status']").textContent).toMatch(/^second: /);
  });
});

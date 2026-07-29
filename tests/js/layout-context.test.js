import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { initializeScaffold } from "../../inst/htmlwidgets/myIO/src/layout/scaffold.js";
import { renderAxes } from "../../inst/htmlwidgets/myIO/src/layout/axes.js";
import { syncLegend } from "../../inst/htmlwidgets/myIO/src/layout/legend.js";

globalThis.d3 = d3;

function baseChart() {
  document.body.innerHTML = "<div id='chart'></div>";
  var element = document.getElementById("chart");
  return {
    element,
    config: {
      title: "Quarterly Signups",
      layers: [
        { label: "Basic", color: "#4269D0", type: "line" },
        { label: "Pro", color: "#EF603B", type: "line" }
      ],
      layout: { margin: { top: 48, bottom: 72, left: 80, right: 16 } }
    },
    plotLayers: [
      { label: "Basic", color: "#4269D0", type: "line" },
      { label: "Pro", color: "#EF603B", type: "line" }
    ],
    currentLayers: [
      { label: "Basic", color: "#4269D0", type: "line" },
      { label: "Pro", color: "#EF603B", type: "line" }
    ],
    derived: {},
    runtime: { totalWidth: 640 },
    options: {
      transition: { speed: 0 },
      categoricalScale: { xAxis: true, yAxis: true },
      suppressAxis: { xAxis: false, yAxis: false },
      suppressLegend: false,
      xAxisLabel: "Quarter",
      yAxisLabel: "Tier",
      xAxisFormat: "s",
      yAxisFormat: "s"
    },
    margin: { top: 48, bottom: 72, left: 80, right: 16 },
    width: 640,
    totalWidth: 640,
    height: 360,
    xScale: d3.scaleBand().domain(["Q1", "Q2"]).range([0, 544]),
    yScale: d3.scaleBand().domain(["Enterprise", "Pro"]).range([240, 0])
  };
}

describe("chart context layout", function() {
  test("renders chart and axis titles", function() {
    var chart = baseChart();
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    expect(chart.element.querySelector(".myIO-chart-title").textContent).toBe("Quarterly Signups");
    expect(chart.element.querySelector(".myIO-axis-title-x").textContent).toBe("Quarter");
    expect(chart.element.querySelector(".myIO-axis-title-y").textContent).toBe("Tier");
  });

  test("rotated y-axis title clears the SVG left edge", function() {
    var chart = baseChart();
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var title = chart.element.querySelector(".myIO-axis-title-y");
    var tx = Number(/translate\(([-\d.]+),/.exec(title.getAttribute("transform"))[1]);
    // The plot <g> is translated by margin.left, so this is the anchor's distance
    // from the SVG's left edge. Rotated -90deg the glyphs extend ~12px to its left.
    expect(chart.margin.left + tx).toBeGreaterThanOrEqual(14);
  });

  test("small left margin keeps the y-axis title inside the margin band", function() {
    var chart = baseChart();
    chart.margin.left = 10;
    chart.config.layout.margin.left = 10;
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var title = chart.element.querySelector(".myIO-axis-title-y");
    var tx = Number(/translate\(([-\d.]+),/.exec(title.getAttribute("transform"))[1]);
    expect(chart.margin.left + tx).toBeLessThanOrEqual(chart.margin.left);
  });

  test("band-scale y axis renders without ticks function", function() {
    var chart = baseChart();
    initializeScaffold(chart);

    expect(function() {
      renderAxes(chart, { isInitialRender: true });
    }).not.toThrow();
    expect(chart.element.querySelectorAll(".y-axis .tick").length).toBeGreaterThan(0);
  });

  test("empty axis format uses d3 default linear ticks", function() {
    var chart = baseChart();
    chart.options.categoricalScale = { xAxis: false, yAxis: false };
    chart.options.xAxisFormat = "";
    chart.options.yAxisFormat = "";
    chart.xScale = d3.scaleLinear().domain([0, 1]).range([0, 544]);
    chart.yScale = d3.scaleLinear().domain([0, 1]).range([240, 0]);
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var yLabels = Array.from(chart.element.querySelectorAll(".y-axis .tick text"))
      .map(function(node) { return node.textContent; });
    expect(yLabels).toContain("0.2");
    expect(yLabels).not.toContain("500.000m");
  });

  test("linear x axis can render positional category labels", function() {
    var chart = baseChart();
    chart.options.categoricalScale = { xAxis: false, yAxis: false };
    chart.options.xAxisFormat = "";
    chart.options.xTickLabels = { "1": "setosa", "2": "versicolor" };
    chart.xScale = d3.scaleLinear().domain([0.5, 2.5]).range([0, 544]);
    chart.yScale = d3.scaleLinear().domain([0, 1]).range([240, 0]);
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var xLabels = Array.from(chart.element.querySelectorAll(".x-axis .tick text"))
      .map(function(node) { return node.textContent; });
    expect(xLabels).toEqual(["setosa", "versicolor"]);
  });

  test("linear y axis can render positional category labels", function() {
    var chart = baseChart();
    chart.options.categoricalScale = { xAxis: false, yAxis: false };
    chart.options.yAxisFormat = "";
    chart.options.yTickLabels = { "1": "6", "2": "4", "3": "8" };
    chart.xScale = d3.scaleLinear().domain([0, 400]).range([0, 544]);
    chart.yScale = d3.scaleLinear().domain([0.8, 3.6]).range([240, 0]);
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var yLabels = Array.from(chart.element.querySelectorAll(".y-axis .tick text"))
      .map(function(node) { return node.textContent; });
    expect(yLabels).toEqual(["6", "4", "8"]);
  });

  test("positional y tick labels outside the domain are dropped", function() {
    var chart = baseChart();
    chart.options.categoricalScale = { xAxis: false, yAxis: false };
    chart.options.yAxisFormat = "";
    chart.options.yTickLabels = { "1": "6", "2": "4", "3": "8" };
    chart.xScale = d3.scaleLinear().domain([0, 400]).range([0, 544]);
    chart.yScale = d3.scaleLinear().domain([0.8, 2.4]).range([240, 0]);
    initializeScaffold(chart);
    renderAxes(chart, { isInitialRender: true });

    var yLabels = Array.from(chart.element.querySelectorAll(".y-axis .tick text"))
      .map(function(node) { return node.textContent; });
    expect(yLabels).toEqual(["6", "4"]);
  });

  test("band-scale y axis ignores positional tick labels", function() {
    var chart = baseChart();
    chart.options.yTickLabels = { "1": "A" };
    initializeScaffold(chart);

    expect(function() {
      renderAxes(chart, { isInitialRender: true });
    }).not.toThrow();
    expect(chart.element.querySelectorAll(".y-axis .tick").length).toBeGreaterThan(0);
  });

  test("inline legend renders below chart title and away from toolbar", function() {
    var chart = baseChart();
    initializeScaffold(chart);
    syncLegend(chart, { axesChart: true });

    var legend = chart.element.querySelector(".myIO-inline-legend");
    var fab = chart.element.querySelector(".myIO-fab");
    expect(legend).toBeTruthy();
    expect(fab).toBeFalsy();
    expect(legend.getAttribute("transform")).toContain("translate(80,");
  });
});

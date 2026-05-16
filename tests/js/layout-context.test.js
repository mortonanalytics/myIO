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

  test("band-scale y axis renders without ticks function", function() {
    var chart = baseChart();
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

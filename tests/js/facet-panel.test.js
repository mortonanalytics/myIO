import * as d3 from "d3";
import { beforeAll, describe, expect, test } from "vitest";
import { FacetController } from "../../inst/htmlwidgets/myIO/src/layout/facet-controller.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

beforeAll(function() {
  registerBuiltInRenderers();
});

function baseChart() {
  document.body.innerHTML = "<div id='facet-chart'></div>";
  var element = document.getElementById("facet-chart");
  return {
    element,
    dom: { element, svg: null },
    config: {
      title: "Composite Title",
      facet: {
        enabled: true,
        var: "g",
        ncol: 3,
        minWidth: 200,
        scales: "fixed",
        labelPosition: "top"
      },
      layers: [
        {
          type: "point",
          label: "pts",
          color: ["#E69F00"],
          data: [
            { x: 1, y: 2, g: "a" },
            { x: 2, y: 4, g: "a" },
            { x: 3, y: 9, g: "b" },
            { x: 4, y: 16, g: "b" }
          ],
          mapping: { x_var: "x", y_var: "y" }
        }
      ],
      layout: {
        margin: { top: 30, right: 5, bottom: 60, left: 50 },
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
      axes: {
        xAxisFormat: "s",
        yAxisFormat: "s",
        xAxisLabel: null,
        yAxisLabel: null,
        toolTipFormat: "s",
        xTickLabels: null
      },
      interactions: { toolTipOptions: { suppressY: false } },
      transitions: { speed: 0 },
      referenceLines: { x: null, y: null }
    },
    runtime: {
      totalWidth: 900,
      width: 900,
      height: 400,
      layout: null,
      activeY: null,
      activeYFormat: null
    },
    derived: { currentLayers: [] }
  };
}

describe("facet panels", function() {
  test("renders the composite title once, above the grid", function() {
    var chart = baseChart();
    new FacetController(chart).initialize();

    expect(chart.element.querySelectorAll(".myIO-facet-panel text.myIO-chart-title").length).toBe(0);

    var titles = chart.element.querySelectorAll(".myIO-facet-title");
    expect(titles.length).toBe(1);
    expect(titles[0].textContent).toBe("Composite Title");
    expect(chart.element.firstElementChild.className).toBe("myIO-facet-title");
  });

  test("every panel draws its own y axis", function() {
    var chart = baseChart();
    new FacetController(chart).initialize();

    var panels = chart.element.querySelectorAll(".myIO-facet-panel");
    expect(panels.length).toBe(2);
    panels.forEach(function(panel) {
      expect(panel.querySelectorAll("g.y-axis .tick").length).toBeGreaterThan(1);
    });
  });

  test("panel plot geometry is uniform across panels", function() {
    var chart = baseChart();
    new FacetController(chart).initialize();

    var transforms = Array.from(
      chart.element.querySelectorAll(".myIO-facet-panel g.myIO-chart-offset")
    ).map(function(node) { return node.getAttribute("transform"); });

    expect(transforms.length).toBe(2);
    expect(new Set(transforms).size).toBe(1);
  });

  test("a facet panel grows its own left margin for wide y tick labels", function() {
    var chart = baseChart();
    chart.config.axes.yAxisFormat = "$,.0f";
    chart.config.axes.yAxisLabel = "Price";
    chart.config.layers[0].data.forEach(function(row) { row.y *= 100000; });

    var controller = new FacetController(chart);
    controller.initialize();
    var panel = controller.panels.get("a");

    expect(panel.panelChart.config.layout.margin.left).toBeGreaterThan(50);
    // config.layout.margin and chart.margin must be one object, the invariant
    // fitLeftMargin and derive/scales.js both rely on.
    expect(panel.panelChart.margin).toBe(panel.panelChart.config.layout.margin);
  });

  test("a panel's margin fit does not leak into the parent chart or its siblings", function() {
    var chart = baseChart();
    chart.config.axes.yAxisFormat = "$,.0f";
    chart.config.axes.yAxisLabel = "Price";
    // Free scales so each panel measures its own labels: group "a" gets the
    // wide ones, group "b" keeps narrow ones.
    chart.config.facet.scales = "free";
    chart.config.layers[0].data = [
      { x: 1, y: 200000, g: "a" },
      { x: 2, y: 400000, g: "a" },
      { x: 3, y: 2, g: "b" },
      { x: 4, y: 4, g: "b" }
    ];

    var controller = new FacetController(chart);
    controller.initialize();
    var wide = controller.panels.get("a").panelChart;
    var narrow = controller.panels.get("b").panelChart;

    expect(chart.config.layout.margin.left).toBe(50);
    expect(wide.config.layout.margin.left).toBeGreaterThan(50);
    expect(narrow.config.layout.margin.left).toBe(50);
    expect(wide.margin).not.toBe(narrow.margin);
    expect(wide.margin).not.toBe(chart.config.layout.margin);
  });

  test("an explicit setMargin() suppresses the panel fit", function() {
    var chart = baseChart();
    chart.config.axes.yAxisFormat = "$,.0f";
    chart.config.axes.yAxisLabel = "Price";
    chart.config.layout.marginSet = true;
    chart.config.layers[0].data.forEach(function(row) { row.y *= 100000; });

    var controller = new FacetController(chart);
    controller.initialize();

    expect(controller.panels.get("a").panelChart.config.layout.margin.left).toBe(50);
  });

  test("re-initializing and destroying leaves no orphan title", function() {
    var chart = baseChart();
    var controller = new FacetController(chart);

    controller.initialize();
    controller.initialize();
    expect(chart.element.querySelectorAll(".myIO-facet-title").length).toBe(1);

    controller.destroy();
    expect(chart.element.querySelectorAll(".myIO-facet-title").length).toBe(0);
  });
});

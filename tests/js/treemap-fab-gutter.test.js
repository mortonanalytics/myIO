import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = Object.assign({}, d3);

var PLOT_WIDTH = 400 - (50 + 5);
// The layout gives up the band under the floating action button
// (FAB_GUTTER 56, minus the 5px right margin already outside the plot).
var USABLE_WIDTH = PLOT_WIDTH - 51;

function makeChart() {
  document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
  var el = document.getElementById("chart");
  return {
    element: el,
    chart: d3.select(el).select(".myIO-chart-area"),
    dom: { element: el, chartArea: d3.select(el).select(".myIO-chart-area") },
    derived: {},
    config: { scales: { colorScheme: { enabled: false } } },
    options: { transition: { speed: 0 } },
    margin: { top: 30, bottom: 60, left: 50, right: 5 },
    width: 400,
    height: 300
  };
}

function makeLayer() {
  return {
    label: "headcount",
    color: ["#ff0000", "#00ff00"],
    mapping: { level_1: "dept", level_2: "team", x_var: "team", y_var: "headcount" },
    data: {
      name: "root",
      children: [
        { name: "Sales", children: [{ name: "East", headcount: 40 }, { name: "West", headcount: 25 }] },
        { name: "Eng", children: [{ name: "Core", headcount: 30 }, { name: "Infra", headcount: 15 }] }
      ]
    }
  };
}

function leafRightEdges() {
  return Array.from(document.querySelectorAll("g.root")).map(function(cell) {
    var m = /translate\(([-\d.]+),\s*([-\d.]+)\)/.exec(cell.getAttribute("transform"));
    return +m[1] + (+cell.querySelector("rect").getAttribute("width"));
  });
}

describe("Treemap FAB gutter", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("the tiling stops short of the floating action button", function() {
    var chart = makeChart();
    getRenderer("treemap").render(chart, makeLayer());

    var edges = leafRightEdges();
    expect(edges.length).toBe(4);
    // Pre-fix this is 345 (the full plot width) and the corner leaf sits under the FAB.
    expect(Math.max.apply(null, edges)).toBe(USABLE_WIDTH);
    expect(Math.max.apply(null, edges)).toBeLessThanOrEqual(PLOT_WIDTH - 51);
  });
});

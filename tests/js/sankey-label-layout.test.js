import * as d3 from "d3";
import * as d3Sankey from "d3-sankey";
import { beforeEach, describe, expect, test } from "vitest";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = Object.assign({}, d3, d3Sankey);

var PLOT_WIDTH = 400 - (50 + 5);
// The layout also gives up the band under the floating action button
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
    options: { transition: { speed: 0 } },
    margin: { top: 30, bottom: 60, left: 50, right: 5 },
    width: 400,
    height: 300,
    colorDiscrete: null
  };
}

function makeLayer() {
  return {
    label: "flow",
    color: ["#ff0000", "#00ff00", "#0000ff"],
    mapping: { source: "source", target: "target", value: "value" },
    data: [
      { source: "A", target: "B", value: 2 },
      { source: "B", target: "C", value: 3 }
    ]
  };
}

function nodeRights() {
  return Array.from(document.querySelectorAll("rect.tag-sankey-node-chart-flow")).map(function(rect) {
    return +rect.getAttribute("x") + +rect.getAttribute("width");
  });
}

function labels() {
  return Array.from(document.querySelectorAll("text.tag-sankey-label-chart-flow"));
}

describe("Sankey terminal-node gutter", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("the terminal column stops short of the clip boundary", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, makeLayer());

    var maxRight = Math.max.apply(null, nodeRights());
    expect(maxRight).toBeLessThanOrEqual(USABLE_WIDTH - 20);
    expect(maxRight).toBeCloseTo(264.5, 6);
  });

  test("the terminal label sits in the gutter, to the right of its node", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, makeLayer());

    var maxRight = Math.max.apply(null, nodeRights());
    var terminal = labels().filter(function(node) { return node.textContent.indexOf("C") === 0; })[0];

    expect(terminal.getAttribute("text-anchor")).toBe("start");
    expect(+terminal.getAttribute("x")).toBeGreaterThan(maxRight);
    expect(+terminal.getAttribute("x")).toBeLessThan(USABLE_WIDTH);
  });

  test("node labels use high-contrast ink with a background halo", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, makeLayer());

    var nodes = labels();
    expect(nodes.length).toBe(3);
    nodes.forEach(function(node) {
      expect(node.getAttribute("fill")).toBe("#000000");
      expect(node.getAttribute("stroke")).toBe("#ffffff");
      expect(node.getAttribute("stroke-width")).toBe("3");
      expect(node.getAttribute("paint-order")).toBe("stroke");
      expect(node.getAttribute("style")).not.toMatch(/--chart-text-color/);
    });
  });

  test("node label ink flips to white on a dark chart background", function() {
    var chart = makeChart();
    chart.element.style.setProperty("--chart-bg", "#111827");
    getRenderer("sankey").render(chart, makeLayer());

    labels().forEach(function(node) {
      expect(node.getAttribute("fill")).toBe("#ffffff");
      expect(node.getAttribute("stroke")).toBe("#111827");
    });
  });
});

// A->Y and B->X cross inside the single column gap, so both compute the same
// midpoint. Every one of the four passes the thickness and span gates, so
// nothing but a collision rule can separate them.
function crossingLayer() {
  return {
    label: "flow",
    color: ["#ff0000", "#00ff00", "#0000ff", "#ffff00"],
    mapping: { source: "source", target: "target", value: "value" },
    data: [
      { source: "A", target: "X", value: 50 },
      { source: "A", target: "Y", value: 14 },
      { source: "B", target: "X", value: 18 },
      { source: "B", target: "Y", value: 50 }
    ]
  };
}

function flowNodes() {
  return Array.from(document.querySelectorAll("text.tag-sankey-flow-chart-flow"));
}

describe("Sankey flow-label collisions", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("two flow labels landing on the same point keep only the first", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, crossingLayer());

    var nodes = flowNodes();
    expect(nodes.map(function(n) { return n.textContent; })).toEqual(["50", "14", "18", "50"]);
    expect(nodes.map(function(n) { return n.getAttribute("fill-opacity"); }))
      .toEqual(["1", "1", "0", "1"]);
  });

  test("the dropped label is the same one on every re-render", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, crossingLayer());
    var first = flowNodes().map(function(n) { return n.getAttribute("fill-opacity"); });

    // Re-render into the same chart: the DOM now takes the update path rather
    // than enter, which must not change which label wins.
    getRenderer("sankey").render(chart, crossingLayer());
    var second = flowNodes().map(function(n) { return n.getAttribute("fill-opacity"); });

    expect(second).toEqual(first);
    expect(second).toEqual(["1", "1", "0", "1"]);

    // And from a completely fresh DOM.
    var fresh = makeChart();
    getRenderer("sankey").render(fresh, crossingLayer());
    expect(flowNodes().map(function(n) { return n.getAttribute("fill-opacity"); }))
      .toEqual(["1", "1", "0", "1"]);
  });

  test("well-separated flow labels are all kept", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, makeLayer());

    var nodes = flowNodes();
    expect(nodes.length).toBe(2);
    nodes.forEach(function(node) {
      expect(node.getAttribute("fill-opacity")).toBe("1");
    });
  });

  test("the measuring probe does not leak into the rendered output", function() {
    var chart = makeChart();
    getRenderer("sankey").render(chart, crossingLayer());

    expect(document.querySelectorAll(".myIO-label-probe").length).toBe(0);
  });
});

import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { registerBuiltInRenderers, getRenderer } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

describe("BracketRenderer", function() {
  beforeEach(function() {
    registerBuiltInRenderers();
  });

  test("is registered with type 'bracket'", function() {
    var renderer = getRenderer("bracket");
    expect(renderer).toBeDefined();
    expect(renderer.constructor.type).toBe("bracket");
  });

  test("has correct traits", function() {
    var traits = getRenderer("bracket").constructor.traits;
    expect(traits.hasAxes).toBe(true);
    expect(traits.legendType).toBe("none");
    expect(traits.rolloverStyle).toBe("none");
  });

  test("has correct scaleHints", function() {
    var hints = getRenderer("bracket").constructor.scaleHints;
    expect(hints.yExtentFields).toEqual(["y"]);
    expect(hints.xExtentFields).toEqual([]);
  });

  test("has correct dataContract", function() {
    var contract = getRenderer("bracket").constructor.dataContract;
    expect(contract.x1.required).toBe(true);
    expect(contract.x2.required).toBe(true);
    expect(contract.y.required).toBe(true);
  });

  test("formatTooltip returns null", function() {
    expect(getRenderer("bracket").formatTooltip()).toBeNull();
  });

  test("render creates bracket elements", function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var renderer = getRenderer("bracket");
    var chart = {
      element: el,
      chart: d3.select(el).select(".myIO-chart-area"),
      options: { transition: { speed: 0 } },
      xScale: d3.scaleLinear().domain([0, 4]).range([0, 200]),
      yScale: d3.scaleLinear().domain([0, 20]).range([200, 0])
    };
    var layer = {
      label: "test-brackets",
      color: "#333",
      data: [
        { x1: 1, x2: 2, y: 15, label: "p = 0.03 *" }
      ]
    };

    renderer.render(chart, layer);

    var lines = document.querySelectorAll("line");
    expect(lines.length).toBe(3);
    var texts = document.querySelectorAll("text");
    expect(texts.length).toBe(1);
    expect(texts[0].textContent).toBe("p = 0.03 *");
  });

  test("remove cleans up DOM", function() {
    document.body.innerHTML = "<div id='chart'><svg><g class='myIO-chart-area'></g></svg></div>";
    var el = document.getElementById("chart");
    var renderer = getRenderer("bracket");
    var chart = {
      element: el,
      dom: { element: el },
      chart: d3.select(el).select(".myIO-chart-area"),
      options: { transition: { speed: 0 } },
      xScale: d3.scaleLinear().domain([0, 4]).range([0, 200]),
      yScale: d3.scaleLinear().domain([0, 20]).range([200, 0])
    };
    var layer = { label: "test-brackets", color: "#333",
      data: [{ x1: 1, x2: 2, y: 15, label: "p = 0.03 *" }] };

    renderer.render(chart, layer);
    renderer.remove(chart, layer);

    var remaining = el.querySelectorAll("line");
    expect(remaining.length).toBe(0);
  });

  test("remove resolves the mark class through chart.dom.element", function() {
    document.body.innerHTML =
      "<div id='live'><svg><g class='myIO-chart-area'></g></svg></div><div id='stale'></div>";
    var live = document.getElementById("live");
    var renderer = getRenderer("bracket");
    var chart = {
      element: live,
      dom: { element: live },
      chart: d3.select(live).select(".myIO-chart-area"),
      options: { transition: { speed: 0 } },
      xScale: d3.scaleLinear().domain([0, 4]).range([0, 200]),
      yScale: d3.scaleLinear().domain([0, 20]).range([200, 0])
    };
    var layer = { label: "test-brackets", color: "#333",
      data: [{ x1: 1, x2: 2, y: 15, label: "p = 0.03 *" }] };

    renderer.render(chart, layer);
    // chart.element is a legacy alias re-derived from chart.dom.element on
    // every sync; chart.dom.element is the field that is written once and
    // never reassigned. Every other renderer's remove() reads dom.element, so
    // a stale alias must not orphan the marks.
    chart.element = document.getElementById("stale");
    renderer.remove(chart, layer);

    expect(live.querySelectorAll("line").length).toBe(0);
  });
});

import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { renderChartTitle, FAB_GUTTER } from "../../inst/htmlwidgets/myIO/src/layout/scaffold.js";

globalThis.d3 = d3;

// jsdom has no getComputedTextLength, so text-metrics falls back to 6.5px/char.
var CHAR = 6.5;

function buildChart(width, title) {
  document.body.innerHTML = "<div id='title-chart'></div>";
  var element = document.getElementById("title-chart");
  var svg = d3.select(element).append("svg");
  return {
    element: element,
    svg: svg,
    width: width,
    margin: { top: 30, right: 5, bottom: 60, left: 50 },
    config: { title: title }
  };
}

function titleNode() {
  return document.querySelector(".myIO-chart-title");
}

describe("chart title placement", function() {
  beforeEach(function() {
    document.body.innerHTML = "";
  });

  test("a title that fits is rendered verbatim", function() {
    var chart = buildChart(900, "Linked View: Horsepower vs MPG");
    renderChartTitle(chart);

    expect(titleNode().textContent).toBe("Linked View: Horsepower vs MPG");
    expect(titleNode().getAttribute("aria-label")).toBe(null);
  });

  // The title's baseline sits inside the floating action button's vertical band
  // and the button owns the top-right corner, so an untrimmed long title on a
  // narrow container renders underneath it.
  test("a title too long for the container stops short of the button", function() {
    var text = "Linked View: Horsepower vs MPG";
    var chart = buildChart(260, text);
    renderChartTitle(chart);

    var rendered = titleNode().textContent;
    expect(rendered).not.toBe(text);
    expect(rendered.endsWith("…")).toBe(true);
    expect(rendered.length * CHAR).toBeLessThanOrEqual(260 - 50 - FAB_GUTTER);
  });

  test("the untrimmed title stays reachable when it is trimmed", function() {
    var text = "Linked View: Horsepower vs MPG";
    var chart = buildChart(260, text);
    renderChartTitle(chart);

    expect(titleNode().getAttribute("aria-label")).toBe(text);
  });

  // Export and screenshot code recovers the rendered string from textContent,
  // so nothing may be nested inside the element that would pollute it.
  test("the trimmed title is the element's entire text content", function() {
    var chart = buildChart(260, "Linked View: Horsepower vs MPG");
    renderChartTitle(chart);

    expect(titleNode().children.length).toBe(0);
    expect(titleNode().textContent).toBe(titleNode().firstChild.nodeValue);
  });

  test("re-rendering wider restores the full title", function() {
    var text = "Linked View: Horsepower vs MPG";
    var chart = buildChart(260, text);
    renderChartTitle(chart);
    expect(titleNode().textContent.endsWith("…")).toBe(true);

    chart.width = 900;
    renderChartTitle(chart);

    expect(titleNode().textContent).toBe(text);
    expect(titleNode().getAttribute("aria-label")).toBe(null);
  });

  test("a container with no room for any title does not loop forever", function() {
    var chart = buildChart(50, "Some Title");
    renderChartTitle(chart);

    expect(titleNode()).not.toBe(null);
  });

  test("no title configured renders no node", function() {
    var chart = buildChart(900, null);
    renderChartTitle(chart);

    expect(titleNode()).toBe(null);
  });
});

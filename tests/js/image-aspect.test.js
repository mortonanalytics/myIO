import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { ImageRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/ImageRenderer.js";
import { LineRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/LineRenderer.js";
import { PointRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/PointRenderer.js";
import { applyEqualAspect } from "../../inst/htmlwidgets/myIO/src/derive/scales.js";
import { continuousXTickCount, xAxisTitleY } from "../../inst/htmlwidgets/myIO/src/layout/axes.js";
import { X_TITLE_LIFT_PX } from "../../inst/htmlwidgets/myIO/src/layout/legend-placement.js";
import { buildLegendData } from "../../inst/htmlwidgets/myIO/src/layout/legend-data.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;

function mountChart() {
  const container = document.createElement("div");
  container.id = "chart-" + Math.random().toString(36).slice(2, 8);
  document.body.appendChild(container);
  const area = d3.select(container).append("svg").append("g");
  return {
    element: container,
    chart: area,
    dom: { element: container, chartArea: area },
    xScale: d3.scaleLinear().domain([0, 10]).range([0, 400]),
    yScale: d3.scaleLinear().domain([0, 5]).range([200, 0]),
    width: 500, height: 300, margin: { top: 0, right: 0, bottom: 0, left: 0 },
    derived: {}, runtime: {}, config: { scales: { colorScheme: { enabled: false } } },
    options: { transition: { speed: 0 }, dragPoints: false }
  };
}

describe("image layer", function() {
  beforeEach(function() { document.body.innerHTML = ""; });

  test("stretches the picture over the data extent and sits under other marks", function() {
    const chart = mountChart();
    chart.chart.append("circle").attr("class", "other");
    new ImageRenderer().render(chart, {
      label: "ortho", mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 1 }, { x: 6, y: 4 }], options: { src: "data:image/png;base64,AAAA" }
    });
    const img = chart.element.querySelector("image");
    expect(img.getAttribute("href")).toBe("data:image/png;base64,AAAA");
    expect(+img.getAttribute("x")).toBeCloseTo(40);
    expect(+img.getAttribute("width")).toBeCloseTo(200);
    expect(+img.getAttribute("y")).toBeCloseTo(40);
    expect(+img.getAttribute("height")).toBeCloseTo(120);
    expect(chart.chart.node().firstChild).toBe(img);
  });
});

describe("equal aspect", function() {
  test("widens the tighter axis so a unit is the same length on both", function() {
    const x = d3.scaleLinear().domain([0, 10]).range([0, 400]);
    const y = d3.scaleLinear().domain([0, 10]).range([200, 0]);
    applyEqualAspect(x, y);
    const xPerPx = (x.domain()[1] - x.domain()[0]) / 400;
    const yPerPx = (y.domain()[1] - y.domain()[0]) / 200;
    expect(xPerPx).toBeCloseTo(yPerPx, 9);
    expect(x.domain()).toEqual([-5, 15]);
    expect(y.domain()).toEqual([0, 10]);
  });

  test("leaves band scales alone", function() {
    const x = d3.scaleBand().domain(["a", "b"]).range([0, 400]);
    const y = d3.scaleLinear().domain([0, 10]).range([200, 0]);
    applyEqualAspect(x, y);
    expect(y.domain()).toEqual([0, 10]);
  });
});

describe("point and line size options", function() {
  beforeEach(function() { document.body.innerHTML = ""; });

  test("a point layer's pointRadius sets its circle radius", function() {
    const chart = mountChart();
    new PointRenderer().render(chart, {
      label: "pts", color: "#000", mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 1 }], options: { pointRadius: 1.5 }
    });
    expect(+chart.element.querySelector("circle").getAttribute("r")).toBe(1.5);
  });

  test("a line layer with showPoints false draws no vertex circles", function() {
    const chart = mountChart();
    const layer = { label: "track", color: "#000", mapping: { x_var: "x", y_var: "y" },
      data: [{ x: 1, y: 1 }, { x: 2, y: 3 }, { x: 1.5, y: 4 }], options: { curveType: "linear", showPoints: false }, transform: "identity" };
    new LineRenderer().render(chart, layer);
    expect(chart.element.querySelectorAll("path").length).toBe(1);
    expect(chart.element.querySelectorAll("circle").length).toBe(0);
  });
});

describe("continuous x ticks", function() {
  test("narrow plots get fewer ticks rather than rotated labels", function() {
    expect(continuousXTickCount(300)).toBe(4);
    expect(continuousXTickCount(100)).toBe(2);
    expect(continuousXTickCount(1200)).toBe(10);
  });
});

describe("x-axis title and a two-row legend", function() {
  test("the title lifts by X_TITLE_LIFT_PX when the legend asks for it", function() {
    const chart = { margin: { bottom: 60 }, runtime: {} };
    const base = xAxisTitleY(chart, 300);
    expect(base).toBe(344);
    chart.runtime._xTitleLift = X_TITLE_LIFT_PX;
    expect(xAxisTitleY(chart, 300)).toBe(344 - X_TITLE_LIFT_PX);
  });
});

describe("layer legend", function() {
  test("leaves out image backdrops and text captions", function() {
    registerBuiltInRenderers();
    const layers = [
      { type: "image", label: "Orthophoto" },
      { type: "line", label: "Track", color: "#000" },
      { type: "text", label: "Accuracy" },
      { type: "point", label: "Ground", color: "#8C6D31" }
    ];
    const data = buildLegendData({ plotLayers: layers, currentLayers: layers, runtime: {}, options: {} }, {});
    expect(data.items.map((d) => d.label)).toEqual(["Track", "Ground"]);
  });
});

import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import { ImageRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/ImageRenderer.js";
import { LineRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/LineRenderer.js";
import { PointRenderer } from "../../inst/htmlwidgets/myIO/src/renderers/PointRenderer.js";
import { applyEqualAspect } from "../../inst/htmlwidgets/myIO/src/derive/scales.js";

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

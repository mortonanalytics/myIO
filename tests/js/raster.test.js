import * as d3 from "d3";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { RasterRenderer, buildRasterGrid, cellAt, rasterPixels } from "../../inst/htmlwidgets/myIO/src/renderers/RasterRenderer.js";
import { getRenderer, registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";
import { validateComposition } from "../../inst/htmlwidgets/myIO/src/derive/validate.js";

globalThis.d3 = d3;

// 3 x 2 grid of 0.1 m cells; the cell at (0.2, 0.0) is missing.
var rows = [
  { x: 0.0, y: 0.1, z: 1, s: 1 }, { x: 0.1, y: 0.1, z: 2, s: 1 }, { x: 0.2, y: 0.1, z: 3, s: 0 },
  { x: 0.0, y: 0.0, z: 4, s: 1 }, { x: 0.1, y: 0.0, z: 5, s: 1 }
];
var mapping = { x_var: "x", y_var: "y", value: "z", shade: "s" };

function mountChart() {
  var container = document.createElement("div");
  container.id = "raster-" + Math.random().toString(36).slice(2, 8);
  document.body.appendChild(container);
  var svg = d3.select(container).append("svg");
  var area = svg.append("g");
  var xScale = d3.scaleLinear().domain([-0.05, 0.25]).range([0, 300]);
  var yScale = d3.scaleLinear().domain([-0.05, 0.15]).range([200, 0]);
  return {
    element: container,
    chart: area,
    dom: { element: container, chartArea: area, tooltip: null },
    xScale: xScale,
    yScale: yScale,
    derived: {},
    runtime: {},
    options: { transition: { speed: 0 } }
  };
}

describe("RasterRenderer", function() {
  beforeEach(function() {
    document.body.innerHTML = "";
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      createImageData: function(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
      putImageData: function() {}
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,AAAA");
  });
  afterEach(function() {
    vi.restoreAllMocks();
  });

  test("is registered as 'raster' with a continuous legend and continuous-axes compatibility", function() {
    registerBuiltInRenderers();
    var renderer = getRenderer("raster");
    expect(renderer.constructor.traits.legendType).toBe("continuous");
    expect(validateComposition([{ type: "raster" }, { type: "line" }, { type: "point" }]).valid).toBe(true);
    expect(validateComposition([{ type: "raster" }, { type: "heatmap" }]).valid).toBe(false);
  });

  test("builds a dense grid with row 0 at the top and infers the cell size", function() {
    var grid = buildRasterGrid(rows, mapping, {});
    expect(grid.cols).toBe(3);
    expect(grid.rows).toBe(2);
    expect(grid.dx).toBeCloseTo(0.1);
    expect([grid.x0, grid.x1, grid.y0, grid.y1].map(function(v) { return +v.toFixed(3); })).toEqual([-0.05, 0.25, -0.05, 0.15]);
    expect(Array.from(grid.values.slice(0, 3))).toEqual([1, 2, 3]);
    expect(Array.from(grid.values.slice(3, 5))).toEqual([4, 5]);
    expect(Number.isNaN(grid.values[5])).toBe(true);
    expect(grid.extent).toEqual([1, 5]);
  });

  test("leaves empty cells transparent and darkens shaded cells", function() {
    var grid = buildRasterGrid(rows, mapping, {});
    var px = rasterPixels(grid, function() { return "rgb(200, 100, 50)"; });
    expect(Array.from(px.slice(0, 4))).toEqual([200, 100, 50, 255]);
    expect(Array.from(px.slice(8, 12))).toEqual([70, 35, 18, 255]);
    expect(px[5 * 4 + 3]).toBe(0);
  });

  test("draws one image spanning the grid's cell edges and sets the color scale", function() {
    var chart = mountChart();
    new RasterRenderer().render(chart, { label: "dem", data: rows, mapping: mapping, options: {} });
    var images = chart.element.querySelectorAll("image");
    expect(images.length).toBe(1);
    expect(images[0].getAttribute("href")).toBe("data:image/png;base64,AAAA");
    expect(+images[0].getAttribute("x")).toBeCloseTo(0);
    expect(+images[0].getAttribute("width")).toBeCloseTo(300);
    expect(+images[0].getAttribute("height")).toBeCloseTo(200);
    expect(chart.colorContinuous.domain()).toEqual([1, 5]);

    new RasterRenderer().render(chart, { label: "dem", data: rows.slice(0, 2), mapping: mapping, options: {} });
    expect(chart.element.querySelectorAll("image").length).toBe(1);
  });

  test("finds the cell under the pointer and none over a gap", function() {
    var chart = mountChart();
    var grid = buildRasterGrid(rows, mapping, {});
    var hit = cellAt(chart, grid, [chart.xScale(0.11), chart.yScale(0.02)]);
    expect(hit.value).toBe(5);
    expect(hit.x).toBeCloseTo(0.1);
    expect(cellAt(chart, grid, [chart.xScale(0.2), chart.yScale(0.0)])).toBeNull();
    expect(cellAt(chart, grid, [chart.xScale(0.5), chart.yScale(0.0)])).toBeNull();
  });
});

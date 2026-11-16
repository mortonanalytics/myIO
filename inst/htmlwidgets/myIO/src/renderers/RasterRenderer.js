import { hideChartTooltip, showChartTooltip } from "../tooltip.js";
import { tagName } from "../utils/responsive.js";

// Sequential palettes a raster layer may name in options.palette.
var PALETTES = {
  viridis: function() { return d3.interpolateViridis; },
  cividis: function() { return d3.interpolateCividis; },
  greys: function() { return function(t) { return d3.interpolateGreys(1 - t); }; }
};

// A shaded cell keeps this share of its color in full shadow, so dark slopes
// still show their elevation color.
var SHADE_FLOOR = 0.35;

function smallestStep(values) {
  var unique = Array.from(new Set(values)).sort(function(a, b) { return a - b; });
  var step = Infinity;
  for (var i = 1; i < unique.length; i += 1) {
    var gap = unique[i] - unique[i - 1];
    if (gap > 1e-9 && gap < step) step = gap;
  }
  return Number.isFinite(step) ? step : 1;
}

// Rows of cell centers (x, y, value[, shade]) -> a dense grid, row 0 at the top
// (largest y). Cell size comes from options.cellWidth / cellHeight, or from the
// smallest spacing between distinct x and y centers.
export function buildRasterGrid(rows, mapping, options) {
  var opts = options || {};
  var xs = [];
  var ys = [];
  var cells = [];
  (rows || []).forEach(function(row) {
    var x = +row[mapping.x_var];
    var y = +row[mapping.y_var];
    var v = +row[mapping.value];
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(v)) return;
    xs.push(x);
    ys.push(y);
    cells.push({ x: x, y: y, v: v, s: mapping.shade ? +row[mapping.shade] : null });
  });
  if (cells.length === 0) return null;

  var dx = opts.cellWidth > 0 ? +opts.cellWidth : smallestStep(xs);
  var dy = opts.cellHeight > 0 ? +opts.cellHeight : smallestStep(ys);
  var xMin = d3.min(xs);
  var xMax = d3.max(xs);
  var yMin = d3.min(ys);
  var yMax = d3.max(ys);
  var cols = Math.round((xMax - xMin) / dx) + 1;
  var nrows = Math.round((yMax - yMin) / dy) + 1;
  var values = new Float64Array(cols * nrows).fill(NaN);
  var shade = mapping.shade ? new Float64Array(cols * nrows).fill(NaN) : null;

  cells.forEach(function(c) {
    var col = Math.round((c.x - xMin) / dx);
    var row = Math.round((yMax - c.y) / dy);
    var i = row * cols + col;
    values[i] = c.v;
    if (shade) shade[i] = c.s;
  });

  return {
    cols: cols,
    rows: nrows,
    dx: dx,
    dy: dy,
    x0: xMin - dx / 2,
    x1: xMax + dx / 2,
    y0: yMin - dy / 2,
    y1: yMax + dy / 2,
    values: values,
    shade: shade,
    extent: d3.extent(cells, function(c) { return c.v; })
  };
}

// RGBA bytes for the grid: empty cells are transparent; shade (0-1) darkens
// the value color toward SHADE_FLOOR.
export function rasterPixels(grid, colorFn) {
  var out = new Uint8ClampedArray(grid.cols * grid.rows * 4);
  for (var i = 0; i < grid.values.length; i += 1) {
    var v = grid.values[i];
    if (!Number.isFinite(v)) continue;
    var c = d3.rgb(colorFn(v));
    var k = 1;
    if (grid.shade && Number.isFinite(grid.shade[i])) {
      var s = Math.max(0, Math.min(1, grid.shade[i]));
      k = SHADE_FLOOR + (1 - SHADE_FLOOR) * s;
    }
    out[i * 4] = c.r * k;
    out[i * 4 + 1] = c.g * k;
    out[i * 4 + 2] = c.b * k;
    out[i * 4 + 3] = 255;
  }
  return out;
}

function rasterDataUrl(grid, pixels) {
  var canvas = document.createElement("canvas");
  canvas.width = grid.cols;
  canvas.height = grid.rows;
  var ctx = canvas.getContext("2d");
  var image = ctx.createImageData(grid.cols, grid.rows);
  image.data.set(pixels);
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

export class RasterRenderer {
  static type = "raster";
  static traits = { hasAxes: true, referenceLines: true, legendType: "continuous", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", xExtentFields: ["x_var"], yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true }, value: { required: true, numeric: true }, shade: { required: false, numeric: true } };

  render(chart, layer) {
    var opts = layer.options || {};
    var grid = buildRasterGrid(layer.data, layer.mapping, opts);
    var cls = tagName("raster", chart.element.id, layer.label);
    var selection = chart.chart.selectAll("." + cls);
    if (!grid) {
      selection.remove();
      return;
    }

    var palette = (PALETTES[opts.palette] || PALETTES.viridis)();
    var domain = grid.extent[0] === grid.extent[1]
      ? [grid.extent[0] - 1, grid.extent[1] + 1]
      : grid.extent;
    chart.derived.colorContinuous = d3.scaleSequential(palette).domain(domain);
    chart.colorContinuous = chart.derived.colorContinuous;

    var href = rasterDataUrl(grid, rasterPixels(grid, chart.colorContinuous));
    var px0 = chart.xScale(grid.x0);
    var px1 = chart.xScale(grid.x1);
    var py0 = chart.yScale(grid.y0);
    var py1 = chart.yScale(grid.y1);

    var image = selection.data([grid]);
    image = image.enter()
      .append("image")
      .attr("class", cls)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("preserveAspectRatio", "none")
      .style("image-rendering", "pixelated")
      .merge(image);

    image
      .attr("href", href)
      .attr("x", Math.min(px0, px1))
      .attr("y", Math.min(py0, py1))
      .attr("width", Math.abs(px1 - px0))
      .attr("height", Math.abs(py1 - py0))
      .style("opacity", opts.opacity != null ? opts.opacity : 1);

    // Mark layers (track, features) drawn after the raster stay on top.
    image.lower();

    var format = d3.format(",.2f");
    image
      .on("mousemove", function(event) {
        var cell = cellAt(chart, grid, d3.pointer(event, chart.chart.node()));
        if (!cell) {
          hideChartTooltip(chart);
          return;
        }
        showChartTooltip(chart, {
          pointer: d3.pointer(event, chart.dom.element),
          title: { text: layer.mapping.x_var + ": " + format(cell.x) + ", " + layer.mapping.y_var + ": " + format(cell.y) },
          items: [{ color: chart.colorContinuous(cell.value), label: layer.mapping.value, value: format(cell.value) }]
        });
      })
      .on("mouseout", function() {
        hideChartTooltip(chart);
      });
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("raster", chart.dom.element.id, layer.label)).remove();
  }
}

// The grid cell under a pointer position in chart-area pixels, or null over
// an empty cell or outside the grid.
export function cellAt(chart, grid, pointer) {
  var x = chart.xScale.invert(pointer[0]);
  var y = chart.yScale.invert(pointer[1]);
  var col = Math.floor((x - grid.x0) / grid.dx);
  var row = Math.floor((grid.y1 - y) / grid.dy);
  if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
  var value = grid.values[row * grid.cols + col];
  if (!Number.isFinite(value)) return null;
  return { x: grid.x0 + (col + 0.5) * grid.dx, y: grid.y1 - (row + 0.5) * grid.dy, value: value };
}

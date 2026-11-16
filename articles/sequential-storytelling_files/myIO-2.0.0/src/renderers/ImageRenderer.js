import { tagName } from "../utils/responsive.js";

// image: a picture (options.src, a data: or http(s) URL) stretched over the
// data's x/y extent on continuous axes, drawn under every other layer. Map
// x_var / y_var to the image's corners, e.g. two rows (xmin, ymin) and
// (xmax, ymax). Used for orthophotos under plan views.
export class ImageRenderer {
  static type = "image";
  static traits = { hasAxes: true, referenceLines: true, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", xExtentFields: ["x_var"], yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var opts = layer.options || {};
    var cls = tagName("image", chart.element.id, layer.label);
    var xs = layer.data.map(function(d) { return +d[layer.mapping.x_var]; }).filter(Number.isFinite);
    var ys = layer.data.map(function(d) { return +d[layer.mapping.y_var]; }).filter(Number.isFinite);
    var selection = chart.chart.selectAll("." + cls);
    if (!opts.src || xs.length === 0 || ys.length === 0) {
      selection.remove();
      return;
    }
    var px0 = chart.xScale(d3.min(xs)), px1 = chart.xScale(d3.max(xs));
    var py0 = chart.yScale(d3.min(ys)), py1 = chart.yScale(d3.max(ys));

    var image = selection.data([opts.src]);
    image = image.enter()
      .append("image")
      .attr("class", cls)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("preserveAspectRatio", "none")
      .merge(image);
    image
      .attr("href", opts.src)
      .attr("x", Math.min(px0, px1))
      .attr("y", Math.min(py0, py1))
      .attr("width", Math.abs(px1 - px0))
      .attr("height", Math.abs(py1 - py0))
      .style("opacity", opts.opacity != null ? opts.opacity : 1);
    // Under everything else in the chart, including a raster.
    image.lower();
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("image", chart.dom.element.id, layer.label)).remove();
  }
}

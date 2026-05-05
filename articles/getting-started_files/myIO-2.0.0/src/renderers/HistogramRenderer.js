import { resolveColor, tagName } from "../utils/responsive.js";

export class HistogramRenderer {
  static type = "histogram";
  static traits = { hasAxes: true, referenceLines: false, legendType: "layer", binning: true, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["value"], domainMerge: "union" };
  static dataContract = { value: { required: true, numeric: true } };

  render(chart, layer) {
    var data = layer.bins;
    var key = layer.label;
    var transitionSpeed = chart.options.transition.speed;

    var bars = chart.chart
      .selectAll("." + tagName("bar", chart.element.id, key))
      .data(data);

    bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();

    var newBars = bars.enter()
      .append("rect")
      .attr("class", tagName("bar", chart.element.id, key))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("fill", function() {
        return resolveColor(chart, layer.label, layer.color);
      })
      .attr("x", function(d) { return chart.xScale(d.x0) + 1; })
      .attr("y", chart.yScale(0))
      .attr("width", function(d) { return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1); })
      .attr("height", chart.yScale(0));

    bars.merge(newBars)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x", function(d) { return chart.xScale(d.x0) + 1; })
      .attr("width", function(d) { return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1); })
      .attr("y", function(d) { return chart.yScale(d.length); })
      .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d.length); });
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("bar", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d, layer) {
    return { title: "Bin: " + d.x0 + " to " + d.x1, body: "Count: " + d.length, color: layer.color, label: "count", value: d.length, raw: d };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("bar", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

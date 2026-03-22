import { tagName } from "../utils/responsive.js";

export class RangeBarRenderer {
  static type = "rangeBar";
  static traits = { hasAxes: true, referenceLines: false, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["low_y", "high_y"], domainMerge: "union" };
  static dataContract = { x_var: { required: true }, low_y: { required: true, numeric: true }, high_y: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var xVar = layer.mapping.x_var;
    var lowVar = layer.mapping.low_y;
    var highVar = layer.mapping.high_y;
    var barWidth = layer.options && layer.options.rangeBarWidth
      ? layer.options.rangeBarWidth
      : Math.max(6, Math.min(60, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)));

    var bars = chart.chart
      .selectAll("." + tagName("rangeBar", chart.element.id, layer.label))
      .data(layer.data);

    bars.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newBars = bars.enter()
      .append("rect")
      .attr("class", tagName("rangeBar", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("x", function(d) { return chart.xScale(+d[xVar]) - barWidth / 2; })
      .attr("y", function(d) { return chart.yScale(Math.max(+d[lowVar], +d[highVar])); })
      .attr("width", barWidth)
      .attr("height", function(d) { return Math.abs(chart.yScale(+d[lowVar]) - chart.yScale(+d[highVar])); })
      .attr("fill", function(d) {
        if (typeof chart.colorDiscrete === "function" && d[layer.mapping.group]) {
          return chart.colorDiscrete(d[layer.mapping.group]);
        }
        return layer.color || "#6b7280";
      })
      .style("opacity", 0);

    bars.merge(newBars)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x", function(d) { return chart.xScale(+d[xVar]) - barWidth / 2; })
      .attr("y", function(d) { return chart.yScale(Math.max(+d[lowVar], +d[highVar])); })
      .attr("width", barWidth)
      .attr("height", function(d) { return Math.abs(chart.yScale(+d[lowVar]) - chart.yScale(+d[highVar])); })
      .attr("fill", function(d) {
        if (typeof chart.colorDiscrete === "function" && d[layer.mapping.group]) {
          return chart.colorDiscrete(d[layer.mapping.group]);
        }
        return layer.color || "#6b7280";
      })
      .style("opacity", 1);
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("rangeBar", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d, layer) {
    return {
      title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
      body: layer.mapping.low_y + ": " + d[layer.mapping.low_y] + ", " + layer.mapping.high_y + ": " + d[layer.mapping.high_y],
      color: layer.color,
      label: layer.label,
      value: d[layer.mapping.high_y],
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("rangeBar", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

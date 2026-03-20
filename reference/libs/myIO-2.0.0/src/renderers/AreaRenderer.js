import { resolveColor, tagName } from "../utils/responsive.js";

export class AreaRenderer {
  static type = "area";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["low_y", "high_y"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true, sorted: true }, low_y: { required: true, numeric: true }, high_y: { required: true, numeric: true } };

  render(chart, layer) {
    var data = layer.data;
    var key = layer.label;
    var transitionSpeed = chart.options.transition.speed;

    var valueArea = d3.area()
      .curve(d3.curveMonotoneX)
      .x(function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .y0(function(d) {
        return chart.yScale(d[layer.mapping.low_y]);
      })
      .y1(function(d) {
        return chart.yScale(d[layer.mapping.high_y]);
      });

    var linePath = chart.chart
      .selectAll("." + tagName("area", chart.element.id, key))
      .data([data]);

    linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newLinePath = linePath.enter().append("path")
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("fill", function(d) {
        return resolveColor(chart, d[0][layer.mapping.group], layer.color);
      })
      .style("opacity", 0)
      .attr("class", tagName("area", chart.element.id, key));

    linePath.merge(newLinePath)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("d", valueArea)
      .style("opacity", 0.4);
  }

  formatTooltip(chart, d, layer) {
    return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.label + ": " + d[layer.mapping.high_y], color: layer.color, label: layer.label, value: d[layer.mapping.high_y], raw: d };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("area", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

import { resolveColor, tagName } from "../utils/responsive.js";

export class AreaRenderer {
  static type = "area";

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
}

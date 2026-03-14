import { pointRadius, resolveColor, strokeWidth, tagName } from "../utils/responsive.js";

export class LineRenderer {
  static type = "line";

  render(chart, layer) {
    var data = layer.data;
    var key = layer.label;
    var currentY = chart.newY ? chart.newY : layer.mapping.y_var;
    var transitionSpeed = chart.options.transition.speed;

    var valueLine = d3.line()
      .curve(d3.curveMonotoneX)
      .x(function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .y(function(d) {
        return chart.yScale(d[currentY]);
      });

    var linePath = chart.chart
      .selectAll("." + tagName("line", chart.element.id, key))
      .data([data]);

    linePath.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newLinePath = linePath.enter()
      .append("path")
      .attr("fill", "none")
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("stroke", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      })
      .style("stroke-width", strokeWidth(chart))
      .style("opacity", 0)
      .attr("class", tagName("line", chart.element.id, key));

    linePath.merge(newLinePath)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1)
      .style("stroke-width", strokeWidth(chart))
      .style("stroke", function(d) {
        return resolveColor(chart, d[0][layer.mapping.group], layer.color);
      })
      .attr("d", valueLine);

    this.renderPoints(chart, layer);
  }

  renderPoints(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;

    var points = chart.chart
      .selectAll("." + tagName("point", chart.element.id, layer.label))
      .data(layer.data);

    points.exit().transition().remove();

    points
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("r", pointRadius(chart))
      .style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      })
      .attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });

    points.enter()
      .append("circle")
      .attr("r", pointRadius(chart))
      .style("fill", function(d) {
        return resolveColor(chart, d[layer.mapping.group], layer.color);
      })
      .style("opacity", 0)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      })
      .attr("class", tagName("point", chart.element.id, layer.label))
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1);
  }
}

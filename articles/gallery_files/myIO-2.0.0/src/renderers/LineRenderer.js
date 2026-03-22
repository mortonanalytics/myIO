import { pointRadius, resolveColor, strokeWidth, tagName } from "../utils/responsive.js";

export class LineRenderer {
  static type = "line";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true, sorted: true }, y_var: { required: true, numeric: true } };

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

    var fittingTransforms = ["lm", "loess", "polynomial", "smooth"];
    if (fittingTransforms.indexOf(layer.transform) === -1) {
      this.renderPoints(chart, layer);
    }
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

  formatTooltip(chart, d, layer) {
    return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.label + ": " + d[chart.runtime.activeY || layer.mapping.y_var], color: layer.color, label: layer.label, value: d[chart.runtime.activeY || layer.mapping.y_var], raw: d };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("line", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("point", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

import { pointRadius, resolveColor, tagName } from "../utils/responsive.js";

export class PointRenderer {
  static type = "point";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;

    if (layer.mapping.low_y) {
      renderCrosshairsY(chart, layer);
    }
    if (layer.mapping.low_x) {
      renderCrosshairsX(chart, layer);
    }

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

    if (chart.options.dragPoints == true) {
      chart.dragPoints(layer);
      var color = resolveColor(chart, layer.data[layer.mapping.group], layer.color);
      setTimeout(function() {
        chart.updateRegression(color, layer.label);
      }, transitionSpeed);
    }
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("point", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d, layer) {
    return { title: layer.mapping.x_var + ": " + d[layer.mapping.x_var], body: layer.mapping.y_var + ": " + d[chart.runtime.activeY || layer.mapping.y_var], color: layer.color, label: layer.label, value: d[chart.runtime.activeY || layer.mapping.y_var], raw: d };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("point", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("crosshairX", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("crosshairY", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

function renderCrosshairsX(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var crosshairsX = chart.chart
    .selectAll("." + tagName("crosshairX", chart.element.id, layer.label))
    .data(layer.data);

  crosshairsX.exit().transition().remove();

  crosshairsX.transition()
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.low_x]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.high_x]); })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.y_var]); });

  crosshairsX.enter()
    .append("line")
    .style("fill", "none")
    .style("stroke", "black")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("opacity", 0.5)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("class", tagName("crosshairX", chart.element.id, layer.label))
    .transition()
    .delay(transitionSpeed)
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.low_x]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.high_x]); });
}

function renderCrosshairsY(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var crosshairsY = chart.chart
    .selectAll("." + tagName("crosshairY", chart.element.id, layer.label))
    .data(layer.data);

  crosshairsY.exit().transition().remove();

  crosshairsY.transition()
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.low_y]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.high_y]); });

  crosshairsY.enter()
    .append("line")
    .style("fill", "none")
    .style("stroke", "black")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("opacity", 0.5)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("class", tagName("crosshairY", chart.element.id, layer.label))
    .transition()
    .delay(transitionSpeed)
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.low_y]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.high_y]); });
}

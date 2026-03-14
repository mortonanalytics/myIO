export class PointRenderer {
  static type = "point";

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;

    if (layer.mapping.low_y) {
      renderCrosshairsY(chart, layer);
    }
    if (layer.mapping.low_x) {
      renderCrosshairsX(chart, layer);
    }

    var points = chart.chart
      .selectAll(".tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
      .data(layer.data);

    points.exit().transition().remove();

    points
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("r", chart.totalWidth > 600 ? 5 : 3)
      .style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      })
      .attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      });

    points.enter()
      .append("circle")
      .attr("r", chart.totalWidth > 600 ? 5 : 3)
      .style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : layer.color;
      })
      .style("opacity", 0)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("cx", function(d) {
        return chart.xScale(d[layer.mapping.x_var]);
      })
      .attr("cy", function(d) {
        return chart.yScale(d[chart.newY ? chart.newY : layer.mapping.y_var]);
      })
      .attr("class", "tag-point-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1);

    if (chart.options.dragPoints == true) {
      chart.dragPoints(layer);
      var color = chart.options.colorScheme[2] == "on" ? chart.colorScheme(layer.data[layer.mapping.group]) : layer.color;
      setTimeout(function() {
        chart.updateRegression(color, layer.label);
      }, transitionSpeed);
    }
  }
}

function renderCrosshairsX(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var crosshairsX = chart.chart
    .selectAll(".tag-crosshairX-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
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
    .attr("class", "tag-crosshairX-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
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
    .selectAll(".tag-crosshairY-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
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
    .attr("class", "tag-crosshairY-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
    .transition()
    .delay(transitionSpeed)
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.low_y]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.high_y]); });
}

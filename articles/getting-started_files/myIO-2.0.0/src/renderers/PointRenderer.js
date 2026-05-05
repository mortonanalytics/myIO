import { pointRadius, resolveColor, tagName } from "../utils/responsive.js";

export class PointRenderer {
  static type = "point";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var isWhisker = layer._compositeRole === "whisker_low" || layer._compositeRole === "whisker_high";
    var isMedian = layer._compositeRole === "median";

    if (layer.mapping.low_y) {
      if (isMedian) {
        renderMedianLine(chart, layer);
      } else if (isWhisker) {
        renderWhiskerLine(chart, layer);
        renderWhiskerCaps(chart, layer);
      } else {
        renderCrosshairsY(chart, layer);
      }
    }
    if (layer.mapping.low_x) {
      renderCrosshairsX(chart, layer);
    }

    // Skip point circles for whisker and median layers
    if (isWhisker || isMedian) return;

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
    chart.dom.chartArea.selectAll("." + tagName("whiskerCap", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("medianLine", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
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

function renderMedianLine(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  // Match the rangeBar box width calculation
  var barHalfWidth = (layer.options && layer.options.rangeBarWidth
    ? layer.options.rangeBarWidth
    : Math.max(6, Math.min(60, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)))) / 2;

  var lines = chart.chart
    .selectAll("." + tagName("medianLine", chart.element.id, layer.label))
    .data(layer.data);

  lines.exit().transition().remove();

  lines.transition()
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]) - barHalfWidth; })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]) + barHalfWidth; })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.y_var]); });

  lines.enter()
    .append("line")
    .style("fill", "none")
    .style("stroke", "white")
    .style("stroke-width", "2px")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("y2", function(d) { return chart.yScale(d[layer.mapping.y_var]); })
    .attr("class", tagName("medianLine", chart.element.id, layer.label))
    .transition()
    .delay(transitionSpeed)
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .style("opacity", 1)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]) - barHalfWidth; })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]) + barHalfWidth; });
}

function renderWhiskerCaps(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var capHalfWidth = 8;
  var isLow = layer._compositeRole === "whisker_low";
  var capYField = isLow ? layer.mapping.low_y : layer.mapping.high_y;

  var caps = chart.chart
    .selectAll("." + tagName("whiskerCap", chart.element.id, layer.label))
    .data(layer.data);

  caps.exit().transition().remove();

  caps.transition()
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]) - capHalfWidth; })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]) + capHalfWidth; })
    .attr("y1", function(d) { return chart.yScale(d[capYField]); })
    .attr("y2", function(d) { return chart.yScale(d[capYField]); });

  caps.enter()
    .append("line")
    .style("fill", "none")
    .style("stroke", "black")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("opacity", 0.5)
    // Start collapsed at the whisker endpoint (center point)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[capYField]); })
    .attr("y2", function(d) { return chart.yScale(d[capYField]); })
    .attr("class", tagName("whiskerCap", chart.element.id, layer.label))
    .transition()
    // Wait for whisker line to finish growing, then open the cap
    .delay(transitionSpeed * 2)
    .duration(transitionSpeed)
    .ease(d3.easeQuad)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]) - capHalfWidth; })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]) + capHalfWidth; });
}

function renderWhiskerLine(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var isLow = layer._compositeRole === "whisker_low";
  // Whisker grows FROM the box edge TOWARD the whisker endpoint
  var boxEdgeField = isLow ? layer.mapping.high_y : layer.mapping.low_y;
  var whiskerEndField = isLow ? layer.mapping.low_y : layer.mapping.high_y;

  var lines = chart.chart
    .selectAll("." + tagName("crosshairY", chart.element.id, layer.label))
    .data(layer.data);

  lines.exit().transition().remove();

  lines.transition()
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("y1", function(d) { return chart.yScale(d[boxEdgeField]); })
    .attr("y2", function(d) { return chart.yScale(d[whiskerEndField]); });

  lines.enter()
    .append("line")
    .style("fill", "none")
    .style("stroke", "black")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("opacity", 0.5)
    .attr("x1", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    .attr("x2", function(d) { return chart.xScale(d[layer.mapping.x_var]); })
    // Start at box edge
    .attr("y1", function(d) { return chart.yScale(d[boxEdgeField]); })
    .attr("y2", function(d) { return chart.yScale(d[boxEdgeField]); })
    .attr("class", tagName("crosshairY", chart.element.id, layer.label))
    .transition()
    .delay(transitionSpeed)
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    // Grow toward whisker endpoint
    .attr("y2", function(d) { return chart.yScale(d[whiskerEndField]); });
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

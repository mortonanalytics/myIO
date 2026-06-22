import { easingFor } from "../transitions/easing.js";
import { tagName } from "../utils/responsive.js";

export class RangeBarRenderer {
  static type = "rangeBar";
  static traits = { hasAxes: true, referenceLines: false, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["low_y", "high_y"], domainMerge: "union" };
  static dataContract = { x_var: { required: true }, low_y: { required: true, numeric: true }, high_y: { required: true, numeric: true } };

  render(chart, layer) {
    if (layer.options && layer.options.style === "errorbar") {
      renderErrorBars(chart, layer);
      return;
    }

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

    function midpointY(d) {
      return chart.yScale((+d[lowVar] + +d[highVar]) / 2);
    }
    function topY(d) {
      return chart.yScale(Math.max(+d[lowVar], +d[highVar]));
    }
    function rangeHeight(d) {
      return Math.abs(chart.yScale(+d[lowVar]) - chart.yScale(+d[highVar]));
    }
    function rangeFill(d) {
      if (typeof chart.colorDiscrete === "function" && d[layer.mapping.group]) {
        return chart.colorDiscrete(d[layer.mapping.group]);
      }
      return layer.color || "#6b7280";
    }

    var newBars = bars.enter()
      .append("rect")
      .attr("class", tagName("rangeBar", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("x", function(d) { return chart.xScale(d[xVar]) - barWidth / 2; })
      .attr("y", midpointY)
      .attr("width", barWidth)
      .attr("height", 0)
      .attr("fill", rangeFill);

    bars.merge(newBars)
      .transition()
      .ease(easingFor(chart, d3.easeQuad))
      .duration(transitionSpeed)
      .attr("x", function(d) { return chart.xScale(d[xVar]) - barWidth / 2; })
      .attr("y", topY)
      .attr("width", barWidth)
      .attr("height", rangeHeight)
      .attr("fill", rangeFill);
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
    chart.dom.chartArea.selectAll("." + tagName("rangeBar-error", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

function renderErrorBars(chart, layer) {
  var transitionSpeed = chart.options.transition.speed;
  var xVar = layer.mapping.x_var;
  var lowVar = layer.mapping.low_y;
  var highVar = layer.mapping.high_y;
  var meanVar = layer.mapping.y_var;
  if (!meanVar) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("myIO RangeBarRenderer: style='errorbar' requires a y_var mapping for the mean point. Skipping render for layer '" + (layer.label || "(unnamed)") + "'.");
    }
    return;
  }
  var color = layer.color || "#4269D0";
  var capWidth = layer.options && layer.options.capWidth ? layer.options.capWidth : 18;
  var radius = layer.options && layer.options.pointRadius ? layer.options.pointRadius : 4;

  function centerX(d) {
    var x = chart.xScale(d[xVar]);
    if (chart.xScale.bandwidth) {
      x += chart.xScale.bandwidth() / 2;
    }
    return x;
  }
  function lowY(d) { return chart.yScale(+d[lowVar]); }
  function highY(d) { return chart.yScale(+d[highVar]); }
  function meanY(d) { return chart.yScale(+d[meanVar]); }

  var groups = chart.chart
    .selectAll("." + tagName("rangeBar-error", chart.element.id, layer.label))
    .data(layer.data);

  groups.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

  var enter = groups.enter()
    .append("g")
    .attr("class", tagName("rangeBar-error", chart.element.id, layer.label))
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("opacity", 0);

  enter.append("line").attr("class", "mean-ci-whisker")
    .attr("x1", centerX).attr("x2", centerX)
    .attr("y1", meanY).attr("y2", meanY)
    .attr("stroke", color).attr("stroke-width", 2);
  enter.append("line").attr("class", "mean-ci-cap mean-ci-cap-low")
    .attr("x1", centerX).attr("x2", centerX)
    .attr("y1", meanY).attr("y2", meanY)
    .attr("stroke", color).attr("stroke-width", 2);
  enter.append("line").attr("class", "mean-ci-cap mean-ci-cap-high")
    .attr("x1", centerX).attr("x2", centerX)
    .attr("y1", meanY).attr("y2", meanY)
    .attr("stroke", color).attr("stroke-width", 2);
  enter.append("circle").attr("class", "mean-ci-point")
    .attr("cx", centerX).attr("cy", meanY)
    .attr("r", 0)
    .attr("fill", color)
    .attr("stroke", "var(--chart-bg, #ffffff)")
    .attr("stroke-width", 1.5);

  var merged = groups.merge(enter);

  merged
    .transition().ease(easingFor(chart, d3.easeQuad)).duration(transitionSpeed)
    .style("opacity", 1);

  merged.select(".mean-ci-whisker")
    .transition().ease(easingFor(chart, d3.easeQuad)).duration(transitionSpeed)
    .attr("x1", centerX).attr("x2", centerX)
    .attr("y1", lowY).attr("y2", highY)
    .attr("stroke", color);

  merged.select(".mean-ci-cap-low")
    .transition().ease(easingFor(chart, d3.easeQuad)).duration(transitionSpeed)
    .attr("x1", function(d) { return centerX(d) - capWidth / 2; })
    .attr("x2", function(d) { return centerX(d) + capWidth / 2; })
    .attr("y1", lowY).attr("y2", lowY)
    .attr("stroke", color);

  merged.select(".mean-ci-cap-high")
    .transition().ease(easingFor(chart, d3.easeQuad)).duration(transitionSpeed)
    .attr("x1", function(d) { return centerX(d) - capWidth / 2; })
    .attr("x2", function(d) { return centerX(d) + capWidth / 2; })
    .attr("y1", highY).attr("y2", highY)
    .attr("stroke", color);

  merged.select(".mean-ci-point")
    .transition().ease(easingFor(chart, d3.easeQuad)).duration(transitionSpeed)
    .attr("cx", centerX).attr("cy", meanY)
    .attr("r", radius)
    .attr("fill", color);
}

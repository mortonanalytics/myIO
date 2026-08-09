import { easingFor } from "../transitions/easing.js";
import { getChartHeight } from "../layout/scaffold.js";

export class GaugeRenderer {
  static type = "gauge";
  static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static scaleHints = null;
  static dataContract = { value: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var tau = Math.PI;
    var radius = Math.max(Math.min(chart.width, getChartHeight(chart)) / 2, 30);
    var barWidth = 30;
    var firstDatum = Array.isArray(layer.data) && layer.data.length > 0 ? layer.data[0] : {};
    var valueKey = layer.mapping.value;
    var value = typeof valueKey === "string" ? +firstDatum[valueKey] : +valueKey;
    if (!Number.isFinite(value)) {
      value = 0;
    }
    value = Math.max(0, Math.min(1, value));
    var data = [value, 1 - value];
    var arc = d3.arc().innerRadius(radius - barWidth).outerRadius(radius).cornerRadius(10);
    var bandArc = d3.arc().innerRadius(radius - barWidth).outerRadius(radius);
    var pie = d3.pie().sort(null).value(function(d) { return d; }).startAngle(tau * -0.5).endAngle(tau * 0.5);
    var percentFormat = d3.format(".1%");
    var thresholds = layer.options && Array.isArray(layer.options.thresholds)
      ? layer.options.thresholds
      : [
          { min: 0, max: 0.6, color: "#3CA951" },
          { min: 0.6, max: 0.85, color: "#FFB000" },
          { min: 0.85, max: 1, color: "#EF603B" }
        ];

    function bandArcFor(d) {
      return bandArc({
        startAngle: tau * -0.5 + tau * Math.max(0, Math.min(1, +d.min || 0)),
        endAngle: tau * -0.5 + tau * Math.max(0, Math.min(1, +d.max || 0))
      });
    }

    var bands = chart.chart.selectAll(".myIO-gauge-threshold").data(thresholds);

    bands.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var bandsEnter = bands.enter().append("path")
      .attr("class", "myIO-gauge-threshold")
      .attr("fill", function(d) { return d.color; })
      .attr("opacity", 0)
      .attr("d", bandArcFor);

    bandsEnter.merge(bands)
      .transition().duration(transitionSpeed).ease(easingFor(chart, d3.easeQuad))
      .attr("fill", function(d) { return d.color; })
      .attr("opacity", 0.24)
      .attr("d", bandArcFor);

    var pathBackground = chart.chart.selectAll(".myIO-gauge-background").data(pie([1]));

    pathBackground.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var newPathBackground = pathBackground.enter().append("path")
      .attr("class", "myIO-gauge-background")
      .attr("fill", "rgba(107, 114, 128, 0.22)")
      .attr("d", arc)
      .each(function(d) { this._current = d; });

    newPathBackground.merge(pathBackground)
      .transition().duration(transitionSpeed).ease(easingFor(chart, d3.easeBack))
      .attr("fill", "rgba(107, 114, 128, 0.22)")
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(1);
        return function(t) { return arc(i(t)); };
      });

    var path = chart.chart.selectAll(".myIO-gauge-value").data(pie(data));

    path.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var newPath = path.enter().append("path")
      .attr("class", "myIO-gauge-value")
      .attr("fill", function(d, i) { return [layer.color || colorForValue(value, thresholds), "transparent"][i]; })
      .attr("d", arc)
      .each(function(d) { this._current = d; });

    newPath.merge(path)
      .transition().duration(transitionSpeed).ease(easingFor(chart, d3.easeBack))
      .attr("fill", function(d, i) { return [layer.color || colorForValue(value, thresholds), "transparent"][i]; })
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(1);
        return function(t) { return arc(i(t)); };
      });

    chart.chart.selectAll(".gauge-text")
      .data([data[0]])
      .join("text")
      .attr("class", "gauge-text")
      .text(function(d) { return percentFormat(d); })
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("dy", "-0.45em");

    chart.chart.selectAll(".gauge-label")
      .data([layer.options && layer.options.metric ? layer.options.metric : layer.label])
      .join("text")
      .attr("class", "gauge-label")
      .text(function(d) { return d; })
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("dy", "1.1em");

    chart.chart.selectAll(".gauge-min-label")
      .data(["0%"])
      .join("text")
      .attr("class", "gauge-min-label")
      .text(function(d) { return d; })
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("x", -radius + barWidth / 2)
      .attr("y", 12);

    chart.chart.selectAll(".gauge-max-label")
      .data(["100%"])
      .join("text")
      .attr("class", "gauge-max-label")
      .text(function(d) { return d; })
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("x", radius - barWidth / 2)
      .attr("y", 12);
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".myIO-gauge-threshold, .myIO-gauge-background, .myIO-gauge-value, .gauge-text, .gauge-label, .gauge-min-label, .gauge-max-label").transition().ease(easingFor(chart, d3.easeCubic)).duration(500).style("opacity", 0).remove();
  }
}

function colorForValue(value, thresholds) {
  var match = thresholds.find(function(threshold) {
    return value >= +threshold.min && value <= +threshold.max;
  });
  return match && match.color ? match.color : "#4269D0";
}

import { getChartHeight } from "../layout/scaffold.js";

export class GaugeRenderer {
  static type = "gauge";
  static traits = { hasAxes: false, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
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
    var pie = d3.pie().sort(null).value(function(d) { return d; }).startAngle(tau * -0.5).endAngle(tau * 0.5);
    var percentFormat = d3.format(".1%");

    var pathBackground = chart.chart.selectAll(".myIO-gauge-background").data(pie([1]));
    pathBackground.exit().remove();
    var newPathBackground = pathBackground.enter().append("path")
      .attr("class", "myIO-gauge-background")
      .attr("fill", "gray")
      .transition().duration(transitionSpeed).ease(d3.easeBack)
      .attr("d", arc)
      .each(function() { this._current = 0; });

    pathBackground.transition().duration(transitionSpeed).ease(d3.easeBack)
      .duration(transitionSpeed)
      .attr("fill", "gray")
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) { return arc(i(t)); };
      });

    var path = chart.chart.selectAll(".myIO-gauge-value").data(pie(data));
    path.exit().remove();
    var newPath = path.enter().append("path")
      .attr("class", "myIO-gauge-value")
      .attr("fill", function(d, i) { return [layer.color, "transparent"][i]; })
      .transition().duration(transitionSpeed).ease(d3.easeBack)
      .attr("d", arc)
      .each(function() { this._current = 0; });

    path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeBack)
      .duration(transitionSpeed)
      .attr("fill", function(d, i) { return [layer.color, "transparent"][i]; })
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
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
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".myIO-gauge-background, .myIO-gauge-value, .gauge-text").transition().duration(500).style("opacity", 0).remove();
  }
}

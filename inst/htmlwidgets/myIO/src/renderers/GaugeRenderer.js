export class GaugeRenderer {
  static type = "gauge";

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var tau = Math.PI;
    var radius = Math.max(Math.min(chart.width, (chart.totalWidth > 600 ? chart.height : chart.height * 0.8)) / 2, 30);
    var barWidth = 30;
    var value = layer.data[0].value[0];
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

    chart.chart.selectAll(".gauge-text").remove();
    chart.chart.append("g").append("text")
      .attr("class", "gauge-text")
      .text(percentFormat(data[0]))
      .attr("text-anchor", "middle")
      .attr("font-size", 20)
      .attr("dy", "-0.45em");
  }
}

import { isColorSchemeActive } from "../utils/responsive.js";

export class DonutRenderer {
  static type = "donut";
  static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var m = chart.margin;
    var transitionSpeed = chart.options.transition.speed;
    var radius = Math.min(chart.width - (m.right + m.left), chart.height - (m.top + m.bottom)) / 2;
    var pie = d3.pie().sort(null).value(function(d) { return d[layer.mapping.y_var]; });
    var arc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.4);
    var outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
    var data = layer.data;

    if (isColorSchemeActive(chart)) {
      chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
    } else {
      chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(layer.data.map(function(d) { return d[layer.mapping.x_var]; }));
    }

    var path = chart.chart.selectAll(".donut").data(pie(data));
    path.exit().remove();

    var newPath = path.enter().append("path")
      .attr("class", "donut")
      .attr("fill", function(d, i) { return chart.colorDiscrete(i); })
      .attr("d", arc)
      .each(function() { this._current = 0; });

    path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeQuad)
      .attr("fill", function(d, i) { return chart.colorDiscrete(i); })
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) { return arc(i(t)); };
      });

    var textLabel = chart.chart.selectAll("text").data(pie(data));
    var newText = textLabel.enter().append("text")
      .attr("class", "inner-text")
      .style("font-size", "12px")
      .style("opacity", 0)
      .attr("dy", ".35em")
      .text(function(d) { return d.data[layer.mapping.x_var]; });

    function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

    textLabel.merge(newText).transition().duration(transitionSpeed).ease(d3.easeQuad)
      .text(function(d) { return d.data[layer.mapping.x_var]; })
      .style("opacity", function(d) { return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0; })
      .attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
          return "translate(" + pos + ")";
        };
      })
      .styleTween("text-anchor", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });
    textLabel.exit().remove();

    var polyline = chart.chart.selectAll("polyline").data(pie(data));
    var newPolyline = polyline.enter().append("polyline")
      .style("fill", "none")
      .style("stroke-width", "1px")
      .style("opacity", 0)
      .style("stroke", "gray");

    polyline.merge(newPolyline).transition().duration(transitionSpeed).ease(d3.easeQuad)
      .style("opacity", function(d) { return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0; })
      .attrTween("points", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(0);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });
    polyline.exit().remove();

    chart.updateOrdinalColorLegend(layer);
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".donut, text, polyline").transition().duration(500).style("opacity", 0).remove();
  }
}

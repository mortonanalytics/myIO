import { isColorSchemeActive } from "../utils/responsive.js";

export class DonutRenderer {
  static type = "donut";
  static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static scaleHints = null;
  static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var m = chart.margin;
    var transitionSpeed = chart.options.transition.speed;
    var radius = Math.min(chart.width - (m.right + m.left), chart.height - (m.top + m.bottom)) / 2;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;

    // Color scale always built from full data so colors are stable
    if (isColorSchemeActive(chart)) {
      chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
    } else {
      chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(layer.data.map(function(d) { return d[xVar]; }));
    }

    // Filter out hidden segments
    var hidden = chart.runtime._hiddenOrdinalSegments || [];
    var data = layer.data.filter(function(d) {
      return hidden.indexOf(d[xVar]) === -1;
    });

    var pie = d3.pie().sort(null).value(function(d) { return d[yVar]; });
    var arc = d3.arc().innerRadius(radius * 0.8).outerRadius(radius * 0.4);
    var outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);

    var path = chart.chart.selectAll(".donut").data(pie(data), function(d) { return d.data[xVar]; });
    path.exit().transition().duration(transitionSpeed).ease(d3.easeQuad)
      .attrTween("d", function(a) {
        var end = { startAngle: a.endAngle, endAngle: a.endAngle };
        var i = d3.interpolate(a, end);
        return function(t) { return arc(i(t)); };
      })
      .remove();

    var newPath = path.enter().append("path")
      .attr("class", "donut")
      .attr("fill", function(d) { return chart.colorDiscrete(d.data[xVar]); })
      .attr("d", arc)
      .each(function(d) { this._current = d; });

    path.merge(newPath).transition().duration(transitionSpeed).ease(d3.easeQuad)
      .attr("fill", function(d) { return chart.colorDiscrete(d.data[xVar]); })
      .attrTween("d", function(a) {
        this._current = this._current || a;
        var i = d3.interpolate(this._current, a);
        this._current = i(1);
        return function(t) { return arc(i(t)); };
      });

    function midAngle(d) { return d.startAngle + (d.endAngle - d.startAngle) / 2; }

    var textLabel = chart.chart.selectAll(".inner-text").data(pie(data), function(d) { return d.data[xVar]; });
    textLabel.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newText = textLabel.enter().append("text")
      .attr("class", "inner-text")
      .style("font-size", "12px")
      .style("opacity", 0)
      .attr("dy", ".35em")
      .text(function(d) { return d.data[xVar]; });

    textLabel.merge(newText).transition().duration(transitionSpeed).ease(d3.easeQuad)
      .text(function(d) { return d.data[xVar]; })
      .style("opacity", function(d) { return Math.abs(d.endAngle - d.startAngle) > 0.3 ? 1 : 0; })
      .attrTween("transform", function(d) {
        this._current = this._current || d;
        var interpolate = d3.interpolate(this._current, d);
        this._current = interpolate(1);
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
        this._current = interpolate(1);
        return function(t) {
          var d2 = interpolate(t);
          return midAngle(d2) < Math.PI ? "start" : "end";
        };
      });

    var polyline = chart.chart.selectAll("polyline").data(pie(data), function(d) { return d.data[xVar]; });
    polyline.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

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
        this._current = interpolate(1);
        return function(t) {
          var d2 = interpolate(t);
          var pos = outerArc.centroid(d2);
          pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
          return [arc.centroid(d2), outerArc.centroid(d2), pos];
        };
      });

    chart.updateOrdinalColorLegend(layer);
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".donut, .inner-text, polyline").transition().duration(500).style("opacity", 0).remove();
  }
}

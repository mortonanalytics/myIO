export class HistogramRenderer {
  static type = "histogram";

  render(chart, layer) {
    var data = layer.bins;
    var key = layer.label;
    var transitionSpeed = chart.options.transition.speed;

    var bars = chart.chart
      .selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
      .data(data);

    bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();

    var newBars = bars.enter()
      .append("rect")
      .attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("fill", function(d) {
        return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
      })
      .attr("x", function(d) { return chart.xScale(d.x0) + 1; })
      .attr("y", chart.yScale(0))
      .attr("width", function(d) { return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1); })
      .attr("height", chart.yScale(0));

    bars.merge(newBars)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x", function(d) { return chart.xScale(d.x0) + 1; })
      .attr("width", function(d) { return Math.max(0, chart.xScale(d.x1) - chart.xScale(d.x0) - 1); })
      .attr("y", function(d) { return chart.yScale(d.length); })
      .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d.length); });
  }
}

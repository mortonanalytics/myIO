export class HexbinRenderer {
  static type = "hexbin";

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var points = layer.data.map(function(d) {
      return { 0: chart.xScale(+d[layer.mapping.x_var]), 1: chart.yScale(+d[layer.mapping.y_var]) };
    }).sort(function(d) { return d3.ascending(d.index); });
    var x_extent = d3.extent(layer.data, function(d) { return +d[layer.mapping.x_var]; });
    var y_extent = d3.extent(layer.data, function(d) { return +d[layer.mapping.y_var]; });
    var hexbin = d3.hexbin()
      .radius(layer.mapping.radius * (Math.min(chart.width, chart.height) / 1000))
      .extent([[x_extent[0], y_extent[0]], [x_extent[1], y_extent[1]]]);
    var binnedData = hexbin(points);

    chart.colorContinuous = d3.scaleSequential(d3.interpolateBuPu)
      .domain([0, d3.max(binnedData, function(d) { return d.length; })]);

    var bins = chart.chart
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .selectAll(".tag-hexbin-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
      .data(binnedData);

    bins.exit().transition().duration(transitionSpeed).remove();

    var newbins = bins.enter()
      .append("path")
      .attr("class", "tag-hexbin-" + chart.element.id + "-" + layer.label.replace(/\s+/g, ""))
      .attr("d", hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", "white");

    bins.merge(newbins)
      .transition().ease(d3.easeQuad).duration(transitionSpeed)
      .attr("d", hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", function(d) { return chart.colorContinuous(d.length); });
  }
}

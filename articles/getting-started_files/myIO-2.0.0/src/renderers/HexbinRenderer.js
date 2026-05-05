import { tagName } from "../utils/responsive.js";

export class HexbinRenderer {
  static type = "hexbin";
  static traits = { hasAxes: true, referenceLines: false, legendType: "continuous", binning: false, rolloverStyle: "hex", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true }, radius: { required: true, numeric: true, positive: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var points = layer.data.map(function(d) {
      return { 0: chart.xScale(+d[layer.mapping.x_var]), 1: chart.yScale(+d[layer.mapping.y_var]) };
    }).sort(function(d) { return d3.ascending(d.index); });
    var x_extent = d3.extent(layer.data, function(d) { return +d[layer.mapping.x_var]; });
    var y_extent = d3.extent(layer.data, function(d) { return +d[layer.mapping.y_var]; });
    var radius = typeof layer.mapping.radius === "number" ? layer.mapping.radius : +layer.mapping.radius;
    var hexbin = d3.hexbin()
      .radius(radius * (Math.min(chart.width, chart.height) / 1000))
      .extent([[x_extent[0], y_extent[0]], [x_extent[1], y_extent[1]]]);
    var binnedData = hexbin(points);

    chart.colorContinuous = d3.scaleSequential(d3.interpolateBuPu)
      .domain([0, d3.max(binnedData, function(d) { return d.length; })]);

    var bins = chart.chart
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .selectAll("." + tagName("hexbin", chart.element.id, layer.label))
      .data(binnedData);

    bins.exit().transition().duration(transitionSpeed).remove();

    var newbins = bins.enter()
      .append("path")
      .attr("class", tagName("hexbin", chart.element.id, layer.label))
      .attr("d", hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", "white");

    bins.merge(newbins)
      .transition().ease(d3.easeQuad).duration(transitionSpeed)
      .attr("d", hexbin.hexagon())
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .attr("fill", function(d) { return chart.colorContinuous(d.length); });
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("hexbin", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d) {
    return { title: "x: " + chart.derived.xScale.invert(d.x) + ", y: " + chart.derived.yScale.invert(d.y), body: "Count: " + d.length, color: chart.derived.colorContinuous(d.length), label: "count", value: d.length, raw: d };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("hexbin", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

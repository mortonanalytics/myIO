import { tagName } from "../utils/responsive.js";

export class HeatmapRenderer {
  static type = "heatmap";
  static traits = { hasAxes: true, referenceLines: false, legendType: "continuous", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "band", yScaleType: "band", yExtentFields: ["value"], domainMerge: "union" };
  static dataContract = { x_var: { required: true }, y_var: { required: true }, value: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var valueVar = layer.mapping.value;
    var values = layer.data.map(function(d) {
      return +d[valueVar];
    });
    var extent = d3.extent(values.filter(function(v) {
      return Number.isFinite(v);
    }));

    if (!extent || extent[0] === undefined || extent[1] === undefined) {
      extent = [0, 1];
    }

    chart.derived.colorContinuous = d3.scaleSequential(d3.interpolateBlues).domain(extent);
    chart.colorContinuous = chart.derived.colorContinuous;

    var cells = chart.chart
      .selectAll("." + tagName("heatmap", chart.element.id, layer.label))
      .data(layer.data);

    cells.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var cellWidth = chart.xScale.bandwidth ? chart.xScale.bandwidth() : 0;
    var cellHeight = chart.yScale.bandwidth ? chart.yScale.bandwidth() : 0;

    var newCells = cells.enter()
      .append("rect")
      .attr("class", tagName("heatmap", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("opacity", 0);

    cells.merge(newCells)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x", function(d) { return chart.xScale(d[xVar]); })
      .attr("y", function(d) { return chart.yScale(d[yVar]); })
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .attr("fill", function(d) { return chart.colorContinuous(+d[valueVar]); })
      .style("opacity", 1);
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("heatmap", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d, layer) {
    return {
      title: layer.mapping.x_var + ": " + d[layer.mapping.x_var] + ", " + layer.mapping.y_var + ": " + d[layer.mapping.y_var],
      body: layer.mapping.value + ": " + d[layer.mapping.value],
      color: chart.colorContinuous ? chart.colorContinuous(+d[layer.mapping.value]) : layer.color,
      label: layer.label,
      value: d[layer.mapping.value],
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("heatmap", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

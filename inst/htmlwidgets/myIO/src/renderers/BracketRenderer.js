import { tagName } from "../utils/responsive.js";

export class BracketRenderer {
  static type = "bracket";
  static traits = {
    hasAxes: true,
    referenceLines: false,
    legendType: "none",
    binning: false,
    rolloverStyle: "none",
    scaleCapabilities: { invertX: false }
  };
  static scaleHints = {
    xScaleType: "linear",
    yScaleType: "linear",
    xExtentFields: [],
    yExtentFields: ["y"],
    domainMerge: "union"
  };
  static dataContract = {
    x1: { required: true, numeric: true },
    x2: { required: true, numeric: true },
    y:  { required: true, numeric: true }
  };

  render(chart, layer) {
    var className = tagName("bracket", chart.element.id, layer.label);
    var tickHeight = 6;
    var labelOffset = 4;
    var transitionSpeed = chart.options.transition.speed;
    var color = layer.color || "var(--text-color, #333)";

    chart.chart.selectAll("." + className).remove();

    var g = chart.chart.append("g")
      .attr("class", className)
      .attr("clip-path", "url(#" + chart.element.id + "clip)");

    layer.data.forEach(function(d) {
      var sx1 = chart.xScale(+d.x1);
      var sx2 = chart.xScale(+d.x2);
      var sy  = chart.yScale(+d.y);

      var bracket = g.append("g").style("opacity", 0);

      // Horizontal line
      bracket.append("line")
        .attr("x1", sx1).attr("y1", sy)
        .attr("x2", sx2).attr("y2", sy)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Left tick
      bracket.append("line")
        .attr("x1", sx1).attr("y1", sy)
        .attr("x2", sx1).attr("y2", sy + tickHeight)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Right tick
      bracket.append("line")
        .attr("x1", sx2).attr("y1", sy)
        .attr("x2", sx2).attr("y2", sy + tickHeight)
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // P-value label
      bracket.append("text")
        .attr("x", (sx1 + sx2) / 2)
        .attr("y", sy - labelOffset)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-family", "var(--font-family, sans-serif)")
        .style("fill", color)
        .text(d.label);

      bracket.transition()
        .duration(transitionSpeed)
        .style("opacity", 1);
    });
  }

  formatTooltip() { return null; }

  remove(chart, layer) {
    var className = tagName("bracket", chart.element.id, layer.label);
    chart.chart.selectAll("." + className).remove();
  }
}

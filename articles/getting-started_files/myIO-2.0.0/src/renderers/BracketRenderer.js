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

    // Stable root + data join on brackets so updates animate and exit fades.
    var g = chart.chart.selectAll("g." + className + "-root")
      .data([null])
      .join("g")
      .attr("class", className + "-root")
      .attr("clip-path", "url(#" + chart.element.id + "clip)");

    var bracketKey = function(d, i) { return d.label != null ? String(d.label) + "_" + i : String(i); };

    var bracketSelection = g.selectAll("g." + className)
      .data(layer.data, bracketKey);

    bracketSelection.exit()
      .transition().duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var bracketEnter = bracketSelection.enter().append("g")
      .attr("class", className)
      .style("opacity", 0);

    bracketEnter.append("line").attr("class", "bracket-bar")
      .attr("stroke", color).attr("stroke-width", 1.5);
    bracketEnter.append("line").attr("class", "bracket-tick-left")
      .attr("stroke", color).attr("stroke-width", 1.5);
    bracketEnter.append("line").attr("class", "bracket-tick-right")
      .attr("stroke", color).attr("stroke-width", 1.5);
    bracketEnter.append("text").attr("class", "bracket-label")
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("font-family", "var(--font-family, sans-serif)")
      .style("fill", color);

    var merged = bracketEnter.merge(bracketSelection);

    merged
      .transition().duration(transitionSpeed)
      .style("opacity", 1);

    merged.select(".bracket-bar")
      .transition().duration(transitionSpeed)
      .attr("x1", function(d) { return chart.xScale(+d.x1); })
      .attr("y1", function(d) { return chart.yScale(+d.y); })
      .attr("x2", function(d) { return chart.xScale(+d.x2); })
      .attr("y2", function(d) { return chart.yScale(+d.y); });

    merged.select(".bracket-tick-left")
      .transition().duration(transitionSpeed)
      .attr("x1", function(d) { return chart.xScale(+d.x1); })
      .attr("y1", function(d) { return chart.yScale(+d.y); })
      .attr("x2", function(d) { return chart.xScale(+d.x1); })
      .attr("y2", function(d) { return chart.yScale(+d.y) + tickHeight; });

    merged.select(".bracket-tick-right")
      .transition().duration(transitionSpeed)
      .attr("x1", function(d) { return chart.xScale(+d.x2); })
      .attr("y1", function(d) { return chart.yScale(+d.y); })
      .attr("x2", function(d) { return chart.xScale(+d.x2); })
      .attr("y2", function(d) { return chart.yScale(+d.y) + tickHeight; });

    merged.select(".bracket-label")
      .text(function(d) { return d.label; })
      .transition().duration(transitionSpeed)
      .attr("x", function(d) { return (chart.xScale(+d.x1) + chart.xScale(+d.x2)) / 2; })
      .attr("y", function(d) { return chart.yScale(+d.y) - labelOffset; });
  }

  formatTooltip() { return null; }

  remove(chart, layer) {
    var className = tagName("bracket", chart.dom.element.id, layer.label);
    chart.chart.selectAll("." + className).remove();
  }
}

import { tagName } from "../utils/responsive.js";

export class TextRenderer {
  static type = "text";
  static traits = {
    hasAxes: false,
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
    yExtentFields: [],
    domainMerge: "union"
  };
  static dataContract = {};

  render(chart, layer) {
    var position = (layer.options && layer.options.position) || "top-right";
    var key = layer.label;
    var className = tagName("text-annotation", chart.element.id, key);

    chart.chart.selectAll("." + className).remove();

    var lines = layer.data.map(function(d) { return d.text; });

    var isTop = position.indexOf("top") !== -1;
    var isRight = position.indexOf("right") !== -1;

    var x = isRight ? chart.width - 10 : 10;
    var y = isTop ? 20 : chart.height - 10;
    var anchor = isRight ? "end" : "start";

    var g = chart.chart.append("g")
      .attr("class", className)
      .attr("transform", "translate(" + x + "," + y + ")");

    lines.forEach(function(line, i) {
      g.append("text")
        .attr("y", (isTop ? 1 : -1) * i * 16)
        .attr("text-anchor", anchor)
        .style("font-size", "12px")
        .style("font-family", "var(--font-family, sans-serif)")
        .style("fill", "var(--text-color, #333)")
        .style("opacity", 0.8)
        .text(line);
    });
  }

  formatTooltip() { return null; }

  remove(chart, layer) {
    var className = tagName("text-annotation", chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll("." + className).remove();
  }
}

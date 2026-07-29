import { easingFor } from "../transitions/easing.js";
import { syncOrdinalLegendData } from "../layout/legend.js";
import { getChartHeight } from "../layout/scaffold.js";
import { isColorSchemeActive, tagName } from "../utils/responsive.js";

export class TreemapRenderer {
  static type = "treemap";
  static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static scaleHints = null;
  static dataContract = { level_1: { required: true }, level_2: { required: true }, y_var: { required: false, numeric: true } };

  render(chart, layer) {
    var m = chart.margin;
    var format = d3.format(",d");
    var key = layer.label;

    if (isColorSchemeActive(chart)) {
      chart.colorDiscrete = d3.scaleOrdinal().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
      chart.colorContinuous = d3.scaleLinear().range(chart.options.colorScheme[0]).domain(chart.options.colorScheme[1]);
    } else {
      var colorKey = layer.data.children.map(function(d) { return d.name; });
      chart.colorDiscrete = d3.scaleOrdinal().range(layer.color).domain(colorKey);
    }

    var root = d3.hierarchy(layer.data)
      .eachBefore(function(d) { d.data.id = (d.parent ? d.parent.data.id + "." : "") + d.data.name; })
      .sum(function(d) { return d[layer.mapping.y_var]; })
      .sort(function(a, b) { return b.height - a.height || b.value - a.value; });

    d3.treemap()
      .tile(d3.treemapResquarify)
      .size([chart.width - (m.left + m.right), getChartHeight(chart) - (m.top + m.bottom)])
      .round(true)
      .paddingInner(1)(root);

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;
    var cell = chart.chart.selectAll(".root").data(root.leaves(), function(d) { return d.data.id; });

    cell.exit()
      .transition().duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var newCell = cell.enter().append("g")
      .attr("class", "root")
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; })
      .style("opacity", 0);

    newCell.append("rect")
      .attr("class", tagName("tree", chart.element.id, key))
      .attr("id", function(d) { return d.data.id; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) { while (d.depth > 1) d = d.parent; return chart.colorDiscrete(d.data.id); });

    newCell.append("text")
      .attr("class", "inner-text")
      .attr("fill", "black");

    newCell.append("title");

    var merged = newCell.merge(cell);

    merged
      .transition().duration(transitionSpeed).ease(easingFor(chart, d3.easeQuad))
      .style("opacity", 1)
      .attr("transform", function(d) { return "translate(" + d.x0 + "," + d.y0 + ")"; });

    merged.select("rect")
      .transition().duration(transitionSpeed).ease(easingFor(chart, d3.easeQuad))
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return d.y1 - d.y0; })
      .attr("fill", function(d) { while (d.depth > 1) d = d.parent; return chart.colorDiscrete(d.data.id); });

    var labelSelection = merged.select("text.inner-text")
      .selectAll("tspan")
      .data(function(d) { return treemapLabelLines(d, layer, format); });

    labelSelection.exit().remove();

    labelSelection.enter().append("tspan")
      .attr("fill", "black")
      .merge(labelSelection)
      .attr("x", 3)
      .attr("y", function(d, i, nodes) { return (i === nodes.length - 1) * 3 + 16 + (i - 0.5) * 9; })
      .attr("fill-opacity", function() { return hasReadableCellWidth(this.parentNode.parentNode) ? 1 : 0; })
      .text(function(d) { return d; });

    merged.select("title")
      .text(function(d) {
        return d.data[layer.mapping.level_1] + "  \n" + d.data[layer.mapping.level_2] + "  \n" + d.data[layer.mapping.x_var] + "  \n" + format(d.value);
      });

    syncOrdinalLegendData(chart, layer);
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".root").transition().duration(500).style("opacity", 0).remove();
  }
}

function treemapLabelLines(d, layer, format) {
  var rawLabel = String(d.data[layer.mapping.x_var] || d.data[layer.mapping.level_2] || d.data.name || "");
  var width = Math.max(0, d.x1 - d.x0);
  var label = width < 70 && rawLabel.length > 10 ? rawLabel.substring(0, 9) + "..." : rawLabel;
  return label.split(/\s+/).concat(format(d.value));
}

function hasReadableCellWidth(node) {
  if (!node || typeof node.getBBox !== "function") {
    return true;
  }
  return node.getBBox().width > 40;
}

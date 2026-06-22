import { getGroupedDataObject, transitionGrouped, transitionStacked } from "./groupedBarHelpers.js";
import { resolveColor } from "../utils/responsive.js";

export class GroupedBarRenderer {
  static type = "groupedBar";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "band", yScaleType: "linear", yExtentFields: ["y_var"], domainMerge: "union" };
  static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true }, group: { required: true } };

  render(chart, layer, layers) {
    var lys = layers || [layer];
    var data = getGroupedDataObject(lys, chart);
    var colors = lys.map(function(d) { return d.color; });
    var bandwidth = ((chart.width - (chart.margin.right + chart.margin.left)) / data[0].length) / colors.length;

    if (typeof chart.layout == "undefined") {
      chart.layout = "grouped";
    }

    const bars = chart.chart.selectAll("g").data(data);
    bars.exit().remove();
    bars.enter()
      .append("g")
      .style("fill", function(d, i) { return resolveColor(chart, d[layer.mapping.group], colors[i]); })
      .attr("class", "tag-grouped-bar-g");

    bars.merge(bars)
      .style("fill", function(d, i) { return resolveColor(chart, d[layer.mapping.group], colors[i]); })
      .call(function() {
        if (chart.layout === "grouped") {
          transitionGrouped(chart, data, colors, bandwidth);
        } else {
          transitionStacked(chart, data, colors, bandwidth);
        }
      });
  }

  getHoverSelector() {
    return ".tag-grouped-bar-g rect";
  }

  formatTooltip(chart, d, layer) {
    return { title: layer.mapping.x_var + ": " + d.data[0], body: layer.mapping.y_var + ": " + (d[1] - d[0]), color: layer.color, label: layer.label, value: d[1] - d[0], raw: d };
  }

  remove(chart) {
    chart.dom.chartArea.selectAll(".tag-grouped-bar-g").transition().duration(500).style("opacity", 0).remove();
  }
}

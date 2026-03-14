import { getGroupedDataObject, transitionGrouped, transitionStacked } from "./groupedBarHelpers.js";

export class GroupedBarRenderer {
  static type = "groupedBar";

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
      .style("fill", function(d, i) { return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : colors[i]; })
      .attr("class", "tag-grouped-bar-g");

    bars.merge(bars)
      .style("fill", function(d, i) { return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.group]) : colors[i]; })
      .call(function() {
        if (chart.layout === "grouped") {
          transitionGrouped(chart, data, colors, bandwidth);
        } else {
          transitionStacked(chart, data, colors, bandwidth);
        }
      });
  }
}

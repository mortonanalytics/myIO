import { renderSheetLegend } from "../interactions/bottom-sheet.js";
import { buildLegendData, buildOrdinalLegendData } from "./legend-data.js";

export { buildLegendData, buildOrdinalLegendData };

export function syncLegend(chart, state) {
  if (!chart || !chart.runtime) {
    return;
  }

  if (chart.options && chart.options.suppressLegend === true) {
    return;
  }

  chart.runtime._legendState = state || null;
  chart.runtime._legendData = buildLegendData(chart, state);
  renderInlineLegend(chart, chart.runtime._legendData);

  if (chart.runtime._sheetOpen) {
    renderSheetLegend(chart);
  }
}

export function syncOrdinalLegendData(chart, layer) {
  if (!chart || !chart.runtime || chart.runtime._suppressOrdinalLegendRebuild) {
    return;
  }

  chart.runtime._legendState = { ordinalLegend: true };
  chart.runtime._legendData = buildOrdinalLegendData(chart, layer);
  renderInlineLegend(chart, chart.runtime._legendData);

  if (chart.runtime._sheetOpen) {
    renderSheetLegend(chart);
  }
}

function renderInlineLegend(chart, legendData) {
  if (!chart || !chart.svg) {
    return;
  }

  chart.svg.selectAll(".myIO-inline-legend").remove();
  if (!legendData || !Array.isArray(legendData.items) || legendData.items.length < 2 || legendData.type === "continuous") {
    return;
  }

  var items = uniqueLegendItems(legendData.items).slice(0, 10);
  if (items.length < 2) {
    return;
  }

  var g = chart.svg.append("g")
    .attr("class", "myIO-inline-legend")
    .attr("transform", "translate(" + chart.margin.left + "," + Math.max(34, chart.height - 24) + ")");

  var cursors = [0, 0];
  items.forEach(function(item, index) {
    var label = String(item.label || item.key || "");
    var row = index < 5 ? 0 : 1;
    var itemGroup = g.append("g")
      .attr("class", "myIO-inline-legend-item")
      .attr("transform", "translate(" + cursors[row] + "," + (row * 16) + ")");

    itemGroup.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("y", -9)
      .attr("fill", Array.isArray(item.color) ? item.color[0] : (item.color || "#6b7280"))
      .style("opacity", item.visible === false ? 0.35 : 1);

    itemGroup.append("text")
      .attr("class", "myIO-inline-legend-label")
      .attr("x", 15)
      .attr("y", 0)
      .text(label.length > 24 ? label.substring(0, 21) + "..." : label);

    cursors[row] += Math.min(190, 46 + label.length * 7);
  });
}

function uniqueLegendItems(items) {
  var seen = {};
  return items.filter(function(item) {
    var key = item.key || item.label;
    if (seen[key]) {
      return false;
    }
    seen[key] = true;
    return true;
  });
}

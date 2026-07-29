import { renderSheetLegend } from "../interactions/bottom-sheet.js";
import { toggleLayerVisibility, toggleOrdinalSegment } from "../interactions/legend-toggles.js";
import { buildLegendData, buildOrdinalLegendData, resolveLegendTitle } from "./legend-data.js";
import {
  computeInlineRows,
  estimateItemWidth,
  estimateTitleWidth,
  legendAvailableWidth,
  legendItemLabel,
  legendTitleText,
  resolveLegendPlacement,
  uniqueLegendItems
} from "./legend-placement.js";

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

  var items = legendData && Array.isArray(legendData.items) ? uniqueLegendItems(legendData.items) : [];
  var labels = items.map(legendItemLabel);
  var availableWidth = legendAvailableWidth(chart);
  var titleText = legendTitleText(resolveLegendTitle(chart, legendData));
  var titleWidth = estimateTitleWidth(titleText);
  var placement = resolveLegendPlacement({
    type: legendData && legendData.type,
    labels: labels,
    suppressLegend: !!(chart.options && chart.options.suppressLegend === true),
    availableWidth: availableWidth,
    titleWidth: titleWidth
  });

  if (!placement.inline) {
    return;
  }

  var layout = computeInlineRows(labels, availableWidth, titleWidth);

  // Reserve vertical space for one or two rows. Second-row items render at row * 16
  // below the baseline, so the baseline must clear that or labels clip below the SVG.
  var legendBaselineY = Math.max(34, chart.height - 8 - (layout.rowCount - 1) * 16);

  var g = chart.svg.append("g")
    .attr("class", "myIO-inline-legend")
    .attr("transform", "translate(" + chart.margin.left + "," + legendBaselineY + ")");

  if (titleText) {
    g.append("text")
      .attr("class", "myIO-inline-legend-title")
      .attr("x", 0)
      .attr("y", 0)
      .text(titleText);
  }

  items.forEach(function(item, index) {
    var label = labels[index];
    var position = layout.positions[index];
    var isOff = item.visible === false;
    var itemWidth = estimateItemWidth(label);

    var itemGroup = g.append("g")
      .attr("class", "myIO-inline-legend-item")
      .attr("transform", "translate(" + position.x + "," + (position.row * 16) + ")")
      .attr("role", "switch")
      .attr("aria-checked", isOff ? "false" : "true")
      .attr("tabindex", 0)
      .attr("data-key", item.key)
      .on("click", function() {
        handleInlineToggle(chart, legendData, item);
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleInlineToggle(chart, legendData, item);
        }
      });

    itemGroup.append("title").text(label);

    // Transparent hit target covering the full item footprint (the 16px row
    // pitch caps its height; the visual swatch stays 10px).
    itemGroup.append("rect")
      .attr("class", "myIO-inline-legend-hit")
      .attr("x", -3)
      .attr("y", -14)
      .attr("width", itemWidth)
      .attr("height", 20)
      .attr("fill", "transparent");

    itemGroup.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("rx", 2)
      .attr("y", -9)
      .attr("fill", Array.isArray(item.color) ? item.color[0] : (item.color || "#6b7280"))
      .style("opacity", isOff ? 0.35 : 1);

    itemGroup.append("text")
      .attr("class", "myIO-inline-legend-label")
      .attr("x", 15)
      .attr("y", 0)
      .style("opacity", isOff ? 0.45 : 1)
      .text(label.length > 24 ? label.substring(0, 21) + "..." : label);
  });
}

function handleInlineToggle(chart, legendData, item) {
  if (legendData.type === "ordinal") {
    toggleOrdinalSegment(chart, item, refreshAfterOrdinalToggle);
  } else {
    toggleLayerVisibility(chart, item);
  }
}

// Ordinal reroutes suppress the legend rebuild to avoid re-entrancy, so the
// legend surfaces must be refreshed here after the toggle settles.
function refreshAfterOrdinalToggle(chart) {
  var layer = (chart.currentLayers || (chart.derived && chart.derived.currentLayers) || chart.plotLayers || [])[0];
  chart.runtime._legendData = buildOrdinalLegendData(chart, layer);
  renderInlineLegend(chart, chart.runtime._legendData);

  if (chart.runtime._sheetOpen) {
    renderSheetLegend(chart);
  }
}

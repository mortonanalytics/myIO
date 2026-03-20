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

  if (chart.runtime._sheetOpen) {
    renderSheetLegend(chart);
  }
}

import { createBins, processScales } from "./scales.js";

export function getPrimaryType(chart) {
  return (chart.currentLayers && chart.currentLayers[0] ? chart.currentLayers[0].type : null);
}

export function isAxesChart(type) {
  return ["treemap", "gauge", "donut"].indexOf(type) === -1;
}

export function usesHistogramBins(type) {
  return type === "histogram";
}

export function usesContinuousLegend(type) {
  return type === "hexbin";
}

export function usesOrdinalLegend(type) {
  return type === "treemap" || type === "donut";
}

export function needsReferenceLines(type) {
  return ["bar", "groupedBar", "line", "point", "area", "stat_line"].indexOf(type) > -1;
}

export function deriveChartRender(chart) {
  var layers = chart.currentLayers || [];
  var types = layers.map(function(layer) {
    return layer.type;
  });
  var primaryType = getPrimaryType(chart);

  return {
    type: primaryType,
    axesChart: types.every(isAxesChart),
    histogram: types.length > 0 && types.every(usesHistogramBins),
    continuousLegend: types.length > 0 && types.every(usesContinuousLegend),
    ordinalLegend: types.length === 1 && usesOrdinalLegend(primaryType),
    referenceLines: types.some(needsReferenceLines)
  };
}

export function applyDerivedScales(chart, renderState) {
  if (!renderState.axesChart) {
    return;
  }

  if (renderState.histogram) {
    createBins(chart, chart.currentLayers);
  } else {
    processScales(chart, chart.currentLayers);
  }
}

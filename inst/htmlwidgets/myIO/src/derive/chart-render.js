import { createBins, processScales } from "./scales.js";
import { resolveScaleSemantics } from "./scale-semantics.js";
import { getRendererForLayer } from "../registry.js";

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
  return type === "hexbin" || type === "heatmap";
}

export function usesOrdinalLegend(type) {
  return type === "treemap" || type === "donut";
}

export function needsReferenceLines(type) {
  return ["bar", "groupedBar", "line", "point", "area", "candlestick"].indexOf(type) > -1;
}

export function deriveChartRender(chart) {
  var layers = chart.derived.currentLayers || [];
  var traits = layers.map(function(layer) {
    return getRendererForLayer(layer).constructor.traits;
  });
  var primaryType = layers[0] ? layers[0].type : null;
  var legendTypes = Array.from(new Set(traits.map(function(trait) { return trait.legendType; })));

  return {
    type: primaryType,
    axesChart: traits.every(function(trait) { return trait.hasAxes; }),
    histogram: traits.length > 0 && traits.every(function(trait) { return trait.binning; }),
    continuousLegend: legendTypes.length === 1 && legendTypes[0] === "continuous",
    ordinalLegend: legendTypes.length === 1 && legendTypes[0] === "ordinal",
    referenceLines: traits.some(function(trait) { return trait.referenceLines; })
  };
}

export function applyDerivedScales(chart, renderState) {
  if (!renderState.axesChart) {
    return;
  }

  if (renderState.histogram) {
    createBins(chart, chart.derived.currentLayers);
  } else {
    var semantics = resolveScaleSemantics(chart, chart.derived.currentLayers);
    processScales(chart, chart.derived.currentLayers, semantics);
  }
}

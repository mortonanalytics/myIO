// Series-visibility toggle handlers shared by the inline plot-area legend and
// the panel legend (GH #84). Hidden-series state lives on chart.runtime; the
// active legend surface re-renders from it via the chart render cycle.
// Must not import from legend.js or bottom-sheet.js (both import this module).

export function toggleLayerVisibility(chart, item) {
  if (!chart.runtime) {
    chart.runtime = {};
  }

  var hiddenKeys = Array.isArray(chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys.slice() : [];
  var index = hiddenKeys.indexOf(item.key);
  if (index === -1) {
    hiddenKeys.push(item.key);
  } else {
    hiddenKeys.splice(index, 1);
  }

  chart.runtime._hiddenLayerKeys = hiddenKeys;
  chart.derived = chart.derived || {};
  chart.derived.currentLayers = (chart.plotLayers || []).filter(function(layer) {
    return hiddenKeys.indexOf(layer._composite || layer.label) === -1;
  });
  chart.syncLegacyAliases();
  chart.renderCurrentLayers();
}

export function toggleOrdinalSegment(chart, item, onToggled) {
  if (!chart.runtime) {
    chart.runtime = {};
  }

  if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
    chart.runtime._hiddenOrdinalSegments = [];
  }

  var hidden = chart.runtime._hiddenOrdinalSegments;
  var index = hidden.indexOf(item.key);
  if (index === -1) {
    hidden.push(item.key);
  } else {
    hidden.splice(index, 1);
  }

  rerouteOrdinalLayers(chart);
  if (typeof onToggled === "function") {
    onToggled(chart);
  }
}

export function resetLegendVisibility(chart, type, onToggled) {
  chart.runtime = chart.runtime || {};
  if (type === "ordinal") {
    chart.runtime._hiddenOrdinalSegments = [];
    rerouteOrdinalLayers(chart);
    if (typeof onToggled === "function") {
      onToggled(chart);
    }
  } else {
    chart.runtime._hiddenLayerKeys = [];
    chart.derived = chart.derived || {};
    chart.derived.currentLayers = (chart.plotLayers || []).slice();
    chart.syncLegacyAliases();
    chart.renderCurrentLayers();
  }
}

function rerouteOrdinalLayers(chart) {
  chart.runtime._suppressOrdinalLegendRebuild = true;
  try {
    chart.routeLayers(chart.currentLayers || (chart.derived && chart.derived.currentLayers) || []);
  } finally {
    chart.runtime._suppressOrdinalLegendRebuild = false;
  }
}

export function buildLegendData(chart, state) {
  if (!chart || !chart.plotLayers || chart.plotLayers.length === 0) {
    return null;
  }

  if (chart.options && chart.options.suppressLegend === true) {
    return null;
  }

  var renderState = state || {};
  if (renderState.continuousLegend) {
    return buildContinuousLegendData(chart);
  }

  if (renderState.ordinalLegend) {
    var ordinalLayer = (chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers)[0] || chart.plotLayers[0];
    return buildOrdinalLegendData(chart, ordinalLayer);
  }

  return buildLayerLegendData(chart);
}

export function buildOrdinalLegendData(chart, layer) {
  if (!layer) {
    return null;
  }

  if (!chart.runtime) {
    chart.runtime = {};
  }

  if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
    chart.runtime._hiddenOrdinalSegments = [];
  }

  var hidden = chart.runtime._hiddenOrdinalSegments;
  var keys = [];

  if (layer.type === "treemap" && layer.data && layer.data.children) {
    keys = layer.data.children.map(function(d) {
      return d.name;
    });
  } else if (layer.type === "donut" && Array.isArray(layer.data)) {
    keys = layer.data.map(function(d) {
      return d[layer.mapping.x_var];
    });
  }

  return {
    type: "ordinal",
    items: keys.map(function(key) {
      var swatchColor = "#6b7280";
      if (typeof chart.colorDiscrete === "function") {
        swatchColor = layer.type === "treemap" ? chart.colorDiscrete("treemap." + key) : chart.colorDiscrete(key);
      }
      if (!swatchColor) {
        swatchColor = "#6b7280";
      }
      return {
        key: key,
        label: key,
        color: swatchColor,
        visible: hidden.indexOf(key) === -1,
        kind: "segment"
      };
    })
  };
}

function buildLayerLegendData(chart) {
  var currentLayers = chart.currentLayers || chart.derived && chart.derived.currentLayers || [];
  var visibleKeys = currentLayers.map(function(layer) {
    return layer._composite || layer.label;
  });
  var hiddenKeys = Array.isArray(chart.runtime && chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys : [];

  return {
    type: "layer",
    items: (chart.plotLayers || []).map(function(layer) {
      var key = layer._composite || layer.label;
      return {
        key: key,
        label: layer.label,
        color: layer.color || "#6b7280",
        visible: visibleKeys.indexOf(key) > -1 && hiddenKeys.indexOf(key) === -1,
        kind: layer.type
      };
    })
  };
}

function buildContinuousLegendData(chart) {
  var scale = chart.colorContinuous || chart.derived && chart.derived.colorContinuous;

  return {
    type: "continuous",
    items: [],
    colorScale: scale || null,
    domain: scale && typeof scale.domain === "function"
      ? scale.domain()
      : null
  };
}

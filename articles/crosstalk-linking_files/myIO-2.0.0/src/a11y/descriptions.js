export function generateChartLabel(config) {
  var types = [];
  var layers = (config && config.layers) || [];

  for (var i = 0; i < layers.length; i++) {
    var type = layers[i].type;
    if (type && types.indexOf(type) === -1) {
      types.push(type);
    }
  }

  var xLabel = (config && config.axes && config.axes.xAxisLabel) || "x";
  var yLabel = (config && config.axes && config.axes.yAxisLabel) || "y";
  var prefix = types.length ? types.join(" and ") + " chart" : "chart";

  return prefix + ": " + xLabel + " vs " + yLabel;
}

export function generateLayerLabel(layer) {
  var label = (layer && (layer.label || layer.type)) || "series";
  var dataLength = layer && Array.isArray(layer.data) ? layer.data.length : 0;

  return label + ": " + dataLength + " data points";
}

export function generatePointLabel(d, layer) {
  var mapping = (layer && layer.mapping) || {};

  if (mapping.x_var && mapping.y_var && d) {
    return String(d[mapping.x_var] != null ? d[mapping.x_var] : "") + ": "
      + String(d[mapping.y_var] != null ? d[mapping.y_var] : "");
  }

  if (mapping.category && mapping.value && d) {
    return String(d[mapping.category] || "") + ": " + String(d[mapping.value] || "");
  }

  return "Data point";
}

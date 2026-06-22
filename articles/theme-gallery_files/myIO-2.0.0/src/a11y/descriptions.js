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

  var label = prefix + ": " + xLabel + " vs " + yLabel;
  var summaries = generateQuantileDotSummaries(layers);

  return summaries.length ? label + ". " + summaries.join(" ") : label;
}

export function generateLayerLabel(layer) {
  var label = (layer && (layer.label || layer.type)) || "series";
  var dataLength = layer && Array.isArray(layer.data) ? layer.data.length : 0;

  return label + ": " + dataLength + " data points";
}

export function generatePointLabel(d, layer) {
  var mapping = (layer && layer.mapping) || {};

  if (mapping.quantile_rank && d) {
    var rank = d[mapping.quantile_rank];
    var n = layer && layer.options && layer.options.n ? layer.options.n : inferDotCount(layer, d);
    var value = mapping.y_var ? d[mapping.y_var] : d.value;
    var text = "Q" + String(rank) + " of " + String(n) + ": " + String(value != null ? value : "");
    var relationship = mapping.threshold_relationship ? d[mapping.threshold_relationship] : d.threshold_relationship;
    var threshold = layer && layer.options ? layer.options.threshold : null;
    if (relationship) {
      text += ", " + String(relationship) + (threshold != null ? " threshold of " + String(threshold) : " threshold");
    }
    return text;
  }

  if (mapping.low_y && mapping.high_y && d) {
    var densityLabel = d.density_label || (layer && layer.options && layer.options.density_label) || "interval";
    return String(densityLabel) + ": "
      + String(d[mapping.low_y] != null ? d[mapping.low_y] : "")
      + " to "
      + String(d[mapping.high_y] != null ? d[mapping.high_y] : "");
  }

  if (mapping.x_var && mapping.y_var && d) {
    return String(d[mapping.x_var] != null ? d[mapping.x_var] : "") + ": "
      + String(d[mapping.y_var] != null ? d[mapping.y_var] : "");
  }

  if (mapping.category && mapping.value && d) {
    return String(d[mapping.category] || "") + ": " + String(d[mapping.value] || "");
  }

  return "Data point";
}

function inferDotCount(layer, d) {
  if (!layer || !Array.isArray(layer.data) || !layer.mapping || !layer.mapping.x_var || !d) {
    return layer && Array.isArray(layer.data) ? layer.data.length : 0;
  }
  var xValue = d[layer.mapping.x_var];
  return layer.data.filter(function(row) {
    return row[layer.mapping.x_var] === xValue;
  }).length;
}

function generateQuantileDotSummaries(layers) {
  var summaries = [];
  (layers || []).forEach(function(layer) {
    if (!layer || layer.type !== "quantile_dots" || !Array.isArray(layer.data)) {
      return;
    }
    var threshold = layer.options && layer.options.threshold;
    if (threshold == null) {
      return;
    }
    var mapping = layer.mapping || {};
    var xVar = mapping.x_var;
    var relVar = mapping.threshold_relationship || "threshold_relationship";
    var n = layer.options && layer.options.n ? layer.options.n : null;
    var groups = new Map();

    layer.data.forEach(function(row) {
      var key = xVar ? String(row[xVar]) : "all";
      if (!groups.has(key)) {
        groups.set(key, { total: 0, below: 0 });
      }
      var summary = groups.get(key);
      summary.total += 1;
      if (row[relVar] === "below") {
        summary.below += 1;
      }
    });

    groups.forEach(function(summary, key) {
      var denominator = n || summary.total;
      var prefix = groups.size > 1 ? key + ": " : "";
      summaries.push(prefix + summary.below + " of " + denominator + " dots below threshold of " + threshold + ".");
    });
  });
  return summaries;
}

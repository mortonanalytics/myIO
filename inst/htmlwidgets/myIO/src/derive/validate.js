import { getRendererForLayer } from "../registry.js";

const COMPAT_GROUP = {
  line: "axes-continuous",
  stat_line: "axes-continuous",
  point: "axes-continuous",
  area: "axes-continuous",
  bar: "axes-categorical",
  groupedBar: "axes-categorical",
  histogram: "axes-binned",
  hexbin: "axes-hex",
  regression: "axes-continuous",
  treemap: "standalone-treemap",
  donut: "standalone-donut",
  gauge: "standalone-gauge"
};

const CROSS_GROUP_ALLOWED = new Set([
  "axes-continuous:axes-categorical", "axes-categorical:axes-continuous",
  "axes-binned:axes-continuous", "axes-continuous:axes-binned"
]);

export function validateComposition(layers) {
  if (layers.length <= 1) return { valid: true, errors: [] };
  const errors = [];
  const groups = layers.map(function(layer) {
    return COMPAT_GROUP[layer.type] || "unknown";
  });
  const standalone = groups.filter(function(group) {
    return group.startsWith("standalone");
  });
  if (standalone.length > 0 && layers.length > 1) {
    errors.push("Cannot mix standalone chart types with other layers.");
  }
  if (standalone.length > 1) {
    errors.push("Standalone chart types must be used alone.");
  }
  const uniqueGroups = Array.from(new Set(groups));
  if (uniqueGroups.length > 1) {
    uniqueGroups.forEach(function(group, index) {
      uniqueGroups.slice(index + 1).forEach(function(other) {
        if (!CROSS_GROUP_ALLOWED.has(group + ":" + other)) {
          errors.push("Cannot mix layer groups '" + group + "' and '" + other + "'.");
        }
      });
    });
  }
  return { valid: errors.length === 0, errors };
}

export function validateAgainstContract(layer, contract) {
  const errors = [];
  const warnings = [];
  if (!contract) {
    return { errors, warnings };
  }
  Object.entries(contract).forEach(function(entry) {
    const field = entry[0];
    const rules = entry[1];
    const mapped = layer.mapping ? layer.mapping[field] : null;
    if (rules.required && !mapped) {
      errors.push("Layer '" + layer.label + "' is missing required mapping '" + field + "'.");
      return;
    }
    if (!mapped) {
      return;
    }
    const values = Array.isArray(layer.data)
      ? typeof mapped === "string"
        ? layer.data.map(function(row) { return row[mapped]; })
        : layer.data.map(function() { return mapped; })
      : [];
    if (rules.numeric) {
      const invalid = values.find(function(value) { return Number.isNaN(+value); });
      if (invalid !== undefined) {
        errors.push("Layer '" + layer.label + "' field '" + mapped + "' must be numeric.");
      }
    }
    if (rules.positive) {
      const invalid = values.find(function(value) { return +value <= 0; });
      if (invalid !== undefined) {
        errors.push("Layer '" + layer.label + "' field '" + mapped + "' must be positive.");
      }
    }
    if (rules.sorted) {
      for (let i = 1; i < values.length; i += 1) {
        if (+values[i] < +values[i - 1]) {
          warnings.push("Layer '" + layer.label + "' field '" + mapped + "' is not sorted.");
          break;
        }
      }
    }
    if (rules.unique && new Set(values).size !== values.length) {
      warnings.push("Layer '" + layer.label + "' field '" + mapped + "' contains duplicate values.");
    }
    const nullCount = values.filter(function(value) {
      return value === null || value === undefined || Number.isNaN(value);
    }).length;
    if (nullCount > 0) {
      warnings.push("Layer '" + layer.label + "' field '" + mapped + "' contains " + nullCount + " null/NaN values.");
    }
  });
  return { errors, warnings };
}

export function validateLayers(chart) {
  const layers = chart.config.layers || [];
  const composition = validateComposition(layers);
  if (!composition.valid) {
    composition.errors.forEach(function(message) {
      chart.emit("error", { message });
    });
    return [];
  }

  return layers.filter(function(layer) {
    const renderer = getRendererForLayer(layer);
    const contract = renderer.constructor.dataContract;
    const result = validateAgainstContract(layer, contract);
    result.warnings.forEach(function(message) {
      console.warn(message);
    });
    if (result.errors.length > 0) {
      result.errors.forEach(function(message) {
        chart.emit("error", { message, layer });
      });
      return false;
    }
    return true;
  });
}

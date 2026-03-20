import { getRendererForLayer } from "../registry.js";

const DEFAULT_SCALE_HINTS = {
  xScaleType: "linear",
  yScaleType: "linear",
  xExtentFields: ["x_var"],
  yExtentFields: ["y_var"],
  domainMerge: "union"
};

function normalizeHints(hints) {
  if (!hints) {
    return null;
  }

  return Object.assign({}, DEFAULT_SCALE_HINTS, hints);
}

function getScaleHintsForLayer(layer) {
  if (layer && layer.scaleHints) {
    return normalizeHints(layer.scaleHints);
  }

  try {
    var renderer = getRendererForLayer(layer);
    return normalizeHints(renderer.constructor.scaleHints);
  } catch (err) {
    return null;
  }
}

function resolveFallbackScaleType(chart, axis) {
  var categoricalScale = chart && chart.config && chart.config.scales && chart.config.scales.categoricalScale;
  if (categoricalScale && categoricalScale[axis + "Axis"] === true) {
    return "band";
  }
  return "linear";
}

export function resolveScaleSemantics(chart, layers) {
  var flipAxis = !!(chart && chart.config && chart.config.scales && chart.config.scales.flipAxis);
  var xTypes = new Set();
  var yTypes = new Set();
  var xExtentFields = new Set();
  var yExtentFields = new Set();
  var domainMerge = "union";

  (layers || []).forEach(function(layer) {
    var hints = getScaleHintsForLayer(layer);
    var xType = hints ? hints.xScaleType : resolveFallbackScaleType(chart, "x");
    var yType = hints ? hints.yScaleType : resolveFallbackScaleType(chart, "y");
    var resolvedX = flipAxis ? yType : xType;
    var resolvedY = flipAxis ? xType : yType;

    xTypes.add(resolvedX);
    yTypes.add(resolvedY);

    var xFields = hints && Array.isArray(hints.xExtentFields) ? hints.xExtentFields : DEFAULT_SCALE_HINTS.xExtentFields;
    xFields.forEach(function(field) {
      xExtentFields.add(field);
    });

    var fields = hints && Array.isArray(hints.yExtentFields) ? hints.yExtentFields : DEFAULT_SCALE_HINTS.yExtentFields;
    fields.forEach(function(field) {
      yExtentFields.add(field);
    });

    if (hints && hints.domainMerge === "independent") {
      domainMerge = "independent";
    }
  });

  if (xTypes.size > 1 || yTypes.size > 1) {
    throw new Error(
      "Mismatched scaleTypes across layers: x=" + Array.from(xTypes).join(", ") +
      ", y=" + Array.from(yTypes).join(", ") + "."
    );
  }

  return {
    xScaleType: xTypes.size > 0 ? Array.from(xTypes)[0] : resolveFallbackScaleType(chart, "x"),
    yScaleType: yTypes.size > 0 ? Array.from(yTypes)[0] : resolveFallbackScaleType(chart, "y"),
    xExtentFields: Array.from(xExtentFields).length > 0 ? Array.from(xExtentFields) : DEFAULT_SCALE_HINTS.xExtentFields,
    yExtentFields: Array.from(yExtentFields).length > 0 ? Array.from(yExtentFields) : DEFAULT_SCALE_HINTS.yExtentFields,
    domainMerge: domainMerge
  };
}

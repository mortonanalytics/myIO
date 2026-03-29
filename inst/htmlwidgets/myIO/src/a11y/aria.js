import { generateChartLabel, generateLayerLabel, generatePointLabel } from "./descriptions.js";

function sanitizeLabel(label) {
  return String(label).replace(/[^a-zA-Z0-9_-]/g, "");
}

function getLayerGroup(chart, layer) {
  if (!chart.dom || !chart.dom.chartArea || !layer) {
    return null;
  }

  var chartArea = chart.dom.chartArea;
  var selectors = [
    ".tag-" + layer.type + "-" + layer.id,
    ".tag-" + layer.type + "-" + chart.dom.element.id + "-" + sanitizeLabel(layer.label)
  ];

  for (var i = 0; i < selectors.length; i++) {
    var selection = chartArea.select(selectors[i]);
    if (!selection.empty()) {
      return selection;
    }
  }

  return null;
}

function getLayerElements(chart, layer) {
  if (!chart.dom || !chart.dom.chartArea || !layer) {
    return null;
  }

  var chartArea = chart.dom.chartArea;
  var label = sanitizeLabel(layer.label);
  var elementId = chart.dom.element.id;
  var selectors = [];

  if (layer.type === "line") {
    selectors.push(".tag-point-" + elementId + "-" + label);
  }

  if (layer.type === "groupedBar") {
    selectors.push(".tag-grouped-bar-g rect");
  }

  selectors.push(".tag-" + layer.type + "-" + elementId + "-" + label);
  selectors.push(".tag-" + layer.type + "-" + layer.id + " circle");
  selectors.push(".tag-" + layer.type + "-" + layer.id + " rect");
  selectors.push(".tag-" + layer.type + "-" + layer.id + " path");
  selectors.push(".tag-" + layer.type + "-" + layer.id + " line");

  for (var i = 0; i < selectors.length; i++) {
    var selection = chartArea.selectAll(selectors[i]);
    if (!selection.empty()) {
      return selection;
    }
  }

  return null;
}

export function applyARIA(chart) {
  if (!chart || !chart.dom || !chart.dom.svg) {
    return;
  }

  var svg = chart.dom.svg;
  var layers = chart.config && chart.config.layers ? chart.config.layers : [];

  svg.attr("role", "graphics-document")
    .attr("aria-roledescription", "chart")
    .attr("aria-label", generateChartLabel(chart.config))
    .attr("tabindex", "0");

  if (chart.dom.chartArea) {
    chart.dom.chartArea
      .attr("role", "graphics-object")
      .attr("aria-roledescription", "plot area")
      .attr("aria-label", "Plot area with " + layers.length + " data series");
  }

  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];
    var layerGroup = getLayerGroup(chart, layer);
    var layerElements = getLayerElements(chart, layer);

    if (layerGroup && !layerGroup.empty()) {
      layerGroup
        .attr("role", "graphics-object")
        .attr("aria-roledescription", layer.type + " series")
        .attr("aria-label", generateLayerLabel(layer));
    }

    if (layerElements && !layerElements.empty()) {
      layerElements.each(function(d) {
        d3.select(this)
          .attr("role", "graphics-symbol")
          .attr("aria-roledescription", "data point")
          .attr("aria-label", generatePointLabel(d, layer));
      });
    }
  }
}

import { buildLegendData } from "../layout/legend-data.js";

var LEGEND_PADDING = 16;
var SWATCH_SIZE = 12;
var SWATCH_GAP = 6;
var ITEM_GAP = 18;
var ROW_GAP = 6;
var FONT_SIZE = 12;
var GRADIENT_HEIGHT = 14;
var GRADIENT_WIDTH = 180;

/**
 * Temporarily injects an SVG legend group into the chart SVG,
 * expands the viewBox/height, and returns a cleanup function
 * that restores the original state.
 */
export function injectExportLegend(chart) {
  var legendData = buildLegendData(chart, chart.runtime && chart.runtime._legendState);

  if (!legendData || !legendData.type) {
    return { extraHeight: 0, cleanup: function() {} };
  }

  // Only include visible items for discrete legends
  var visibleItems = legendData.items
    ? legendData.items.filter(function(d) { return d.visible !== false; })
    : [];

  if (legendData.type !== "continuous" && visibleItems.length === 0) {
    return { extraHeight: 0, cleanup: function() {} };
  }

  var svgNode = chart.svg.node();
  var svgWidth = parseFloat(svgNode.getAttribute("width")) || chart.totalWidth || chart.width;
  var origHeight = parseFloat(svgNode.getAttribute("height")) || chart.height;
  var origViewBox = svgNode.getAttribute("viewBox");
  var textColor = getTextColor(chart);

  var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", "myIO-export-legend");

  var extraHeight;

  if (legendData.type === "continuous") {
    extraHeight = buildContinuousLegendSVG(g, legendData, svgWidth, textColor);
  } else {
    extraHeight = buildDiscreteLegendSVG(g, visibleItems, svgWidth, textColor);
  }

  // Position the legend below the chart
  g.setAttribute("transform", "translate(0," + origHeight + ")");

  var newHeight = origHeight + extraHeight;
  svgNode.appendChild(g);
  svgNode.setAttribute("height", newHeight);
  svgNode.setAttribute("viewBox", "0 0 " + svgWidth + " " + newHeight);

  return {
    extraHeight: extraHeight,
    cleanup: function() {
      svgNode.removeChild(g);
      svgNode.setAttribute("height", origHeight);
      svgNode.setAttribute("viewBox", origViewBox);
    }
  };
}

function buildDiscreteLegendSVG(g, items, svgWidth, textColor) {
  var usableWidth = svgWidth - LEGEND_PADDING * 2;
  var x = LEGEND_PADDING;
  var y = LEGEND_PADDING;
  var rowHeight = Math.max(SWATCH_SIZE, FONT_SIZE);

  items.forEach(function(item) {
    var labelWidth = estimateTextWidth(item.label, FONT_SIZE);
    var itemWidth = SWATCH_SIZE + SWATCH_GAP + labelWidth;

    // Wrap to next row if needed
    if (x + itemWidth > LEGEND_PADDING + usableWidth && x > LEGEND_PADDING) {
      x = LEGEND_PADDING;
      y += rowHeight + ROW_GAP;
    }

    // Swatch
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", x);
    rect.setAttribute("y", y);
    rect.setAttribute("width", SWATCH_SIZE);
    rect.setAttribute("height", SWATCH_SIZE);
    rect.setAttribute("rx", 2);
    rect.setAttribute("fill", item.color || "#6b7280");
    g.appendChild(rect);

    // Label
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x + SWATCH_SIZE + SWATCH_GAP);
    text.setAttribute("y", y + SWATCH_SIZE - 1);
    text.setAttribute("font-family", "Roboto, Arial, sans-serif");
    text.setAttribute("font-size", FONT_SIZE);
    text.setAttribute("fill", textColor);
    text.textContent = item.label;
    g.appendChild(text);

    x += itemWidth + ITEM_GAP;
  });

  return y + rowHeight + LEGEND_PADDING;
}

function buildContinuousLegendSVG(g, legendData, svgWidth, textColor) {
  var scale = legendData.colorScale;
  if (!scale) {
    return 0;
  }

  var domain = legendData.domain || scale.domain();
  var y = LEGEND_PADDING;
  var gradientX = (svgWidth - GRADIENT_WIDTH) / 2;

  // Build gradient stops
  var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  var linearGrad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
  var gradId = "export-legend-grad-" + Date.now();
  linearGrad.setAttribute("id", gradId);

  var steps = 8;
  var min = domain[0];
  var max = domain[domain.length - 1];
  for (var i = 0; i < steps; i++) {
    var t = steps === 1 ? 0 : i / (steps - 1);
    var value = min + (max - min) * t;
    var stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", Math.round(t * 100) + "%");
    stop.setAttribute("stop-color", scale(value));
    linearGrad.appendChild(stop);
  }
  defs.appendChild(linearGrad);
  g.appendChild(defs);

  // Gradient bar
  var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  rect.setAttribute("x", gradientX);
  rect.setAttribute("y", y);
  rect.setAttribute("width", GRADIENT_WIDTH);
  rect.setAttribute("height", GRADIENT_HEIGHT);
  rect.setAttribute("rx", 3);
  rect.setAttribute("fill", "url(#" + gradId + ")");
  g.appendChild(rect);

  // Tick labels
  var ticks = [];
  if (typeof scale.ticks === "function") {
    ticks = scale.ticks(5).map(String);
  } else {
    ticks = [String(min), String(max)];
  }

  var tickY = y + GRADIENT_HEIGHT + FONT_SIZE + 4;
  ticks.forEach(function(tick, idx) {
    var tickT = ticks.length === 1 ? 0.5 : idx / (ticks.length - 1);
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", gradientX + tickT * GRADIENT_WIDTH);
    text.setAttribute("y", tickY);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-family", "Roboto, Arial, sans-serif");
    text.setAttribute("font-size", FONT_SIZE);
    text.setAttribute("fill", textColor);
    text.textContent = tick;
    g.appendChild(text);
  });

  return tickY + LEGEND_PADDING;
}

function estimateTextWidth(str, fontSize) {
  // Approximate: average character width ~0.6 * fontSize for Roboto
  return (str || "").length * fontSize * 0.6;
}

function getTextColor(chart) {
  var el = chart.element || (chart.svg && chart.svg.node && chart.svg.node().parentNode);
  if (el && typeof getComputedStyle === "function") {
    var val = getComputedStyle(el).getPropertyValue("--chart-text-color");
    if (val && val.trim()) {
      return val.trim();
    }
  }
  return "#6b7280";
}

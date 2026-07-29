import { isMobile, responsiveValue } from "../utils/responsive.js";

// .myIO-fab is 40px wide and offset 12px from the container's right edge
// (style.css .myIO-fab), plus 4px clearance. Renderers that fill the whole plot
// rect must keep their marks out of this band or the button occludes them.
export var FAB_GUTTER = 56;

export function getChartHeight(chart) {
  return chart.height;
}

export function initializeScaffold(chart) {
  d3.select(chart.element).selectAll(".myIO-svg, .toolTip, .myIO-fab, .myIO-panel, .myIO-sheet-backdrop").remove();
  d3.select(chart.element).classed("myIO-container", true).style("position", "relative");
  applyWidthTier(chart);

  chart.svg = d3.select(chart.element)
    .append("svg")
    .attr("class", "myIO-svg")
    .attr("id", "myIO-svg" + chart.element.id)
    .attr("width", chart.totalWidth)
    .attr("height", chart.height)
    .attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height)
    .attr("role", "img")
    .attr("aria-label", buildAriaLabel(chart));

  // Background rect that respects theme CSS variable
  chart.svg.append("rect")
    .attr("class", "myIO-bg")
    .attr("width", chart.totalWidth)
    .attr("height", chart.height)
    .attr("fill", "var(--chart-bg, #ffffff)");

  renderChartTitle(chart);

  applyPlotTransform(chart);

  chart.chart = chart.plot
    .append("g")
    .attr("class", "myIO-chart-area");
}

function buildAriaLabel(chart) {
  var firstLayer = chart.plotLayers[0];
  if (!firstLayer) {
    return "Data visualization chart";
  }

  var chartType = firstLayer.type ? firstLayer.type.replace(/([A-Z])/g, " $1").toLowerCase() : "data visualization";
  var xLabel = chart.options.xAxisLabel || chart.options.xAxisFormat || "x-axis";
  var yLabel = chart.options.yAxisLabel || chart.options.yAxisFormat || "y-axis";

  return chartType.charAt(0).toUpperCase() + chartType.slice(1) + " chart showing " + yLabel + " by " + xLabel;
}

// Width tier keys off the widget's own container width (same signal as the
// panel's bottom-sheet/side-panel split), never the browser viewport.
export function applyWidthTier(chart) {
  d3.select(chart.element).classed("myIO-container--narrow", isMobile(chart));
}

export function updateScaffoldLayout(chart) {
  applyWidthTier(chart);

  chart.svg
    .attr("width", chart.totalWidth)
    .attr("height", chart.height)
    .attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height);

  applyPlotTransform(chart);

  if (chart.plotLayers[0] && chart.plotLayers[0].type !== "gauge" && chart.plotLayers[0].type !== "donut" && chart.clipPath) {
    chart.clipPath
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", chart.width - (chart.margin.left + chart.margin.right))
      .attr("height", getChartHeight(chart) - (chart.margin.top + chart.margin.bottom));
  }

  renderChartTitle(chart);
}

export function renderChartTitle(chart) {
  if (!chart || !chart.svg) {
    return;
  }

  var title = chart.config && chart.config.title;
  var titleData = title ? [title] : [];
  chart.svg.selectAll(".myIO-chart-title")
    .data(titleData)
    .join(
      function(enter) {
        return enter.append("text")
          .attr("class", "myIO-chart-title")
          .attr("x", chart.margin.left)
          .attr("y", 19)
          .text(function(d) { return d; });
      },
      function(update) {
        return update
          .attr("x", chart.margin.left)
          .attr("y", 19)
          .text(function(d) { return d; });
      },
      function(exit) { return exit.remove(); }
    );
}

function applyPlotTransform(chart) {
  var primaryType = chart.plotLayers[0] ? chart.plotLayers[0].type : null;

  switch (primaryType) {
    case "gauge":
      chart.plot = chart.plot || chart.svg.append("g");
      chart.plot
        .attr("transform", "translate(" + chart.width / 2 + "," + responsiveValue(chart, chart.height * 0.8, chart.height * 0.6) + ")")
        .attr("class", "myIO-chart-offset");
      break;
    case "donut":
      chart.plot = chart.plot || chart.svg.append("g");
      chart.plot
        .attr("transform", "translate(" + chart.width / 2 + "," + responsiveValue(chart, chart.height, chart.height * 0.8) / 2 + ")")
        .attr("class", "myIO-chart-offset");
      break;
    default:
      chart.plot = chart.plot || chart.svg.append("g");
      chart.plot
        .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")")
        .attr("class", "myIO-chart-offset");
  }
}

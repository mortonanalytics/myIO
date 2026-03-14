import { isMobile, responsiveValue } from "../utils/responsive.js";

export function getChartHeight(chart) {
  if (chart.options.suppressLegend == false) {
    return responsiveValue(chart, chart.height, chart.height * 0.8);
  }

  return chart.height;
}

export function initializeScaffold(chart) {
  d3.select(chart.element).selectAll(".myIO-svg, .buttonDiv, .toolTip").remove();

  chart.svg = d3.select(chart.element)
    .append("svg")
    .attr("class", "myIO-svg")
    .attr("id", "myIO-svg" + chart.element.id)
    .attr("width", chart.totalWidth)
    .attr("height", chart.height)
    .attr("viewBox", "0 0 " + chart.totalWidth + " " + chart.height);

  applyPlotTransform(chart);

  chart.chart = chart.plot
    .append("g")
    .attr("class", "myIO-chart-area");

  if (chart.options.suppressLegend == false) {
    chart.legendTranslate = isMobile(chart) ? "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")" : "translate(" + chart.width + ",0)";
    chart.legendArea = chart.svg
      .append("g")
      .attr("class", "myIO-legend-area")
      .attr("transform", chart.legendTranslate)
      .style("height", responsiveValue(chart, chart.height, chart.height * 0.2))
      .style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left));
  }
}

export function updateScaffoldLayout(chart) {
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

  if (chart.options.suppressLegend == false && chart.legendArea) {
    chart.legendTranslate = isMobile(chart) ? "translate(" + chart.margin.left + "," + chart.height * 0.8 + ")" : "translate(" + chart.width + ",0)";
    chart.legendArea
      .attr("transform", chart.legendTranslate)
      .style("height", responsiveValue(chart, chart.height, chart.height * 0.2))
      .style("width", responsiveValue(chart, chart.totalWidth - chart.width, chart.totalWidth - chart.margin.left));
  }
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

import { getChartHeight } from "./scaffold.js";

export function syncAxes(chart, state, options) {
  if (!state.axesChart) {
    return;
  }

  renderAxes(chart, { isInitialRender: options && options.isInitialRender });
}

export function addAxes(chart) {
  renderAxes(chart, { isInitialRender: true });
}

export function updateAxes(chart) {
  renderAxes(chart);
}

export function renderAxes(chart, options) {
  var m = chart.margin;
  var chartHeight = getChartHeight(chart);
  var transitionSpeed = chart.options.transition.speed;
  var xFormat = chart.options.xAxisFormat === "yearMon" ? function(x) { return x; } : d3.format(chart.options.xAxisFormat);
  var yFormat = d3.format(chart.options.yAxisFormat);
  var xAxis = chart.plot.selectAll(".x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis");
  var yAxis = chart.plot.selectAll(".y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis");
  var xAxisSelection = options && options.isInitialRender ? xAxis : xAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);

  switch (chart.options.categoricalScale.xAxis) {
    case true:
      xAxisSelection
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale))
        .selectAll("text")
        .attr("dx", "-.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
      break;
    case false:
      xAxisSelection
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chartHeight - (m.top + m.bottom))))
        .selectAll("text")
        .attr("dy", "1.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
  }

  applyAxisStyles(xAxis, "x");
  updateYAxis(chart, chart.yScale, yAxis, options);
}

export function updateYAxis(chart, yScale, yAxisSelection, options) {
  var yFormat = d3.format(chart.options.yAxisFormat);
  var chartHeight = getChartHeight(chart);
  var transitionSpeed = chart.options.transition.speed;
  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
  var yAxis = yAxisSelection || chart.plot.selectAll(".y-axis");
  var axisCall = options && options.isInitialRender ? yAxis : yAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);

  axisCall
    .call(d3.axisLeft(yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (chart.margin.right + chart.margin.left))))
    .selectAll("text")
    .attr("dx", "-.25em");

  applyAxisStyles(chart.plot.selectAll(".y-axis"), "y");
}

function applyAxisStyles(axis, axisType) {
  axis.selectAll(".domain").attr("class", axisType + "-axis-line");
  axis.selectAll(".tick line").attr("class", axisType + "-grid");
  axis.selectAll("text").attr("class", axisType + "-label");
}

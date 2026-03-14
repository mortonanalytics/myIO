import { getChartHeight } from "./scaffold.js";

export function syncAxes(chart, state, options) {
  if (!state.axesChart) {
    return;
  }

  if (options && options.isInitialRender) {
    addAxes(chart);
  } else {
    updateAxes(chart);
  }
}

export function addAxes(chart) {
  var m = chart.margin;
  var chartHeight = getChartHeight(chart);
  var xFormat = chart.options.xAxisFormat === "yearMon" ? d3.format("s") : d3.format(chart.options.xAxisFormat);
  var yFormat = d3.format(chart.options.yAxisFormat);

  switch (chart.options.categoricalScale.xAxis) {
    case true:
      chart.plot.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale))
        .selectAll("text")
        .attr("class", "x-label")
        .attr("dx", "-.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
      break;
    case false:
      chart.plot.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chart.height - (m.top + m.bottom))))
        .selectAll("text")
        .attr("class", "x-label")
        .attr("dy", "1.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
  }

  chart.plot.selectAll(".x-axis").selectAll(".domain").attr("class", "x-axis-line");
  chart.plot.selectAll(".x-axis").selectAll(".tick line").attr("class", "x-grid");
  chart.plot.selectAll(".x-axis").selectAll("text").attr("class", "x-label");

  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
  chart.plot.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left))))
    .selectAll("text")
    .attr("class", "y-label")
    .attr("dx", "-.25em");

  chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
  chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
  chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
}

export function updateAxes(chart) {
  var m = chart.margin;
  var chartHeight = getChartHeight(chart);
  var transitionSpeed = chart.options.transition.speed;
  var xFormat = chart.options.xAxisFormat === "yearMon" ? d3.format("s") : d3.format(chart.options.xAxisFormat);
  var yFormat = d3.format(chart.options.yAxisFormat);

  switch (chart.options.categoricalScale.xAxis) {
    case true:
      chart.svg.selectAll(".x-axis")
        .transition().ease(d3.easeQuad).duration(transitionSpeed)
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale))
        .selectAll("text")
        .attr("dx", "-.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
      break;
    case false:
      chart.svg.selectAll(".x-axis")
        .transition().ease(d3.easeQuad).duration(transitionSpeed)
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(d3.axisBottom(chart.xScale).ticks(chart.width < 550 ? 5 : 10, xFormat).tickSize(-(chartHeight - (m.top + m.bottom))))
        .selectAll("text")
        .attr("dy", "1.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
  }

  chart.plot.selectAll(".x-axis").selectAll(".domain").attr("class", "x-axis-line");
  chart.plot.selectAll(".x-axis").selectAll(".tick line").attr("class", "x-grid");
  chart.plot.selectAll(".x-axis").selectAll("text").attr("class", "x-label");

  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
  chart.svg.selectAll(".y-axis")
    .transition().ease(d3.easeQuad).duration(transitionSpeed)
    .call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left))))
    .selectAll("text")
    .attr("dx", "-.25em");

  chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
  chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
  chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");
}

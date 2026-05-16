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
  var xFormat = chart.options.xAxisFormat === "yearMon" ? function(x) {
    var date = new Date(+x * 86400000);
    return Number.isFinite(date.getTime()) ? d3.utcFormat("%b %d")(date) : x;
  } : d3.format(chart.options.xAxisFormat);
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

  if (chart.options.suppressAxis && chart.options.suppressAxis.xAxis === true) {
    xAxis.selectAll("*").remove();
  } else {
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
      var xAxisGenerator = d3.axisBottom(chart.xScale)
        .ticks(chart.width < 550 ? 5 : 10)
        .tickFormat(xFormat)
        .tickSize(-(chartHeight - (m.top + m.bottom)));
      xAxisSelection
        .attr("transform", "translate(0," + (chartHeight - (m.top + m.bottom)) + ")")
        .call(xAxisGenerator)
        .selectAll("text")
        .attr("dy", "1.25em")
        .attr("text-anchor", chart.width < 550 ? "end" : "center")
        .attr("transform", chart.width < 550 ? "rotate(-65)" : "rotate(-0)");
    }
  }

  applyAxisStyles(xAxis, "x");
  updateYAxis(chart, chart.yScale, yAxis, options);
  renderAxisTitles(chart);
}

export function updateYAxis(chart, yScale, yAxisSelection, options) {
  var yFormat = d3.format(chart.options.yAxisFormat);
  var chartHeight = getChartHeight(chart);
  var transitionSpeed = chart.options.transition.speed;
  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;
  var yAxis = yAxisSelection || chart.plot.selectAll(".y-axis");
  var axisCall = options && options.isInitialRender ? yAxis : yAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);

  if (chart.options.suppressAxis && chart.options.suppressAxis.yAxis === true) {
    yAxis.selectAll("*").remove();
    return;
  }

  var yAxisGenerator = d3.axisLeft(yScale).tickSize(-(chart.width - (chart.margin.right + chart.margin.left)));
  if (typeof yScale.ticks === "function") {
    yAxisGenerator
      .ticks(chartHeight < 450 ? 5 : 10)
      .tickFormat(currentFormatY);
  }

  axisCall
    .call(yAxisGenerator)
    .selectAll("text")
    .attr("dx", "-.25em");

  applyAxisStyles(chart.plot.selectAll(".y-axis"), "y");
}

function renderAxisTitles(chart) {
  if (!chart || !chart.plot) {
    return;
  }

  var plotWidth = chart.width - (chart.margin.left + chart.margin.right);
  var plotHeight = getChartHeight(chart) - (chart.margin.top + chart.margin.bottom);
  var xTitleData = chart.options.xAxisLabel && !(chart.options.suppressAxis && chart.options.suppressAxis.xAxis === true)
    ? [chart.options.xAxisLabel]
    : [];
  var yTitleData = chart.options.yAxisLabel && !(chart.options.suppressAxis && chart.options.suppressAxis.yAxis === true)
    ? [chart.options.yAxisLabel]
    : [];

  chart.plot.selectAll(".myIO-axis-title-x")
    .data(xTitleData)
    .join(
      function(enter) {
        return enter.append("text")
          .attr("class", "myIO-axis-title myIO-axis-title-x")
          .attr("text-anchor", "middle")
          .attr("x", plotWidth / 2)
          .attr("y", plotHeight + chart.margin.bottom - 16)
          .text(function(d) { return d; });
      },
      function(update) {
        return update
          .attr("x", plotWidth / 2)
          .attr("y", plotHeight + chart.margin.bottom - 16)
          .text(function(d) { return d; });
      },
      function(exit) { return exit.remove(); }
    );

  chart.plot.selectAll(".myIO-axis-title-y")
    .data(yTitleData)
    .join(
      function(enter) {
        return enter.append("text")
          .attr("class", "myIO-axis-title myIO-axis-title-y")
          .attr("text-anchor", "middle")
          .attr("transform", "translate(" + (-chart.margin.left + 6) + "," + (plotHeight / 2) + ") rotate(-90)")
          .text(function(d) { return d; });
      },
      function(update) {
        return update
          .attr("transform", "translate(" + (-chart.margin.left + 6) + "," + (plotHeight / 2) + ") rotate(-90)")
          .text(function(d) { return d; });
      },
      function(exit) { return exit.remove(); }
    );
}

function applyAxisStyles(axis, axisType) {
  axis.selectAll(".domain").attr("class", axisType + "-axis-line");
  axis.selectAll(".tick line").attr("class", axisType + "-grid");
  axis.selectAll("text").attr("class", axisType + "-label");
}

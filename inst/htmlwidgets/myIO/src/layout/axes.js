import { getChartHeight } from "./scaffold.js";

// A -90deg rotated <text> grows from its anchor toward SMALLER x by roughly the
// font ascent (~12px at the 13px .myIO-axis-title size), and the SVG root clips
// at x = 0 (overflow: hidden). The anchor must therefore sit at least one ascent
// inside the left edge.
var Y_AXIS_TITLE_INSET = 14;

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
  // "yearMon" expects x as R numeric dates (days since 1970-01-01), e.g.
  // as.numeric(as.Date("2024-01-01")). Values outside [0, 1e6] are treated as
  // already-converted milliseconds-since-epoch (JS convention) so callers passing
  // raw POSIX millis don't get a date 86,400x in the future.
  var xFormat = chart.options.xAxisFormat === "yearMon" ? function(x) {
    var n = +x;
    var ms = Number.isFinite(n) && n > 0 && n < 1e6 ? n * 86400000 : n;
    var date = new Date(ms);
    return Number.isFinite(date.getTime()) ? d3.utcFormat("%b %d")(date) : x;
  } : chart.options.xAxisFormat ? d3.format(chart.options.xAxisFormat) : null;
  var yFormat = chart.options.yAxisFormat ? d3.format(chart.options.yAxisFormat) : null;
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
        .tickSize(-(chartHeight - (m.top + m.bottom)));
      var xTickLabels = normalizeTickLabels(chart.options.xTickLabels);
      if (xTickLabels) {
        xAxisGenerator
          .tickValues(Object.keys(xTickLabels).map(function(value) { return +value; }))
          .tickFormat(function(value) {
            var label = xTickLabels[String(value)];
            return label == null ? value : label;
          });
      } else {
        xAxisGenerator.ticks(chart.width < 550 ? 5 : 10);
        if (xFormat) {
          xAxisGenerator.tickFormat(xFormat);
        }
      }
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
  var yFormat = chart.options.yAxisFormat ? d3.format(chart.options.yAxisFormat) : null;
  var chartHeight = getChartHeight(chart);
  var transitionSpeed = chart.options.transition.speed;
  var currentFormatY = chart.newScaleY ? d3.format(chart.newScaleY) : yFormat;
  var yAxis = yAxisSelection || chart.plot.selectAll(".y-axis");
  var axisCall = options && options.isInitialRender ? yAxis : yAxis.transition().ease(d3.easeQuad).duration(transitionSpeed);

  if (chart.options.suppressAxis && chart.options.suppressAxis.yAxis === true) {
    yAxis.selectAll("*").remove();
    return;
  }

  var yAxisGenerator = d3.axisLeft(yScale).tickSize(-(chart.width - (chart.margin.right + chart.margin.left)));
  var yTickLabels = normalizeTickLabels(chart.options.yTickLabels);
  if (yTickLabels && typeof yScale.invert === "function") {
    var yDomain = yScale.domain();
    var yLow = Math.min(yDomain[0], yDomain[yDomain.length - 1]);
    var yHigh = Math.max(yDomain[0], yDomain[yDomain.length - 1]);
    yAxisGenerator
      .tickValues(Object.keys(yTickLabels)
        .map(function(value) { return +value; })
        .filter(function(value) { return value >= yLow && value <= yHigh; }))
      .tickFormat(function(value) {
        var label = yTickLabels[String(value)];
        return label == null ? value : label;
      });
  } else if (typeof yScale.ticks === "function") {
    yAxisGenerator.ticks(chartHeight < 450 ? 5 : 10);
    if (currentFormatY) {
      yAxisGenerator.tickFormat(currentFormatY);
    }
  }

  axisCall
    .call(yAxisGenerator)
    .selectAll("text")
    .attr("dx", "-.25em");

  applyAxisStyles(chart.plot.selectAll(".y-axis"), "y");
}

function normalizeTickLabels(labels) {
  if (!labels) {
    return null;
  }
  if (Array.isArray(labels)) {
    return labels.length > 0 ? labels.reduce(function(acc, entry) {
      if (entry && entry.position != null) {
        acc[normalizeTickKey(entry.position)] = entry.label;
      }
      return acc;
    }, {}) : null;
  }
  var normalized = {};
  Object.keys(labels).forEach(function(key) {
    normalized[normalizeTickKey(key)] = labels[key];
  });
  return Object.keys(normalized).length > 0 ? normalized : null;
}

function normalizeTickKey(value) {
  var numeric = +value;
  return Number.isFinite(numeric) ? String(numeric) : String(value);
}

function renderAxisTitles(chart) {
  if (!chart || !chart.plot) {
    return;
  }

  var plotWidth = chart.width - (chart.margin.left + chart.margin.right);
  var plotHeight = getChartHeight(chart) - (chart.margin.top + chart.margin.bottom);
  // Clamp so charts with an unusually small left margin are not pushed past
  // their own y tick labels (behaviour there is unchanged from the old 6px).
  var yTitleInset = Math.max(6, Math.min(Y_AXIS_TITLE_INSET, chart.margin.left - 6));
  var yTitleTransform = "translate(" + (-chart.margin.left + yTitleInset) + "," + (plotHeight / 2) + ") rotate(-90)";
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
          .attr("transform", yTitleTransform)
          .text(function(d) { return d; });
      },
      function(update) {
        return update
          .attr("transform", yTitleTransform)
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

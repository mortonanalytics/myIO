import { easingFor, staggerDelay } from "../transitions/easing.js";

export class CalendarHeatmapRenderer {
  static type = "calendarHeatmap";
  static traits = {
    hasAxes: false,
    referenceLines: false,
    legendType: "continuous",
    binning: false,
    rolloverStyle: "element"
  };
  static dataContract = {
    date: { required: true },
    value: { required: true, numeric: true }
  };
  static scaleHints = null;

  getHoverSelector() {
    return ".myIO-calendar-cell";
  }

  formatTooltip(chart, d, layer) {
    var fmt = d3.utcFormat("%b %-d, %Y");
    var date = d.date instanceof Date
      ? d.date
      : new Date((d[layer.mapping.date] || "") + "T00:00:00Z");
    var value = d.value != null ? d.value : +d[layer.mapping.value];
    return {
      title: fmt(date),
      body: layer.label + ": " + value,
      color: d.color || layer.color,
      label: layer.label,
      value: value,
      raw: d
    };
  }

  render(chart, layer) {
    var opts = layer.options || {};
    var weekStart = opts.weekStart === "monday" ? 1 : 0;
    var showDow = opts.showWeekdayLabels !== false;
    var dateKey = layer.mapping.date;
    var valueKey = layer.mapping.value;

    var datums = (layer.data || [])
      .map(function(row) {
        return {
          date: new Date(row[dateKey] + "T00:00:00Z"),
          value: +row[valueKey],
          raw: row
        };
      })
      .filter(function(d) { return !isNaN(d.date.getTime()); })
      .sort(function(a, b) { return a.date - b.date; });

    if (datums.length === 0) return;

    var year = datums[0].date.getUTCFullYear();
    var jan1 = new Date(Date.UTC(year, 0, 1));
    var dec31 = new Date(Date.UTC(year, 11, 31));

    var weekdayIdx = function(d) {
      var js = d.getUTCDay();
      return (js - weekStart + 7) % 7;
    };
    var jan1Offset = weekdayIdx(jan1);
    var weekCol = function(d) {
      var daysFromJan1 = Math.floor((d - jan1) / 86400000);
      return Math.floor((daysFromJan1 + jan1Offset) / 7);
    };

    var totalWeeks = weekCol(dec31) + 1;
    var margin = chart.margin || { top: 0, right: 0, bottom: 0, left: 0 };
    var innerW = (chart.width || 0) - (margin.left || 0) - (margin.right || 0);
    var innerH = (chart.height || 0) - (margin.top || 0) - (margin.bottom || 0);
    var leftPad = showDow ? 24 : 0;
    var topPad = 18;
    var gridW = Math.max(1, innerW - leftPad);
    var gridH = Math.max(1, innerH - topPad);
    var cellSize = Math.max(
      4,
      Math.min(Math.floor(gridW / totalWeeks), Math.floor(gridH / 7))
    );

    var cs = (chart.element && typeof getComputedStyle === "function")
      ? getComputedStyle(chart.element)
      : null;
    var gapRaw = cs ? cs.getPropertyValue("--chart-calendar-cell-gap") : "";
    var gap = parseFloat(gapRaw);
    if (!isFinite(gap)) gap = 2;

    var vlim = chart.config && chart.config.axis && chart.config.axis.vlim;
    var vmax = d3.max(datums, function(d) { return d.value; });
    if (!(vmax > 0)) vmax = 1;
    var domain = (vlim && vlim.max !== undefined && vlim.max !== null)
      ? [vlim.min || 0, vlim.max]
      : [0, vmax];
    var interp = d3.interpolateRgb("#ffffff", layer.color || "#4E79A7");
    var scale = d3.scaleSequential(interp).domain(domain);
    chart.colorContinuous = scale;
    if (chart.derived) chart.derived.colorContinuous = scale;

    // Expose a Date-keyed x-scale so linked-cursor receivers can map a
    // sibling's xValue back to a pixel position. Callable + .domain() +
    // .invert() so coerceXToPixel in linked-cursor.js accepts it.
    var xScale = function(d) {
      var dd = (d instanceof Date) ? d : new Date(d);
      return leftPad + weekCol(dd) * (cellSize + gap);
    };
    xScale.domain = function() { return [jan1, dec31]; };
    xScale.range = function() {
      return [leftPad, leftPad + (totalWeeks - 1) * (cellSize + gap)];
    };
    xScale.invert = function(px) {
      var col = Math.round((px - leftPad) / (cellSize + gap));
      var offset = col * 7 - jan1Offset;
      return new Date(jan1.getTime() + offset * 86400000);
    };
    chart.xScale = xScale;

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;

    // Stable single root keyed by [null] join so repeat renders don't accumulate
    // orphan <g> elements.
    var root = chart.chart.selectAll(".myIO-calendar-root")
      .data([null])
      .join("g")
      .attr("class", "myIO-calendar-root");

    if (showDow) {
      var dowLabels = weekStart === 0
        ? ["", "Mon", "", "Wed", "", "Fri", ""]
        : ["", "Tue", "", "Thu", "", "Sat", ""];
      var dowData = dowLabels
        .map(function(t, i) { return { t: t, i: i }; })
        .filter(function(d) { return d.t; });
      var dowSelection = root.selectAll("text.myIO-calendar-dow")
        .data(dowData, function(d) { return d.i; });
      dowSelection.exit().remove();
      dowSelection.enter().append("text")
        .attr("class", "myIO-calendar-dow")
        .attr("x", 0)
        .merge(dowSelection)
        .attr("y", function(d) { return topPad + d.i * (cellSize + gap) + cellSize * 0.75; })
        .text(function(d) { return d.t; });
    } else {
      root.selectAll("text.myIO-calendar-dow").remove();
    }

    var monthFmt = d3.utcFormat("%b");
    var monthLabels = d3.range(12).map(function(m) {
      var first = new Date(Date.UTC(year, m, 1));
      return { m: m, text: monthFmt(first), col: weekCol(first) };
    });
    var monthSelection = root.selectAll("text.myIO-calendar-month")
      .data(monthLabels, function(d) { return d.m; });
    monthSelection.exit().remove();
    monthSelection.enter().append("text")
      .attr("class", "myIO-calendar-month")
      .attr("y", topPad - 4)
      .merge(monthSelection)
      .attr("x", function(d) { return leftPad + d.col * (cellSize + gap); })
      .text(function(d) { return d.text; });

    var toIso = function(d) { return d.date.toISOString().slice(0, 10); };

    var cellSelection = root.selectAll("rect.myIO-calendar-cell")
      .data(datums, function(d) { return toIso(d); });

    cellSelection.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .style("opacity", 0)
      .remove();

    var cellEnter = cellSelection.enter()
      .append("rect")
      .attr("class", "myIO-calendar-cell")
      .attr("data-date", toIso)
      .attr("data-row", function(d) { return String(weekdayIdx(d.date)); })
      .attr("data-col", function(d) { return String(weekCol(d.date)); })
      .attr("x", function(d) { return leftPad + weekCol(d.date) * (cellSize + gap); })
      .attr("y", function(d) { return topPad + weekdayIdx(d.date) * (cellSize + gap); })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", function(d) {
        if (d.value == null || isNaN(d.value) || d.value === 0) {
          return "var(--chart-calendar-empty-fill, #ebedf0)";
        }
        return scale(d.value);
      })
      .style("opacity", 0);

    cellEnter.merge(cellSelection)
      .each(function(d) {
        d.label = layer.label;
        d.color = (d.value == null || isNaN(d.value) || d.value === 0)
          ? "var(--chart-calendar-empty-fill, #ebedf0)"
          : scale(d.value);
        d[dateKey] = toIso({ date: d.date });
        d[valueKey] = d.value;
      })
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .style("opacity", 1)
      .attr("x", function(d) { return leftPad + weekCol(d.date) * (cellSize + gap); })
      .attr("y", function(d) { return topPad + weekdayIdx(d.date) * (cellSize + gap); })
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", function(d) {
        if (d.value == null || isNaN(d.value) || d.value === 0) {
          return "var(--chart-calendar-empty-fill, #ebedf0)";
        }
        return scale(d.value);
      });
  }

  remove(chart) {
    if (chart && chart.chart && typeof chart.chart.selectAll === "function") {
      chart.chart.selectAll(".myIO-calendar-root").remove();
    }
  }
}

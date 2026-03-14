export function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

export function initializeTooltip(chart) {
  chart.dom.tooltip = d3.select(chart.dom.element)
    .append("div")
    .attr("class", "toolTip")
    .attr("role", "status")
    .attr("aria-live", "polite")
    .attr("aria-hidden", "true");

  chart.dom.tooltipTitle = chart.dom.tooltip
    .append("div")
    .attr("class", "toolTipTitle");

  chart.dom.tooltipBody = chart.dom.tooltip
    .append("div")
    .attr("class", "toolTipBody");

  chart.runtime.tooltipHideTimer = null;
  chart.captureLegacyAliases();
}

export function removeHoverOverlay(chart) {
  d3.select(chart.dom.element).select(".toolTipBox").remove();
  d3.select(chart.dom.element).select(".toolLine").remove();
  d3.select(chart.dom.element).select(".toolPointLayer").remove();
  chart.runtime.toolTipBox = null;
  chart.runtime.toolLine = null;
  chart.runtime.toolPointLayer = null;
  chart.syncLegacyAliases();
}

export function createHoverOverlay(chart, onMove, onEnd) {
  removeHoverOverlay(chart);

  chart.runtime.toolLine = chart.dom.chartArea.append("line")
    .attr("class", "toolLine");

  chart.runtime.toolPointLayer = chart.dom.chartArea.append("g")
    .attr("class", "toolPointLayer");

  chart.runtime.toolTipBox = chart.dom.svg.append("rect")
    .attr("class", "toolTipBox")
    .attr("opacity", 0)
    .attr("width", chart.width - (chart.margin.left + chart.margin.right))
    .attr("height", chart.height - (chart.margin.top + chart.margin.bottom))
    .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")")
    .on("mouseover", function(event) {
      onMove(event);
    })
    .on("mousemove", function(event) {
      onMove(event);
    })
    .on("mouseout", function() {
      if (typeof onEnd === "function") {
        onEnd();
      }
    })
    .on("touchstart", function(event) {
      event.preventDefault();
      onMove(event);
    })
    .on("touchmove", function(event) {
      event.preventDefault();
      onMove(event);
    })
    .on("touchend", function() {
      if (typeof onEnd === "function") {
        onEnd();
      }
    });

  chart.syncLegacyAliases();
}

export function showChartTooltip(chart, config) {
  if (!chart.dom.tooltip) {
    return;
  }

  clearTimeout(chart.runtime.tooltipHideTimer);

  const pointer = config.pointer || [0, 0];
  const title = config.title || {};
  const items = config.items || [];
  const accentColor = items.length === 1 && items[0].color ? items[0].color : null;

  chart.dom.tooltipTitle
    .style("border-left-color", accentColor || null)
    .html("<span>" + sanitize(formatTooltipText(title)) + "</span>");

  const rows = chart.dom.tooltipBody
    .selectAll(".toolTipItem")
    .data(items);

  rows.exit().remove();

  const rowsEnter = rows.enter()
    .append("div")
    .attr("class", "toolTipItem");

  rowsEnter.append("span").attr("class", "dot");
  rowsEnter.append("span").attr("class", "toolTipLabel");
  rowsEnter.append("span").attr("class", "toolTipValue");

  rowsEnter.merge(rows)
    .select(".dot")
    .style("background-color", function(d) { return d.color || "transparent"; });

  rowsEnter.merge(rows)
    .select(".toolTipLabel")
    .text(function(d) { return d.label || ""; });

  rowsEnter.merge(rows)
    .select(".toolTipValue")
    .text(function(d) { return formatTooltipText(d); });

  chart.dom.tooltip
    .style("display", "inline-block")
    .style("opacity", 1)
    .attr("aria-hidden", "false");

  positionTooltip(chart, pointer);
}

export function hideChartTooltip(chart) {
  if (!chart.dom.tooltip) {
    return;
  }

  clearTimeout(chart.runtime.tooltipHideTimer);
  chart.runtime.tooltipHideTimer = window.setTimeout(function() {
    chart.dom.tooltip
      .style("display", "none")
      .style("opacity", 0)
      .attr("aria-hidden", "true");
  }, 300);
}

function formatTooltipText(config) {
  if (config == null) {
    return "";
  }
  if (typeof config === "string") {
    return config;
  }
  const format = typeof config.format === "function" ? config.format : function(value) { return value; };
  const text = config.text != null ? config.text : config.value;
  return text == null ? "" : format(text);
}

function positionTooltip(chart, pointer) {
  const containerRect = chart.dom.element.getBoundingClientRect();
  const tooltipNode = chart.dom.tooltip.node();

  chart.dom.tooltip
    .style("left", pointer[0] + 12 + "px")
    .style("top", pointer[1] + 12 + "px");

  const tooltipRect = tooltipNode.getBoundingClientRect();
  let left = pointer[0] + 12;
  let top = pointer[1] + 12;

  if (left + tooltipRect.width > containerRect.width) {
    left = Math.max(8, pointer[0] - tooltipRect.width - 12);
  }

  if (top + tooltipRect.height > containerRect.height) {
    top = Math.max(8, pointer[1] - tooltipRect.height - 12);
  }

  chart.dom.tooltip
    .style("left", left + "px")
    .style("top", top + "px");
}

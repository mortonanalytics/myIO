export function initializeTooltip(chart) {
  chart.tooltip = d3.select(chart.element).append("div").attr("class", "toolTip");

  chart.toolTipTitle = chart.tooltip
    .append("div")
    .attr("class", "toolTipTitle")
    .style("background-color", "lightgray");

  chart.toolTipBody = chart.tooltip
    .append("div")
    .attr("class", "toolTipBody");
}

export function removeHoverOverlay(chart) {
  d3.select(chart.element).select(".toolTipBox").remove();
  d3.select(chart.element).select(".toolLine").remove();
  chart.toolTipBox = null;
  chart.toolLine = null;
}

export function createHoverOverlay(chart, onMove) {
  removeHoverOverlay(chart);

  chart.toolLine = chart.chart.append("line").attr("class", "toolLine");
  chart.toolTipBox = chart.svg.append("rect")
    .attr("class", "toolTipBox")
    .attr("opacity", 0)
    .attr("width", chart.width - (chart.margin.left + chart.margin.right))
    .attr("height", chart.height - (chart.margin.top + chart.margin.bottom))
    .attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")")
    .on("mouseover", function() {
      chart.tooltip.style("display", null);
      chart.toolLine.style("stroke", null);
    })
    .on("mouseout", function() {
      hideTooltip(chart);
      if (chart.toolLine) {
        chart.toolLine.style("stroke", "none");
      }
    })
    .on("mousemove", onMove);
}

export function showTooltip(chart, left, top) {
  chart.tooltip
    .style("left", left + "px")
    .style("top", top + "px")
    .style("opacity", 1)
    .style("display", "inline-block");
}

export function setTooltipContent(chart, titleHtml, bodyHtml) {
  chart.toolTipTitle.html(titleHtml);
  chart.toolTipBody.html(bodyHtml);
}

export function hideTooltip(chart, delay) {
  var transition = chart.tooltip.transition();
  if (delay) {
    transition = transition.delay(delay);
  }
  transition.style("display", "none");
}

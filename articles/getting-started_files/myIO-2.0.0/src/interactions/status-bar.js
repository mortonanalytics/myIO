export function showStatusBar(chart, message, actions) {
  removeStatusBar(chart);
  var container = d3.select(chart.dom.element);
  var bar = container.append("div")
    .attr("class", "myIO-status-bar")
    .attr("role", "status")
    .attr("aria-live", "polite");

  bar.append("span")
    .attr("class", "myIO-status-bar-text")
    .text(message);

  var btnGroup = bar.append("span")
    .attr("class", "myIO-status-bar-actions");

  (actions || []).forEach(function(action) {
    btnGroup.append("button")
      .attr("class", "myIO-status-bar-btn")
      .attr("type", "button")
      .text(action.label)
      .on("click", action.handler);
  });
}

export function updateStatusBar(chart, message) {
  d3.select(chart.dom.element)
    .select(".myIO-status-bar-text")
    .text(message);
}

export function removeStatusBar(chart) {
  d3.select(chart.dom.element)
    .selectAll(".myIO-status-bar")
    .remove();
}

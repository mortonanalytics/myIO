export function syncReferenceLines(chart, state) {
  if (!state.referenceLines) {
    return;
  }

  updateReferenceLines(chart);
}

export function updateReferenceLines(chart) {
  var m = chart.margin;
  var transitionSpeed = chart.options.transition.speed;
  var xRef = [chart.options.referenceLine.x];
  var yRef = [chart.options.referenceLine.y];

  if (chart.options.referenceLine.x) {
    var xRefLine = chart.plot.selectAll(".ref-x-line").data(xRef);

    xRefLine.exit()
      .transition().duration(100)
      .style("opacity", 0)
      .attr("y2", chart.height - (m.top + m.bottom))
      .remove();

    var newxRef = xRefLine.enter().append("line")
      .attr("class", "ref-x-line")
      .attr("fill", "none")
      .style("stroke", "gray")
      .style("stroke-width", 3)
      .attr("x1", function(d) { return chart.xScale(d); })
      .attr("x2", function(d) { return chart.xScale(d); })
      .attr("y1", chart.height - (m.top + m.bottom))
      .attr("y2", chart.height - (m.top + m.bottom))
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("y2", 0);

    xRefLine.merge(newxRef)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x1", function(d) { return chart.xScale(d); })
      .attr("x2", function(d) { return chart.xScale(d); })
      .attr("y1", chart.height - (m.top + m.bottom))
      .attr("y2", 0);
  } else {
    chart.plot.selectAll(".ref-x-line").remove();
  }

  if (chart.options.referenceLine.y) {
    var yRefLine = chart.plot.selectAll(".ref-y-line").data(yRef);

    yRefLine.exit()
      .transition().duration(100)
      .attr("y2", chart.width - (m.left + m.right))
      .style("opacity", 0)
      .remove();

    var newyRef = yRefLine.enter().append("line")
      .attr("class", "ref-y-line")
      .attr("fill", "none")
      .style("stroke", "gray")
      .style("stroke-width", 3)
      .attr("x1", 0)
      .attr("x2", 0)
      .attr("y1", function(d) { return chart.yScale(d); })
      .attr("y2", function(d) { return chart.yScale(d); })
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x2", chart.width - (m.left + m.right));

    yRefLine.merge(newyRef)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .attr("x1", 0)
      .attr("x2", chart.width - (m.left + m.right))
      .attr("y1", function(d) { return chart.yScale(d); })
      .attr("y2", function(d) { return chart.yScale(d); });
  } else {
    chart.plot.selectAll(".ref-y-line").remove();
  }
}

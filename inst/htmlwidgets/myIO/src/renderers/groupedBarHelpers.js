export function transitionGrouped(chart, data, colors, bandwidth) {
  var m = chart.margin;
  var transitionSpeed = chart.options.transition.speed;
  var chartHeight = chart.options.suppressLegend == false ? (chart.totalWidth > 600 ? chart.height : chart.height * 0.8) : chart.height;
  var yFormat = d3.format(chart.options.yAxisFormat);
  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;

  chart.svg.selectAll(".y-axis")
    .transition().ease(d3.easeQuad)
    .duration(transitionSpeed)
    .call(d3.axisLeft(chart.yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left))))
    .selectAll("text")
    .attr("dx", "-.25em");

  chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
  chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
  chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");

  const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) { return d; });

  barsNew.exit().transition().duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();

  barsNew.enter()
    .append("rect")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .attr("x", function(d) { return chart.xScale(+d.data[0]) + bandwidth * d.idx; })
    .attr("y", chart.yScale(0))
    .attr("height", 0)
    .attr("width", bandwidth)
    .transition()
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("y", function(d) { return chart.yScale(d[1] - d[0]); })
    .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d[1] - d[0]); });

  barsNew.merge(barsNew)
    .transition()
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("x", function(d) { return chart.xScale(+d.data[0]) + bandwidth * d.idx; })
    .attr("width", bandwidth)
    .transition()
    .attr("y", function(d) { return chart.yScale(d[1] - d[0]); })
    .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d[1] - d[0]); });
}

export function transitionStacked(chart, data, colors, bandwidth) {
  var m = chart.margin;
  var transitionSpeed = chart.options.transition.speed;
  var chartHeight = chart.options.suppressLegend == false ? (chart.totalWidth > 600 ? chart.height : chart.height * 0.8) : chart.height;
  var yScale = d3.scaleLinear().range(chart.yScale.range());
  var yMax = getStackedMax(data);
  yScale.domain([0, yMax * 1.1]);
  var yFormat = d3.format(chart.options.yAxisFormat);
  var currentFormatY = chart.newScaleY ? chart.newScaleY : yFormat;

  chart.svg.selectAll(".y-axis")
    .transition().ease(d3.easeQuad)
    .duration(transitionSpeed)
    .call(d3.axisLeft(yScale).ticks(chartHeight < 450 ? 5 : 10, currentFormatY).tickSize(-(chart.width - (m.right + m.left))))
    .selectAll("text")
    .attr("dx", "-.25em");

  chart.plot.selectAll(".y-axis").selectAll(".domain").attr("class", "y-axis-line");
  chart.plot.selectAll(".y-axis").selectAll(".tick line").attr("class", "y-grid");
  chart.plot.selectAll(".y-axis").selectAll("text").attr("class", "y-label");

  const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) { return d; });

  barsNew.exit().transition().duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();

  barsNew.enter()
    .append("rect")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .attr("x", function(d) { return chart.xScale(+d.data[0]); })
    .attr("y", function(d) { return yScale(d[1]); })
    .attr("height", 0)
    .attr("width", bandwidth * data.length)
    .transition()
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("y", function(d) { return yScale(d[1]); })
    .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
    .transition()
    .attr("x", function(d) { return chart.xScale(+d.data[0]); })
    .attr("width", bandwidth * data.length);

  barsNew.merge(barsNew)
    .transition()
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("y", function(d) { return yScale(d[1]); })
    .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
    .transition()
    .attr("x", function(d) { return chart.xScale(+d.data[0]); })
    .attr("width", bandwidth * data.length);
}

export function getGroupedDataObject(lys, chart) {
  var data = [];
  var keys = [];
  var x_var = [];
  var y_var = [];

  lys.forEach(function(d) {
    data.push(d.data);
    keys.push(d.label);
    x_var.push(d.mapping.x_var);
    y_var.push(d.mapping.y_var);
  });

  var flattenedData = [].concat.apply([], data);
  var nestedData = d3.group(flattenedData, function(d) { return d[x_var[0]][0]; });
  var groupedKeys = [...Array(keys.length).keys()];
  var currentY = chart.newY ? chart.newY : y_var[0];

  var groupedData = d3.stack()
    .keys(groupedKeys)
    .value(function(d, key) {
      return d[1][key] == undefined ? 0 : d[1][key][currentY];
    })(nestedData);

  groupedData.forEach(function(d, i) {
    d.forEach(function(e) {
      e.idx = i;
    });
  });

  return groupedData;
}

function getStackedMax(data) {
  return d3.max(data[data.length - 1], function(d) { return d[1]; });
}

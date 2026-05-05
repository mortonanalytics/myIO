import { updateYAxis } from "../layout/axes.js";

export function transitionGrouped(chart, data, colors, bandwidth) {
  var transitionSpeed = chart.options.transition.speed;
  updateYAxis(chart, chart.yScale);

  const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) { return d; });

  barsNew.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();

  barsNew.enter()
    .append("rect")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .attr("x", function(d) { return chart.xScale(+d.data[0]) + bandwidth * d.idx; })
    .attr("y", chart.yScale(0))
    .attr("height", 0)
    .attr("width", bandwidth)
    .transition()
    .ease(d3.easeQuadOut)
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("y", function(d) { return chart.yScale(d[1] - d[0]); })
    .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d[1] - d[0]); });

  barsNew.merge(barsNew)
    .transition()
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("x", function(d) { return chart.xScale(+d.data[0]) + bandwidth * d.idx; })
    .attr("width", bandwidth)
    .transition()
    .attr("y", function(d) { return chart.yScale(d[1] - d[0]); })
    .attr("height", function(d) { return chart.yScale(0) - chart.yScale(d[1] - d[0]); });
}

export function transitionStacked(chart, data, colors, bandwidth) {
  var transitionSpeed = chart.options.transition.speed;
  var yScale = d3.scaleLinear().range(chart.yScale.range());
  var yMax = getStackedMax(data);
  yScale.domain([0, yMax * 1.1]);
  updateYAxis(chart, yScale);

  const barsNew = d3.select(chart.element).selectAll(".tag-grouped-bar-g").selectAll("rect").data(function(d) { return d; });

  barsNew.exit().transition().ease(d3.easeQuadIn).duration(transitionSpeed).attr("height", 0).attr("y", 0).remove();

  barsNew.enter()
    .append("rect")
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .attr("x", function(d) { return chart.xScale(+d.data[0]); })
    .attr("y", function(d) { return yScale(d[1]); })
    .attr("height", 0)
    .attr("width", bandwidth * data.length)
    .transition()
    .ease(d3.easeQuadOut)
    .duration(transitionSpeed)
    .delay(function(d) { return d.idx * 20; })
    .attr("y", function(d) { return yScale(d[1]); })
    .attr("height", function(d) { return yScale(d[0]) - yScale(d[1]); })
    .transition()
    .attr("x", function(d) { return chart.xScale(+d.data[0]); })
    .attr("width", bandwidth * data.length);

  barsNew.merge(barsNew)
    .transition()
    .ease(d3.easeQuad)
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
  var nestedData = d3.group(flattenedData, function(d) { return d[x_var[0]]; });
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

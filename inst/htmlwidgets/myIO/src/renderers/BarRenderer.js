export class BarRenderer {
  static type = "bar";

  render(chart, layer) {
    if (chart.options.flipAxis === true) {
      renderHorizontalBars(chart, layer);
      return;
    }

    renderVerticalBars(chart, layer);
  }
}

function renderVerticalBars(chart, layer) {
  var m = chart.margin;
  var data = layer.data;
  var key = layer.label;
  var barSize = layer.options.barSize == "small" ? 0.5 : 1;
  var bandwidth = chart.options.categoricalScale.xAxis == true ? (chart.width - (m.left + m.right)) / chart.x_banded.length : Math.min(100, (chart.width - (chart.margin.right + chart.margin.left)) / layer.data.length);
  var transitionSpeed = chart.options.transition.speed;

  var bars = chart.chart
    .selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
    .data(data);

  bars.exit().transition().duration(transitionSpeed).attr("y", chart.yScale(0)).remove();

  var newBars = bars.enter()
    .append("rect")
    .attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("fill", function(d) {
      return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
    })
    .attr("x", function(d) {
      return defineVerticalScale(chart, d, layer, bandwidth, barSize, chart.options.categoricalScale.xAxis);
    })
    .attr("y", chart.yScale(0))
    .attr("width", barSize * bandwidth - 2)
    .attr("height", chart.yScale(0));

  bars.merge(newBars)
    .transition()
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("x", function(d) {
      return defineVerticalScale(chart, d, layer, bandwidth, barSize, chart.options.categoricalScale.xAxis);
    })
    .attr("y", function(d) {
      return chart.yScale(d[layer.mapping.y_var]);
    })
    .attr("width", barSize * bandwidth - 2)
    .attr("height", function(d) {
      return chart.height - (m.top + m.bottom) - chart.yScale(d[layer.mapping.y_var]);
    });
}

function defineVerticalScale(chart, d, layer, bandwidth, barSize, scale) {
  switch (scale) {
    case true:
      return barSize == 1 ? chart.xScale(d[layer.mapping.x_var]) : chart.xScale(d[layer.mapping.x_var]) + bandwidth / 4;
    default:
      return barSize == 1 ? chart.xScale(d[layer.mapping.x_var]) - bandwidth / 2 : chart.xScale(d[layer.mapping.x_var]) - bandwidth / 4;
  }
}

function renderHorizontalBars(chart, layer) {
  var m = chart.margin;
  var data = layer.data;
  var key = layer.label;
  var barSize = layer.options.barSize == "small" ? 0.5 : 1;
  var bandwidth = chart.options.categoricalScale.yAxis == true ? (chart.height - (m.top + m.bottom)) / layer.data.length : Math.min(100, (chart.height - (chart.margin.top + chart.margin.bottom)) / layer.data.length);
  var transitionSpeed = chart.options.transition.speed;

  var bars = chart.chart
    .selectAll(".tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
    .data(data);

  bars.exit().transition().duration(transitionSpeed).attr("width", 0).remove();

  var newBars = bars.enter()
    .append("rect")
    .attr("class", "tag-bar-" + chart.element.id + "-" + key.replace(/\s+/g, ""))
    .attr("clip-path", "url(#" + chart.element.id + "clip)")
    .style("fill", function(d) {
      return chart.options.colorScheme[2] == "on" ? chart.colorScheme(d[layer.mapping.x_var]) : layer.color;
    })
    .attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    })
    .attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    })
    .attr("height", barSize * bandwidth - 2)
    .attr("width", 0);

  bars.merge(newBars)
    .transition()
    .ease(d3.easeQuad)
    .duration(transitionSpeed)
    .attr("y", function(d) {
      return barSize == 1 ? chart.yScale(d[layer.mapping.x_var]) : chart.yScale(d[layer.mapping.x_var]) + bandwidth / 4;
    })
    .attr("x", function(d) {
      return chart.xScale(Math.min(0, d[layer.mapping.y_var]));
    })
    .attr("height", barSize * bandwidth - 2)
    .attr("width", function(d) {
      return Math.abs(chart.xScale(d[layer.mapping.y_var]) - chart.xScale(0));
    });
}

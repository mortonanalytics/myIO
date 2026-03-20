import { tagName } from "../utils/responsive.js";

export class CandlestickRenderer {
  static type = "candlestick";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "linear", yScaleType: "linear", yExtentFields: ["open", "high", "low", "close"], domainMerge: "union" };
  static dataContract = {
    x_var: { required: true, numeric: true },
    open: { required: true, numeric: true },
    high: { required: true, numeric: true },
    low: { required: true, numeric: true },
    close: { required: true, numeric: true }
  };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var xVar = layer.mapping.x_var;
    var openVar = layer.mapping.open;
    var highVar = layer.mapping.high;
    var lowVar = layer.mapping.low;
    var closeVar = layer.mapping.close;
    var width = Math.max(4, Math.min(12, (chart.width - (chart.margin.left + chart.margin.right)) / Math.max(layer.data.length * 3, 1)));
    var self = this;

    var candle = chart.chart
      .selectAll("." + tagName("candlestick", chart.element.id, layer.label))
      .data(layer.data);

    candle.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var enter = candle.enter().append("g")
      .attr("class", tagName("candlestick", chart.element.id, layer.label));

    enter.append("line")
      .attr("class", "wick")
      .attr("stroke", "#666")
      .attr("stroke-width", 1.5);

    enter.append("rect")
      .attr("class", "body")
      .attr("stroke-width", 0.5);

    candle.merge(enter)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1)
      .each(function(d) {
        var group = d3.select(this);
        var x = chart.xScale(d[xVar]);
        var open = +d[openVar];
        var high = +d[highVar];
        var low = +d[lowVar];
        var close = +d[closeVar];
        var up = close >= open;
        var fill = up ? "#4CAF50" : "#F44336";
        var bodyY = chart.yScale(Math.max(open, close));
        var bodyHeight = Math.abs(chart.yScale(open) - chart.yScale(close));

        group.select("line.wick")
          .attr("x1", x)
          .attr("x2", x)
          .attr("y1", chart.yScale(low))
          .attr("y2", chart.yScale(high));

        group.select("rect.body")
          .attr("x", x - width / 2)
          .attr("y", bodyY)
          .attr("width", width)
          .attr("height", Math.max(bodyHeight, 1))
          .attr("fill", fill)
          .attr("stroke", fill);
      });
  }

  getHoverSelector(chart, layer) {
    return "." + tagName("candlestick", chart.dom.element.id, layer.label);
  }

  formatTooltip(chart, d, layer) {
    return {
      title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
      body: "O: " + d[layer.mapping.open] + ", H: " + d[layer.mapping.high] + ", L: " + d[layer.mapping.low] + ", C: " + d[layer.mapping.close],
      color: d[layer.mapping.close] >= d[layer.mapping.open] ? "#4CAF50" : "#F44336",
      label: layer.label,
      value: d[layer.mapping.close],
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("candlestick", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

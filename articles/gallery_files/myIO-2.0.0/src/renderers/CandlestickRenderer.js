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
    var chartWidth = chart.width - (chart.margin.left + chart.margin.right);
    var width = Math.max(6, Math.min(40, chartWidth / Math.max(layer.data.length * 2.5, 1)));
    var self = this;

    function candleX(d) { return chart.xScale(d[xVar]); }
    function candleFill(d) { return +d[closeVar] >= +d[openVar] ? "#4CAF50" : "#F44336"; }
    function bodyTop(d) { return chart.yScale(Math.max(+d[openVar], +d[closeVar])); }
    function bodyHeight(d) { return Math.max(Math.abs(chart.yScale(+d[openVar]) - chart.yScale(+d[closeVar])), 1); }
    function midOC(d) { return chart.yScale((+d[openVar] + +d[closeVar]) / 2); }

    var candle = chart.chart
      .selectAll("." + tagName("candlestick", chart.element.id, layer.label))
      .data(layer.data);

    candle.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var enter = candle.enter().append("g")
      .attr("class", tagName("candlestick", chart.element.id, layer.label))
      .style("opacity", 0);

    enter.append("line")
      .attr("class", "wick")
      .attr("stroke", "#666")
      .attr("stroke-width", 1.5)
      .attr("x1", candleX)
      .attr("x2", candleX)
      .attr("y1", midOC)
      .attr("y2", midOC);

    enter.append("rect")
      .attr("class", "body")
      .attr("stroke-width", 0.5)
      .attr("x", function(d) { return candleX(d) - width / 2; })
      .attr("y", midOC)
      .attr("width", width)
      .attr("height", 0)
      .attr("fill", candleFill)
      .attr("stroke", candleFill);

    var merged = candle.merge(enter);

    merged
      .transition().ease(d3.easeQuad).duration(transitionSpeed)
      .style("opacity", 1);

    merged.select("line.wick")
      .transition().ease(d3.easeQuad).duration(transitionSpeed)
      .attr("x1", candleX)
      .attr("x2", candleX)
      .attr("y1", function(d) { return chart.yScale(+d[lowVar]); })
      .attr("y2", function(d) { return chart.yScale(+d[highVar]); });

    merged.select("rect.body")
      .transition().ease(d3.easeQuad).duration(transitionSpeed)
      .attr("x", function(d) { return candleX(d) - width / 2; })
      .attr("y", bodyTop)
      .attr("width", width)
      .attr("height", bodyHeight)
      .attr("fill", candleFill)
      .attr("stroke", candleFill);
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

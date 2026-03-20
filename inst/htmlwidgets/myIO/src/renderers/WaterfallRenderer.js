import { tagName } from "../utils/responsive.js";

export class WaterfallRenderer {
  static type = "waterfall";
  static traits = { hasAxes: true, referenceLines: true, legendType: "none", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = { xScaleType: "band", yScaleType: "linear", yExtentFields: ["_base_y", "_cumulative_y"], domainMerge: "union" };
  static dataContract = { x_var: { required: true }, y_var: { required: true, numeric: true } };

  render(chart, layer) {
    var transitionSpeed = chart.options.transition.speed;
    var xVar = layer.mapping.x_var;
    var deltaVar = layer.mapping.y_var;
    var bandwidth = chart.xScale.bandwidth ? chart.xScale.bandwidth() : 0;
    var hasColorArray = Array.isArray(layer.color);

    var bars = chart.chart
      .selectAll("." + tagName("waterfall", chart.element.id, layer.label))
      .data(layer.data);

    bars.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newBars = bars.enter()
      .append("rect")
      .attr("class", tagName("waterfall", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("x", function(d) { return chart.xScale(d[xVar]); })
      .attr("width", bandwidth)
      .attr("y", function(d) {
        return chart.yScale(Math.max(+d._base_y, +d._cumulative_y));
      })
      .attr("height", function(d) {
        return Math.abs(chart.yScale(+d._base_y) - chart.yScale(+d._cumulative_y));
      })
      .attr("fill", function(d, i) {
        if (hasColorArray) {
          return layer.color[i % layer.color.length];
        }
        if (d._is_total) {
          return "#888";
        }
        return +d._cumulative_y >= +d._base_y ? "#4CAF50" : "#F44336";
      })
      .style("opacity", 0);

    bars.merge(newBars)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1)
      .attr("x", function(d) { return chart.xScale(d[xVar]); })
      .attr("width", bandwidth)
      .attr("y", function(d) {
        return chart.yScale(Math.max(+d._base_y, +d._cumulative_y));
      })
      .attr("height", function(d) {
        return Math.abs(chart.yScale(+d._base_y) - chart.yScale(+d._cumulative_y));
      })
      .attr("fill", function(d, i) {
        if (hasColorArray) {
          return layer.color[i % layer.color.length];
        }
        if (d._is_total) {
          return "#888";
        }
        return +d._cumulative_y >= +d._base_y ? "#4CAF50" : "#F44336";
      });

    var connectors = layer.data.slice(0, Math.max(layer.data.length - 1, 0));
    var connectorLines = chart.chart
      .selectAll("." + tagName("waterfall-connector", chart.element.id, layer.label))
      .data(connectors);

    connectorLines.exit().transition().duration(transitionSpeed).style("opacity", 0).remove();

    var newConnectors = connectorLines.enter()
      .append("line")
      .attr("class", tagName("waterfall-connector", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("stroke", "#666")
      .style("stroke-width", 1.5)
      .style("stroke-dasharray", "4 2")
      .attr("x1", function(d, i) { return chart.xScale(layer.data[i][xVar]) + bandwidth; })
      .attr("x2", function(d, i) { return chart.xScale(layer.data[i + 1][xVar]); })
      .attr("y1", function(d) { return chart.yScale(+d._cumulative_y); })
      .attr("y2", function(d) { return chart.yScale(+d._cumulative_y); })
      .style("opacity", 0);

    connectorLines.merge(newConnectors)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1)
      .attr("x1", function(d, i) { return chart.xScale(layer.data[i][xVar]) + bandwidth; })
      .attr("x2", function(d, i) { return chart.xScale(layer.data[i + 1][xVar]); })
      .attr("y1", function(d) { return chart.yScale(+d._cumulative_y); })
      .attr("y2", function(d) { return chart.yScale(+d._cumulative_y); });
  }

  formatTooltip(chart, d, layer) {
    return {
      title: layer.mapping.x_var + ": " + d[layer.mapping.x_var],
      body: "Delta: " + d[layer.mapping.y_var] + ", Total: " + d._cumulative_y,
      color: d._is_total ? "#888" : (+d._cumulative_y >= +d._base_y ? "#4CAF50" : "#F44336"),
      label: layer.label,
      value: d._cumulative_y,
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("waterfall", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("waterfall-connector", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

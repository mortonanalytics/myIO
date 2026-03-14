import { linearRegression } from "../utils/math.js";
import { tagName } from "../utils/responsive.js";

export class RegressionRenderer {
  static type = "regression";
  static traits = { hasAxes: true, referenceLines: false, legendType: "none", binning: false, rolloverStyle: "none", scaleCapabilities: { invertX: false } };
  static dataContract = { x_var: { required: true, numeric: true }, y_var: { required: true, numeric: true } };

  renderFromPoints(chart, color, label) {
    var that = chart;
    var transitionSpeed = chart.options.transition.speed / 2;

    var valueLine = d3.line()
      .x(function(d) {
        return chart.xScale(d.x_var);
      })
      .y(function(d) {
        return chart.yScale(d.y_est);
      });

    var points = [];

    chart.chart
      .selectAll("." + tagName("point", chart.element.id, label))
      .each(function() {
        var x = that.xScale.invert(this.getAttribute("cx"));
        var y = that.yScale.invert(this.getAttribute("cy"));
        points.push({
          x_var: x,
          y_var: y
        });
      });

    var regression = linearRegression(points, "y_var", "x_var");

    if (HTMLWidgets.shinyMode) {
      Shiny.onInputChange("myIOregression-" + label.replace(/\s+/g, ""), regression);
    }

    points.forEach(function(d) {
      d.y_est = regression.fn(d.x_var);
    });

    var finalPoints = points
      .sort(function(a, b) {
        return a.x_var - b.x_var;
      })
      .filter(function(d, i) {
        return i === 0 || i === points.length - 1;
      });

    var linePath = chart.chart
      .selectAll("." + tagName("regression-line", chart.element.id, label))
      .data([finalPoints]);

    linePath.exit()
      .transition()
      .duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var newLinePath = linePath.enter()
      .append("path")
      .attr("class", tagName("regression-line", chart.element.id, label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .style("fill", "none")
      .style("stroke", color)
      .style("stroke-width", 3)
      .style("opacity", 0);

    linePath.merge(newLinePath)
      .transition()
      .ease(d3.easeQuad)
      .duration(transitionSpeed)
      .style("opacity", 1)
      .style("stroke", color)
      .attr("d", valueLine);
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("regression-line", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

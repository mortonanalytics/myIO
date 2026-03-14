import { resolveColor, tagName } from "../utils/responsive.js";

export function bindPointDrag(chart, layer) {
  var color = resolveColor(chart, layer.data[layer.mapping.group], layer.color);

  var drag = d3.drag()
    .on("start", function() {
      d3.select(this).raise().classed("active", true);
    })
    .on("drag", function(event, d) {
      d[0] = chart.xScale.invert(event.x);
      d[1] = chart.yScale.invert(event.y);

      d3.select(this)
        .attr("cx", chart.xScale(d[0]))
        .attr("cy", chart.yScale(d[1]));
    })
    .on("end", function() {
      d3.select(this).classed("active", false);
      chart.updateRegression(color, layer.label);
    });

  chart.chart
    .selectAll("." + tagName("point", chart.element.id, layer.label))
    .call(drag);
}

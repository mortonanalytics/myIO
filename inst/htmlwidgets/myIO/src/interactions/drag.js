import { resolveColor, tagName } from "../utils/responsive.js";

export function bindPointDrag(chart, layer) {
  var color = resolveColor(chart, layer.label, layer.color);

  var drag = d3.drag()
    .on("start", function() {
      d3.select(this).raise().classed("active", true).style("cursor", "grabbing");
    })
    .on("drag", function(event, d) {
      d[layer.mapping.x_var] = chart.xScale.invert(event.x);
      d[layer.mapping.y_var] = chart.yScale.invert(event.y);

      d3.select(this)
        .attr("cx", chart.xScale(d[layer.mapping.x_var]))
        .attr("cy", chart.yScale(d[layer.mapping.y_var]));
    })
    .on("end", function() {
      d3.select(this).classed("active", false).style("cursor", "grab");
      chart.updateRegression(color, layer.label);
    });

  chart.chart
    .selectAll("." + tagName("point", chart.element.id, layer.label))
    .style("cursor", "grab")
    .call(drag);
}

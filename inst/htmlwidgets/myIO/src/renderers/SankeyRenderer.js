import { getChartHeight } from "../layout/scaffold.js";
import { tagName } from "../utils/responsive.js";

export class SankeyRenderer {
  static type = "sankey";
  static traits = { hasAxes: false, referenceLines: false, legendType: "ordinal", binning: false, rolloverStyle: "element", scaleCapabilities: { invertX: false } };
  static scaleHints = null;
  static dataContract = { source: { required: true }, target: { required: true }, value: { required: true, numeric: true } };

  render(chart, layer) {
    var m = chart.margin;
    var width = chart.width - (m.left + m.right);
    var height = getChartHeight(chart) - (m.top + m.bottom);
    var nodeWidth = 18;
    var sankey = d3.sankey()
      .nodeId(function(d) { return d.name; })
      .nodeWidth(nodeWidth)
      .nodePadding(12)
      .extent([[0, 0], [width, height]]);

    var nodesByName = new Map();
    var links = layer.data.map(function(d) {
      var source = d[layer.mapping.source];
      var target = d[layer.mapping.target];
      if (!nodesByName.has(source)) {
        nodesByName.set(source, { name: source });
      }
      if (!nodesByName.has(target)) {
        nodesByName.set(target, { name: target });
      }
      return {
        source: source,
        target: target,
        value: +d[layer.mapping.value]
      };
    });

    var graph = sankey({
      nodes: Array.from(nodesByName.values()),
      links: links
    });

    chart.derived.colorDiscrete = d3.scaleOrdinal().domain(graph.nodes.map(function(d) { return d.name; })).range(layer.color || d3.schemeTableau10);
    chart.colorDiscrete = chart.derived.colorDiscrete;

    var link = chart.chart
      .selectAll("." + tagName("sankey", chart.element.id, layer.label))
      .data(graph.links);

    link.exit().transition().duration(chart.options.transition.speed).style("opacity", 0).remove();

    var newLink = link.enter()
      .append("path")
      .attr("class", tagName("sankey", chart.element.id, layer.label))
      .attr("fill", "none")
      .attr("stroke", "#888")
      .attr("stroke-opacity", 0.4)
      .attr("clip-path", "url(#" + chart.element.id + "clip)");

    link.merge(newLink)
      .transition()
      .ease(d3.easeQuad)
      .duration(chart.options.transition.speed)
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", function(d) { return Math.max(1, d.width); })
      .attr("stroke", function(d) { return chart.colorDiscrete(d.source.name); });

    var node = chart.chart
      .selectAll("." + tagName("sankey-node", chart.element.id, layer.label))
      .data(graph.nodes);

    node.exit().transition().duration(chart.options.transition.speed).style("opacity", 0).remove();

    var newNode = node.enter()
      .append("rect")
      .attr("class", tagName("sankey-node", chart.element.id, layer.label))
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("fill", function(d) { return chart.colorDiscrete(d.name); });

    node.merge(newNode)
      .transition()
      .ease(d3.easeQuad)
      .duration(chart.options.transition.speed)
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return Math.max(1, d.y1 - d.y0); })
      .attr("fill", function(d) { return chart.colorDiscrete(d.name); });
  }

  formatTooltip(chart, d, layer) {
    if (d && Object.prototype.hasOwnProperty.call(d, "source")) {
      return {
        title: d.source.name + " -> " + d.target.name,
        body: "Value: " + d.value,
        color: chart.colorDiscrete ? chart.colorDiscrete(d.source.name) : layer.color,
        label: layer.label,
        value: d.value,
        raw: d
      };
    }

    return {
      title: d.name,
      body: "Value: " + d.value,
      color: chart.colorDiscrete ? chart.colorDiscrete(d.name) : layer.color,
      label: layer.label,
      value: d.value,
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll("." + tagName("sankey", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("sankey-node", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

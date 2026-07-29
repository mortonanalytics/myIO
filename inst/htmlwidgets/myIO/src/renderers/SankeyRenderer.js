import { easingFor } from "../transitions/easing.js";
import { getChartHeight } from "../layout/scaffold.js";
import { tagName } from "../utils/responsive.js";
import { chartBackgroundColor, readableTextColor } from "../theme/contrast.js";
import { measureLabelWidth, textWidth } from "../utils/text-metrics.js";

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
    var showValues = !(layer.options && layer.options.showValues === false);
    var valueFormat = d3.format(
      (layer.options && layer.options.valueFormat) ||
      (chart.options && chart.options.yAxisFormat) || ","
    );
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

    function nodeLabelText(name, value) {
      return showValues ? String(name) + " " + valueFormat(value) : String(name);
    }

    // Terminal nodes (never a source) carry their label to the right of the node,
    // so the layout has to give up that much horizontal room.
    var sourceNames = new Set();
    var incomingTotals = new Map();
    links.forEach(function(link) {
      sourceNames.add(link.source);
      incomingTotals.set(link.target, (incomingTotals.get(link.target) || 0) + link.value);
    });

    var terminalLabels = [];
    nodesByName.forEach(function(node, name) {
      if (!sourceNames.has(name)) {
        terminalLabels.push(nodeLabelText(name, incomingTotals.get(name) || 0));
      }
    });

    var labelGutter = terminalLabels.length > 0
      ? Math.min(measureLabelWidth(chart.chart, terminalLabels, "12px") + 10, Math.max(0, width * 0.3))
      : 0;
    var layoutWidth = Math.max(nodeWidth * 2, width - labelGutter);

    var sankey = d3.sankey()
      .nodeId(function(d) { return d.name; })
      .nodeWidth(nodeWidth)
      .nodePadding(12)
      .extent([[0, 0], [layoutWidth, height]]);

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
      .attr("stroke-opacity", 0.4)
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke-width", function(d) { return Math.max(1, d.width); })
      .attr("stroke", function(d) { return chart.colorDiscrete(d.source.name); })
      .style("opacity", 0);

    link.merge(newLink)
      .transition()
      .ease(easingFor(chart, d3.easeQuad))
      .duration(chart.options.transition.speed)
      .style("opacity", 1)
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
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return Math.max(1, d.y1 - d.y0); })
      .attr("fill", function(d) { return chart.colorDiscrete(d.name); })
      .style("opacity", 0);

    node.merge(newNode)
      .transition()
      .ease(easingFor(chart, d3.easeQuad))
      .duration(chart.options.transition.speed)
      .style("opacity", 1)
      .attr("x", function(d) { return d.x0; })
      .attr("y", function(d) { return d.y0; })
      .attr("width", function(d) { return d.x1 - d.x0; })
      .attr("height", function(d) { return Math.max(1, d.y1 - d.y0); })
      .attr("fill", function(d) { return chart.colorDiscrete(d.name); });

    // Node labels — data-joined so updates animate and no flash from clear-redraw
    var bgColor = chartBackgroundColor(chart);
    var labelInk = readableTextColor(bgColor);
    var labelClass = tagName("sankey-label", chart.element.id, layer.label);

    function anchorsStart(d) { return d.x0 < layoutWidth / 2 || d.x1 >= layoutWidth - 0.5; }
    function labelX(d) { return anchorsStart(d) ? d.x1 + 6 : d.x0 - 6; }
    function labelY(d) { return (d.y0 + d.y1) / 2; }
    function labelAnchor(d) { return anchorsStart(d) ? "start" : "end"; }
    function labelText(d) { return nodeLabelText(d.name, d.value); }

    var labelSelection = chart.chart.selectAll("." + labelClass)
      .data(graph.nodes, function(d) { return d.name; });

    labelSelection.exit()
      .transition().duration(chart.options.transition.speed)
      .style("opacity", 0)
      .remove();

    var labelEnter = labelSelection.enter().append("text")
      .attr("class", labelClass)
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("dy", "0.35em")
      .attr("text-anchor", labelAnchor)
      .attr("font-size", "12px")
      .attr("pointer-events", "none")
      .style("opacity", 0)
      .text(labelText);

    labelEnter.merge(labelSelection)
      .attr("fill", labelInk)
      .attr("stroke", bgColor)
      .attr("stroke-width", 3)
      .attr("stroke-linejoin", "round")
      .attr("paint-order", "stroke")
      .text(labelText)
      .transition().duration(chart.options.transition.speed)
      .style("opacity", 1)
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", labelAnchor);

    // Flow magnitudes — suppressed on ribbons too thin or too short to hold the text.
    var flowClass = tagName("sankey-flow", chart.element.id, layer.label);
    var flowSelection = chart.chart.selectAll("." + flowClass)
      .data(showValues ? graph.links : [], function(d) { return d.source.name + ">" + d.target.name; });

    flowSelection.exit()
      .transition().duration(chart.options.transition.speed)
      .style("opacity", 0)
      .remove();

    var flowEnter = flowSelection.enter().append("text")
      .attr("class", flowClass)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("pointer-events", "none")
      .style("opacity", 0);

    flowEnter.merge(flowSelection)
      .attr("x", function(d) { return (d.source.x1 + d.target.x0) / 2; })
      .attr("y", function(d) { return (d.y0 + d.y1) / 2; })
      .attr("fill", function(d) {
        return readableTextColor(d3.interpolateRgb(bgColor, chart.colorDiscrete(d.source.name))(0.4));
      })
      .text(function(d) { return valueFormat(d.value); })
      .attr("fill-opacity", function(d) {
        var span = (d.target.x0 - d.source.x1) - 8;
        return (d.width >= 11 && textWidth(this, valueFormat(d.value)) <= span) ? 1 : 0;
      })
      .transition().duration(chart.options.transition.speed)
      .style("opacity", 1);
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
    chart.dom.chartArea.selectAll("." + tagName("sankey-label", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
    chart.dom.chartArea.selectAll("." + tagName("sankey-flow", chart.dom.element.id, layer.label)).transition().duration(500).style("opacity", 0).remove();
  }
}

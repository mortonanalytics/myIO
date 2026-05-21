export class DumbbellRenderer {
  static type = "dumbbell";
  static traits = {
    hasAxes: true,
    referenceLines: true,
    legendType: "layer",
    binning: false,
    rolloverStyle: "element",
    scaleCapabilities: { invertX: false }
  };
  static scaleHints = {
    xScaleType: "band",
    yScaleType: "linear",
    xExtentFields: [],
    yExtentFields: ["low_y", "high_y"],
    domainMerge: "union"
  };
  static dataContract = {
    x_var: { required: true, numeric: false },
    low_y: { required: true, numeric: true },
    high_y: { required: true, numeric: true }
  };

  render(chart, layer, layers) {
    var xScale = chart.derived.xScale;
    var yScale = chart.derived.yScale;
    var flipAxis = chart.config.scales.flipAxis;
    var speed = chart.options.transition.speed;
    var group = chart.dom.chartArea.selectAll(".tag-dumbbell-" + layer.id)
      .data([null]).join("g").attr("class", "tag-dumbbell-" + layer.id);

    var dotRadius = (layer.options && layer.options.dotRadius) || 5;
    var lineWidth = (layer.options && layer.options.lineWidth) || 2;
    var xVar = layer.mapping.x_var;
    var lowVar = layer.mapping.low_y;
    var highVar = layer.mapping.high_y;
    var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
    var bandOffsetY = yScale.bandwidth ? yScale.bandwidth() / 2 : 0;

    function endpoints(d) {
      if (flipAxis) {
        var yPos = yScale(d[xVar]) + bandOffsetY;
        var lowX = xScale(d[lowVar]);
        var highX = xScale(d[highVar]);
        return {
          lowX: lowX, lowY: yPos,
          highX: highX, highY: yPos,
          midX: (lowX + highX) / 2, midY: yPos
        };
      }
      var xPos = xScale(d[xVar]) + bandOffset;
      var lowY = yScale(d[lowVar]);
      var highY = yScale(d[highVar]);
      return {
        lowX: xPos, lowY: lowY,
        highX: xPos, highY: highY,
        midX: xPos, midY: (lowY + highY) / 2
      };
    }

    var lines = group.selectAll(".dumbbell-line")
      .data(layer.data, function(d) { return d._source_key; });

    lines.exit()
      .transition().duration(speed)
      .style("opacity", 0)
      .attr("x1", function(d) { return endpoints(d).midX; })
      .attr("x2", function(d) { return endpoints(d).midX; })
      .attr("y1", function(d) { return endpoints(d).midY; })
      .attr("y2", function(d) { return endpoints(d).midY; })
      .remove();

    var linesEnter = lines.enter()
      .append("line")
      .attr("class", "dumbbell-line")
      .attr("x1", function(d) { return endpoints(d).midX; })
      .attr("x2", function(d) { return endpoints(d).midX; })
      .attr("y1", function(d) { return endpoints(d).midY; })
      .attr("y2", function(d) { return endpoints(d).midY; })
      .attr("stroke", "var(--chart-grid-color, #ccc)")
      .attr("stroke-width", lineWidth)
      .style("opacity", 0);

    linesEnter.merge(lines)
      .transition().duration(speed)
      .style("opacity", 1)
      .attr("x1", function(d) { return endpoints(d).lowX; })
      .attr("x2", function(d) { return endpoints(d).highX; })
      .attr("y1", function(d) { return endpoints(d).lowY; })
      .attr("y2", function(d) { return endpoints(d).highY; })
      .attr("stroke", "var(--chart-grid-color, #ccc)")
      .attr("stroke-width", lineWidth);

    var lowDots = group.selectAll(".dumbbell-low")
      .data(layer.data, function(d) { return d._source_key; });

    lowDots.exit()
      .transition().duration(speed)
      .style("opacity", 0)
      .attr("cx", function(d) { return endpoints(d).midX; })
      .attr("cy", function(d) { return endpoints(d).midY; })
      .remove();

    var lowEnter = lowDots.enter()
      .append("circle")
      .attr("class", "dumbbell-low")
      .attr("cx", function(d) { return endpoints(d).midX; })
      .attr("cy", function(d) { return endpoints(d).midY; })
      .attr("r", dotRadius)
      .attr("fill", layer.color)
      .attr("opacity", 0);

    lowEnter.merge(lowDots)
      .transition().duration(speed)
      .attr("cx", function(d) { return endpoints(d).lowX; })
      .attr("cy", function(d) { return endpoints(d).lowY; })
      .attr("r", dotRadius)
      .attr("fill", layer.color)
      .attr("opacity", 0.6);

    var highDots = group.selectAll(".dumbbell-high")
      .data(layer.data, function(d) { return d._source_key; });

    highDots.exit()
      .transition().duration(speed)
      .style("opacity", 0)
      .attr("cx", function(d) { return endpoints(d).midX; })
      .attr("cy", function(d) { return endpoints(d).midY; })
      .remove();

    var highEnter = highDots.enter()
      .append("circle")
      .attr("class", "dumbbell-high")
      .attr("cx", function(d) { return endpoints(d).midX; })
      .attr("cy", function(d) { return endpoints(d).midY; })
      .attr("r", dotRadius)
      .attr("fill", layer.color)
      .attr("opacity", 0);

    highEnter.merge(highDots)
      .transition().duration(speed)
      .attr("cx", function(d) { return endpoints(d).highX; })
      .attr("cy", function(d) { return endpoints(d).highY; })
      .attr("r", dotRadius)
      .attr("fill", layer.color)
      .attr("opacity", 1);
  }

  getHoverSelector(chart, layer) {
    return ".tag-dumbbell-" + layer.id + " .dumbbell-high, .tag-dumbbell-" + layer.id + " .dumbbell-low";
  }

  formatTooltip(chart, d, layer) {
    var yFormat = chart.runtime.activeYFormat || d3.format("s");
    return {
      title: { text: String(d[layer.mapping.x_var]) },
      items: [
        { color: layer.color, label: "Low", value: yFormat(d[layer.mapping.low_y]) },
        { color: layer.color, label: "High", value: yFormat(d[layer.mapping.high_y]) }
      ]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-dumbbell-" + layer.id).remove();
  }
}

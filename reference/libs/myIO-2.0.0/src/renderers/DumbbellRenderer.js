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
    var speed = chart.config.transitions.speed;
    var group = chart.dom.chartArea.selectAll(".tag-dumbbell-" + layer.id)
      .data([null]).join("g").attr("class", "tag-dumbbell-" + layer.id);

    var dotRadius = (layer.options && layer.options.dotRadius) || 5;
    var lineWidth = (layer.options && layer.options.lineWidth) || 2;
    var xVar = layer.mapping.x_var;
    var lowVar = layer.mapping.low_y;
    var highVar = layer.mapping.high_y;
    var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
    var lines = group.selectAll(".dumbbell-line")
      .data(layer.data, function(d) { return d._source_key; });

    lines.exit()
      .transition()
      .duration(speed)
      .style("opacity", 0)
      .remove();

    if (flipAxis) {
      lines.join("line")
        .attr("class", "dumbbell-line")
        .transition()
        .duration(speed)
        .attr("x1", function(d) { return xScale(d[lowVar]); })
        .attr("x2", function(d) { return xScale(d[highVar]); })
        .attr("y1", function(d) { return yScale(d[xVar]) + bandOffset; })
        .attr("y2", function(d) { return yScale(d[xVar]) + bandOffset; })
        .attr("stroke", "var(--chart-grid-color, #ccc)")
        .attr("stroke-width", lineWidth);
    } else {
      lines.join("line")
        .attr("class", "dumbbell-line")
        .transition()
        .duration(speed)
        .attr("x1", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("x2", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("y1", function(d) { return yScale(d[lowVar]); })
        .attr("y2", function(d) { return yScale(d[highVar]); })
        .attr("stroke", "var(--chart-grid-color, #ccc)")
        .attr("stroke-width", lineWidth);
    }

    var lowDots = group.selectAll(".dumbbell-low")
      .data(layer.data, function(d) { return d._source_key; });

    lowDots.exit()
      .transition()
      .duration(speed)
      .style("opacity", 0)
      .remove();

    if (flipAxis) {
      lowDots.join("circle")
        .attr("class", "dumbbell-low")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[lowVar]); })
        .attr("cy", function(d) { return yScale(d[xVar]) + bandOffset; })
        .attr("r", dotRadius)
        .attr("fill", layer.color)
        .attr("opacity", 0.6);
    } else {
      lowDots.join("circle")
        .attr("class", "dumbbell-low")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("cy", function(d) { return yScale(d[lowVar]); })
        .attr("r", dotRadius)
        .attr("fill", layer.color)
        .attr("opacity", 0.6);
    }

    var highDots = group.selectAll(".dumbbell-high")
      .data(layer.data, function(d) { return d._source_key; });

    highDots.exit()
      .transition()
      .duration(speed)
      .style("opacity", 0)
      .remove();

    if (flipAxis) {
      highDots.join("circle")
        .attr("class", "dumbbell-high")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[highVar]); })
        .attr("cy", function(d) { return yScale(d[xVar]) + bandOffset; })
        .attr("r", dotRadius)
        .attr("fill", layer.color);
    } else {
      highDots.join("circle")
        .attr("class", "dumbbell-high")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("cy", function(d) { return yScale(d[highVar]); })
        .attr("r", dotRadius)
        .attr("fill", layer.color);
    }
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

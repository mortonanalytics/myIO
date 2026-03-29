export class LollipopRenderer {
  static type = "lollipop";
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
    yExtentFields: ["y_var"],
    domainMerge: "union"
  };
  static dataContract = {
    x_var: { required: true, numeric: false },
    y_var: { required: true, numeric: true }
  };

  render(chart, layer, layers) {
    var xScale = chart.derived.xScale;
    var yScale = chart.derived.yScale;
    var flipAxis = chart.config.scales.flipAxis;
    var speed = chart.config.transitions.speed;
    var group = chart.dom.chartArea.selectAll(".tag-lollipop-" + layer.id)
      .data([null]).join("g").attr("class", "tag-lollipop-" + layer.id);

    var headRadius = (layer.options && layer.options.headRadius) || 5;
    var stemWidth = (layer.options && layer.options.stemWidth) || 2;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
    var baseline = typeof yScale(0) === "number" ? yScale(0) : yScale.range()[0];
    var stems = group.selectAll(".lollipop-stem")
      .data(layer.data, function(d) { return d._source_key; });

    stems.exit()
      .transition()
      .duration(speed)
      .style("opacity", 0)
      .remove();

    if (flipAxis) {
      stems.join("line")
        .attr("class", "lollipop-stem")
        .transition()
        .duration(speed)
        .attr("x1", 0)
        .attr("x2", function(d) { return xScale(d[xVar]); })
        .attr("y1", function(d) { return yScale(d[yVar]) + bandOffset; })
        .attr("y2", function(d) { return yScale(d[yVar]) + bandOffset; })
        .attr("stroke", layer.color)
        .attr("stroke-width", stemWidth);
    } else {
      stems.join("line")
        .attr("class", "lollipop-stem")
        .transition()
        .duration(speed)
        .attr("x1", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("x2", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("y1", baseline)
        .attr("y2", function(d) { return yScale(d[yVar]); })
        .attr("stroke", layer.color)
        .attr("stroke-width", stemWidth);
    }

    var heads = group.selectAll(".lollipop-head")
      .data(layer.data, function(d) { return d._source_key; });

    heads.exit()
      .transition()
      .duration(speed)
      .style("opacity", 0)
      .remove();

    if (flipAxis) {
      heads.join("circle")
        .attr("class", "lollipop-head")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[xVar]); })
        .attr("cy", function(d) { return yScale(d[yVar]) + bandOffset; })
        .attr("r", headRadius)
        .attr("fill", layer.color);
    } else {
      heads.join("circle")
        .attr("class", "lollipop-head")
        .transition()
        .duration(speed)
        .attr("cx", function(d) { return xScale(d[xVar]) + bandOffset; })
        .attr("cy", function(d) { return yScale(d[yVar]); })
        .attr("r", headRadius)
        .attr("fill", layer.color);
    }
  }

  getHoverSelector(chart, layer) {
    return ".tag-lollipop-" + layer.id + " .lollipop-head";
  }

  formatTooltip(chart, d, layer) {
    var yFormat = chart.runtime.activeYFormat || d3.format("s");
    return {
      title: { text: String(d[layer.mapping.x_var]) },
      items: [{
        color: layer.color,
        label: layer.label,
        value: yFormat(d[layer.mapping.y_var])
      }]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-lollipop-" + layer.id).remove();
  }
}

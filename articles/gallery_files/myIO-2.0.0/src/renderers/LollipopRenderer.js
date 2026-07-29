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
    yZeroBaseline: true,
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
    var speed = chart.options.transition.speed;
    var group = chart.dom.chartArea.selectAll(".tag-lollipop-" + layer.id)
      .data([null]).join("g").attr("class", "tag-lollipop-" + layer.id);

    var headRadius = (layer.options && layer.options.headRadius) || 5;
    var stemWidth = (layer.options && layer.options.stemWidth) || 2;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var bandOffset = xScale.bandwidth ? xScale.bandwidth() / 2 : 0;
    var yBaseline = typeof yScale(0) === "number" ? yScale(0) : yScale.range()[0];
    var xBaseline = typeof xScale(0) === "number" ? xScale(0) : xScale.range()[0];

    function stemPos(d) {
      if (flipAxis) {
        var stemY = yScale(d[xVar]);
        if (yScale.bandwidth) {
          stemY += bandOffset;
        }
        return {
          x1: xBaseline,
          x2: xScale(d[yVar]),
          y1: stemY,
          y2: stemY
        };
      }
      var stemX = xScale(d[xVar]) + bandOffset;
      return {
        x1: stemX,
        x2: stemX,
        y1: yBaseline,
        y2: yScale(d[yVar])
      };
    }

    function headPos(d) {
      var p = stemPos(d);
      return { cx: p.x2, cy: p.y2 };
    }

    var stems = group.selectAll(".lollipop-stem")
      .data(layer.data, function(d) { return d._source_key; });

    stems.exit()
      .transition().duration(speed)
      .style("opacity", 0)
      .attr("x2", flipAxis ? xBaseline : function(d) { return xScale(d[xVar]) + bandOffset; })
      .attr("y2", flipAxis ? function(d) { var y = yScale(d[xVar]); return yScale.bandwidth ? y + bandOffset : y; } : yBaseline)
      .remove();

    var stemEnter = stems.enter()
      .append("line")
      .attr("class", "lollipop-stem")
      .attr("x1", function(d) { return stemPos(d).x1; })
      .attr("x2", function(d) { return flipAxis ? stemPos(d).x1 : stemPos(d).x2; })
      .attr("y1", function(d) { return stemPos(d).y1; })
      .attr("y2", function(d) { return flipAxis ? stemPos(d).y1 : stemPos(d).y1; })
      .attr("stroke", layer.color)
      .attr("stroke-width", stemWidth)
      .style("opacity", 0);

    stemEnter.merge(stems)
      .transition().duration(speed)
      .style("opacity", 1)
      .attr("x1", function(d) { return stemPos(d).x1; })
      .attr("x2", function(d) { return stemPos(d).x2; })
      .attr("y1", function(d) { return stemPos(d).y1; })
      .attr("y2", function(d) { return stemPos(d).y2; })
      .attr("stroke", layer.color)
      .attr("stroke-width", stemWidth);

    var heads = group.selectAll(".lollipop-head")
      .data(layer.data, function(d) { return d._source_key; });

    heads.exit()
      .transition().duration(speed)
      .style("opacity", 0)
      .attr("cx", function(d) { return stemPos(d).x1; })
      .attr("cy", function(d) { return stemPos(d).y1; })
      .remove();

    var headEnter = heads.enter()
      .append("circle")
      .attr("class", "lollipop-head")
      .attr("cx", function(d) { return stemPos(d).x1; })
      .attr("cy", function(d) { return stemPos(d).y1; })
      .attr("r", headRadius)
      .attr("fill", layer.color)
      .style("opacity", 0);

    headEnter.merge(heads)
      .transition().duration(speed)
      .style("opacity", 1)
      .attr("cx", function(d) { return headPos(d).cx; })
      .attr("cy", function(d) { return headPos(d).cy; })
      .attr("r", headRadius)
      .attr("fill", layer.color);
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

export class BumpRenderer {
  static type = "bump";
  static traits = {
    hasAxes: true,
    referenceLines: false,
    legendType: "layer",
    binning: false,
    rolloverStyle: "element",
    scaleCapabilities: {}
  };
  static scaleHints = {
    xScaleType: "point",
    yScaleType: "linear",
    xExtentFields: [],
    yExtentFields: ["y_var"],
    domainMerge: "union"
  };
  static dataContract = {
    x_var: { required: true },
    y_var: { required: true, numeric: true },
    group: { required: true }
  };

  render(chart, layer) {
    var xScale = chart.derived.xScale;
    var yScale = chart.derived.yScale;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var groupVar = layer.mapping.group;
    var dotRadius = (layer.options && layer.options.dotRadius) || 5;
    var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);

    var groups = d3.group(layer.data, function(d) { return d[groupVar]; });

    var group = chart.dom.chartArea.selectAll(".tag-bump-" + layer.id)
      .data([null]).join("g").attr("class", "tag-bump-" + layer.id);

    var line = d3.line()
      .x(function(d) { return xScale(d[xVar]); })
      .y(function(d) { return yScale(d[yVar]); })
      .curve(d3.curveBumpX);

    var groupIndex = 0;
    groups.forEach(function(data, name) {
      var color = colorScale(name);
      var sorted = data.slice().sort(function(a, b) {
        return String(a[xVar]).localeCompare(String(b[xVar]));
      });

      group.selectAll(".bump-line-" + groupIndex)
        .data([sorted])
        .join("path")
        .attr("class", "bump-line bump-line-" + groupIndex)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 2.5)
        .attr("stroke-opacity", 0.8);

      group.selectAll(".bump-dot-" + groupIndex)
        .data(sorted)
        .join("circle")
        .attr("class", "bump-dot bump-dot-" + groupIndex)
        .attr("cx", function(d) { return xScale(d[xVar]); })
        .attr("cy", function(d) { return yScale(d[yVar]); })
        .attr("r", dotRadius)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5);

      groupIndex++;
    });
  }

  getHoverSelector(chart, layer) {
    return ".tag-bump-" + layer.id + " .bump-dot";
  }

  formatTooltip(chart, d, layer) {
    return {
      title: { text: String(d[layer.mapping.group]) },
      items: [
        { color: layer.color, label: String(d[layer.mapping.x_var]), value: String(d[layer.mapping.y_var]) }
      ]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-bump-" + layer.id).remove();
  }
}

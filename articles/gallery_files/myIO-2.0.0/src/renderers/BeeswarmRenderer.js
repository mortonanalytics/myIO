import { easingFor, staggerDelay } from "../transitions/easing.js";

export class BeeswarmRenderer {
  static type = "beeswarm";
  static traits = {
    hasAxes: true,
    referenceLines: true,
    legendType: "layer",
    binning: false,
    rolloverStyle: "element",
    scaleCapabilities: { invertX: false }
  };
  static scaleHints = {
    xScaleType: "linear",
    yScaleType: "linear",
    xExtentFields: ["x_var"],
    yExtentFields: ["y_var"],
    domainMerge: "union"
  };
  static dataContract = {
    x_var: { required: true, numeric: true },
    y_var: { required: true }
  };

  render(chart, layer) {
    var xScale = chart.derived.xScale;
    var yScale = chart.derived.yScale;
    var radius = (layer.options && layer.options.radius) || 3;
    var padding = (layer.options && layer.options.padding) || 1;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;

    var data = layer.data.slice().sort(function(a, b) {
      return xScale(a[xVar]) - xScale(b[xVar]);
    });

    var placed = [];
    var diameter = 2 * radius + padding;

    for (var i = 0; i < data.length; i++) {
      var cx = xScale(data[i][xVar]);
      var baseY = yScale(data[i][yVar]) + (typeof yScale.bandwidth === "function" ? yScale.bandwidth() / 2 : 0);
      var dy = 0;
      var found = false;

      for (var attempt = 0; attempt < 500 && !found; attempt++) {
        var candidateY = attempt === 0 ? baseY
          : (attempt % 2 === 1
            ? baseY + Math.ceil(attempt / 2) * diameter
            : baseY - Math.ceil(attempt / 2) * diameter);

        var collision = false;
        for (var j = 0; j < placed.length; j++) {
          var dx2 = cx - placed[j].cx;
          var dy2 = candidateY - placed[j].cy;
          if (dx2 * dx2 + dy2 * dy2 < diameter * diameter) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          dy = candidateY;
          found = true;
        }
      }

      data[i]._beeswarm_cx = cx;
      data[i]._beeswarm_cy = dy;
      placed.push({ cx: cx, cy: dy });
    }

    var group = chart.dom.chartArea.selectAll(".tag-beeswarm-" + layer.id)
      .data([null]).join("g").attr("class", "tag-beeswarm-" + layer.id);

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;

    var points = group.selectAll(".beeswarm-point")
      .data(data, function(d) { return d._source_key; });

    points.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .attr("fill-opacity", 0)
      .remove();

    var pointsEnter = points.enter().append("circle")
      .attr("class", "beeswarm-point")
      .attr("cx", function(d) { return d._beeswarm_cx; })
      .attr("cy", function(d) { return d._beeswarm_cy; })
      .attr("r", radius)
      .attr("fill", layer.color)
      .attr("fill-opacity", 0);

    pointsEnter.merge(points)
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .attr("cx", function(d) { return d._beeswarm_cx; })
      .attr("cy", function(d) { return d._beeswarm_cy; })
      .attr("r", radius)
      .attr("fill", layer.color)
      .attr("fill-opacity", 0.7);
  }

  getHoverSelector(chart, layer) {
    return ".tag-beeswarm-" + layer.id + " .beeswarm-point";
  }

  formatTooltip(chart, d, layer) {
    var yFormat = chart.runtime.activeYFormat || d3.format("s");
    var yValue = d[layer.mapping.y_var];
    return {
      title: { text: String(d[layer.mapping.x_var]) },
      items: [{ color: layer.color, label: layer.label, value: typeof yValue === "number" ? yFormat(yValue) : String(yValue) }]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-beeswarm-" + layer.id).remove();
  }
}

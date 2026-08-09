import { easingFor, staggerDelay } from "../transitions/easing.js";

export class QuantileDotsRenderer {
  static type = "quantile_dots";
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
    xExtentFields: ["x_var"],
    yExtentFields: ["y_var"],
    domainMerge: "union"
  };
  static dataContract = {
    x_var: { required: true },
    y_var: { required: true, numeric: true },
    quantile_rank: { required: true, numeric: true }
  };

  render(chart, layer) {
    var xScale = chart.derived.xScale;
    var yScale = chart.derived.yScale;
    var radius = (layer.options && layer.options.radius) || 4;
    var padding = (layer.options && layer.options.padding) || 1;
    var diameter = 2 * radius + padding;
    var xVar = layer.mapping.x_var;
    var yVar = layer.mapping.y_var;
    var bandWidth = typeof xScale.bandwidth === "function" ? xScale.bandwidth() : diameter * 4;

    var byGroup = new Map();
    layer.data.forEach(function(d) {
      var key = String(d[xVar]);
      if (!byGroup.has(key)) {
        byGroup.set(key, []);
      }
      byGroup.get(key).push(d);
    });

    byGroup.forEach(function(groupData) {
      var placed = [];
      groupData.sort(function(a, b) {
        return (+a[layer.mapping.quantile_rank]) - (+b[layer.mapping.quantile_rank]);
      });

      groupData.forEach(function(d) {
        var baseX = xScale(d[xVar]);
        var centerX = baseX + (typeof xScale.bandwidth === "function" ? xScale.bandwidth() / 2 : 0);
        var cy = yScale(d[yVar]);
        var cx = centerX;
        var found = false;
        var maxOffset = Math.max(0, bandWidth / 2 - radius);

        for (var attempt = 0; attempt < 500 && !found; attempt++) {
          var offset = attempt === 0 ? 0
            : (attempt % 2 === 1
              ? Math.ceil(attempt / 2) * diameter
              : -Math.ceil(attempt / 2) * diameter);
          var candidateX = centerX + Math.max(-maxOffset, Math.min(maxOffset, offset));
          var collision = false;

          for (var i = 0; i < placed.length; i++) {
            var dx = candidateX - placed[i].cx;
            var dy = cy - placed[i].cy;
            if (dx * dx + dy * dy < diameter * diameter) {
              collision = true;
              break;
            }
          }

          if (!collision || Math.abs(offset) >= maxOffset) {
            cx = candidateX;
            found = true;
          }
        }

        d._quantile_dot_cx = cx;
        d._quantile_dot_cy = cy;
        placed.push({ cx: cx, cy: cy });
      });
    });

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;
    var group = chart.dom.chartArea.selectAll(".tag-quantile_dots-" + layer.id)
      .data([null])
      .join("g")
      .attr("class", "tag-quantile_dots-" + layer.id);

    var points = group.selectAll(".quantile-dots-point")
      .data(layer.data, function(d) { return d._source_key; });

    points.exit()
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .attr("fill-opacity", 0)
      .remove();

    var entered = points.enter().append("circle")
      .attr("class", "quantile-dots-point")
      .attr("clip-path", "url(#" + chart.element.id + "clip)")
      .attr("cx", function(d) { return d._quantile_dot_cx; })
      .attr("cy", function(d) { return d._quantile_dot_cy; })
      .attr("r", radius)
      .attr("fill", layer.color)
      .attr("fill-opacity", 0)
      .attr("role", "graphics-symbol");

    entered.merge(points)
      .transition().ease(easingFor(chart, d3.easeCubic)).duration(transitionSpeed).delay(staggerDelay(chart, 0))
      .attr("cx", function(d) { return d._quantile_dot_cx; })
      .attr("cy", function(d) { return d._quantile_dot_cy; })
      .attr("r", radius)
      .attr("fill", layer.color)
      .attr("fill-opacity", 0.75);
  }

  getHoverSelector(chart, layer) {
    return ".tag-quantile_dots-" + layer.id + " .quantile-dots-point";
  }

  formatTooltip(chart, d, layer) {
    var yFormat = chart.runtime.activeYFormat || d3.format("s");
    var source = layer.options && layer.options.source ? " (" + layer.options.source + ")" : "";
    return {
      title: String(d[layer.mapping.x_var]),
      items: [{
        color: layer.color,
        label: layer.label + source,
        value: "Q" + d[layer.mapping.quantile_rank] + ": " + yFormat(d[layer.mapping.y_var])
      }],
      value: d[layer.mapping.y_var],
      raw: d
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-quantile_dots-" + layer.id).remove();
  }
}

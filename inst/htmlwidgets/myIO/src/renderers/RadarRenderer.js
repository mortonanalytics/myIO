export class RadarRenderer {
  static type = "radar";
  static traits = {
    hasAxes: false,
    referenceLines: false,
    legendType: "ordinal",
    binning: false,
    rolloverStyle: "element",
    scaleCapabilities: {}
  };
  static scaleHints = null;
  static dataContract = {
    axis: { required: true },
    value: { required: true, numeric: true }
  };

  render(chart, layer) {
    var margin = chart.margin || (chart.config && chart.config.layout ? chart.config.layout.margin : { top: 0, right: 0, bottom: 0, left: 0 });
    var width = ((chart.width || (chart.runtime && chart.runtime.width) || 0) - margin.left - margin.right);
    var height = ((chart.height || (chart.runtime && chart.runtime.height) || 0) - margin.top - margin.bottom);
    var axisVar = layer.mapping.axis;
    var valueVar = layer.mapping.value;
    var groupVar = layer.mapping.group;
    var labelOffset = (layer.options && layer.options.labelOffset) || 16;
    var centerX = width / 2;
    var centerY = height / 2;
    var maxRadius = Math.max(0, Math.min(width, height) / 2 - labelOffset - 8);
    var axisOrder = [];
    var axisSeen = new Set();
    var maxValue = d3.max(layer.data, function(d) {
      return +d[valueVar];
    }) || 0;
    var radiusScale = d3.scaleLinear()
      .domain([0, maxValue > 0 ? maxValue : 1])
      .range([0, maxRadius]);
    var groups = [];
    var groupMap = groupVar
      ? d3.group(layer.data, function(d) { return d[groupVar]; })
      : new Map([[layer.label || "Series", layer.data]]);
    var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeCategory10);
    var axisCount;
    var root;
    var axisLayer;
    var polygonLayer;
    var lineGenerator;

    layer.data.forEach(function(d) {
      var axisName = d[axisVar];
      if (!axisSeen.has(axisName)) {
        axisSeen.add(axisName);
        axisOrder.push(axisName);
      }
    });

    axisCount = axisOrder.length;
    if (axisCount === 0) {
      return;
    }

    root = chart.dom.chartArea.selectAll(".tag-radar-" + layer.id)
      .data([null])
      .join("g")
      .attr("class", "tag-radar-" + layer.id);

    axisLayer = root.selectAll(".radar-axis-layer")
      .data([null])
      .join("g")
      .attr("class", "radar-axis-layer");

    polygonLayer = root.selectAll(".radar-polygon-layer")
      .data([null])
      .join("g")
      .attr("class", "radar-polygon-layer");

    axisLayer.selectAll(".radar-axis")
      .data(axisOrder)
      .join(function(enter) {
        var group = enter.append("g").attr("class", "radar-axis");
        group.append("line").attr("class", "radar-axis-line");
        group.append("text").attr("class", "radar-axis-label");
        return group;
      })
      .each(function(axisName, index) {
        var angle = 2 * Math.PI * index / axisCount;
        var lineX = centerX + maxRadius * Math.sin(angle);
        var lineY = centerY - maxRadius * Math.cos(angle);
        var labelX = centerX + (maxRadius + labelOffset) * Math.sin(angle);
        var labelY = centerY - (maxRadius + labelOffset) * Math.cos(angle);
        var textAnchor = "middle";
        if (Math.sin(angle) > 0.25) {
          textAnchor = "start";
        } else if (Math.sin(angle) < -0.25) {
          textAnchor = "end";
        }

        d3.select(this).select(".radar-axis-line")
          .attr("x1", centerX)
          .attr("y1", centerY)
          .attr("x2", lineX)
          .attr("y2", lineY);

        d3.select(this).select(".radar-axis-label")
          .attr("x", labelX)
          .attr("y", labelY)
          .attr("dy", "0.35em")
          .attr("text-anchor", textAnchor)
          .text(axisName);
      });

    groupMap.forEach(function(rows, key) {
      var rowByAxis = new Map();
      var polygonPoints = [];
      rows.forEach(function(d) {
        rowByAxis.set(d[axisVar], d);
      });
      axisOrder.forEach(function(axisName, index) {
        var angle = 2 * Math.PI * index / axisCount;
        var datum = rowByAxis.get(axisName);
        var rawValue = datum ? +datum[valueVar] : 0;
        var scaledRadius = radiusScale(Number.isFinite(rawValue) ? rawValue : 0);
        polygonPoints.push({
          axis: axisName,
          angle: angle,
          value: Number.isFinite(rawValue) ? rawValue : 0,
          x: centerX + scaledRadius * Math.sin(angle),
          y: centerY - scaledRadius * Math.cos(angle),
          datum: datum || null
        });
      });
      groups.push({
        key: key,
        color: colorScale(key),
        points: polygonPoints,
        rows: rows
      });
    });

    chart.derived.colorDiscrete = colorScale.domain(groups.map(function(group) {
      return group.key;
    }));
    chart.colorDiscrete = chart.derived.colorDiscrete;

    lineGenerator = d3.line()
      .x(function(d) { return d.x; })
      .y(function(d) { return d.y; })
      .curve(d3.curveLinearClosed);

    polygonLayer.selectAll(".radar-polygon")
      .data(groups)
      .join("path")
      .attr("class", "radar-polygon")
      .attr("d", function(d) { return lineGenerator(d.points); })
      .attr("fill", function(d) { return d.color; })
      .attr("fill-opacity", 0.2)
      .attr("stroke", function(d) { return d.color; })
      .attr("stroke-width", 2);
  }

  getHoverSelector(chart, layer) {
    return ".tag-radar-" + layer.id + " .radar-polygon";
  }

  formatTooltip(chart, d) {
    return {
      title: { text: String(d.key) },
      items: d.points.map(function(point) {
        return {
          color: d.color,
          label: point.axis,
          value: String(point.value)
        };
      })
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-radar-" + layer.id).remove();
  }
}

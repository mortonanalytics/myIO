export class FunnelRenderer {
  static type = "funnel";
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
    stage: { required: true },
    value: { required: true, numeric: true }
  };

  render(chart, layer) {
    var margin = chart.margin || (chart.config && chart.config.layout ? chart.config.layout.margin : { top: 0, right: 0, bottom: 0, left: 0 });
    var width = ((chart.width || (chart.runtime && chart.runtime.width) || 0) - margin.left - margin.right);
    var height = ((chart.height || (chart.runtime && chart.runtime.height) || 0) - margin.top - margin.bottom);
    var stageVar = layer.mapping.stage;
    var valueVar = layer.mapping.value;
    var stageGap = (layer.options && layer.options.stageGap) || 6;
    var maxValue = d3.max(layer.data, function(d) {
      return +d[valueVar];
    }) || 0;
    var widthScale = d3.scaleLinear()
      .domain([0, maxValue > 0 ? maxValue : 1])
      .range([0, width * 0.95]);
    var colorScale = chart.derived.colorDiscrete || d3.scaleOrdinal(d3.schemeTableau10);
    var stageHeight = layer.data.length > 0 ? height / layer.data.length : 0;
    var stages;
    var root;
    var stageGroups;

    stages = layer.data.map(function(d, index) {
      var nextDatum = layer.data[index + 1] || null;
      var topWidth = widthScale(+d[valueVar] || 0);
      var bottomWidth = nextDatum ? widthScale(+nextDatum[valueVar] || 0) : topWidth * 0.55;
      var y0 = index * stageHeight;
      var y1 = Math.max(y0, y0 + stageHeight - stageGap);
      var centerX = width / 2;
      var topLeft = centerX - topWidth / 2;
      var topRight = centerX + topWidth / 2;
      var bottomLeft = centerX - bottomWidth / 2;
      var bottomRight = centerX + bottomWidth / 2;
      return {
        stage: d[stageVar],
        value: +d[valueVar],
        color: colorScale(d[stageVar]),
        datum: d,
        points: [
          [topLeft, y0],
          [topRight, y0],
          [bottomRight, y1],
          [bottomLeft, y1]
        ],
        labelX: centerX,
        labelY: (y0 + y1) / 2
      };
    });

    chart.derived.colorDiscrete = colorScale.domain(stages.map(function(stage) {
      return stage.stage;
    }));
    chart.colorDiscrete = chart.derived.colorDiscrete;

    var transitionSpeed = (chart.options && chart.options.transition && typeof chart.options.transition.speed === "number")
      ? chart.options.transition.speed
      : 0;

    function pathFor(points) {
      return "M" + points[0][0] + "," + points[0][1] +
        "L" + points[1][0] + "," + points[1][1] +
        "L" + points[2][0] + "," + points[2][1] +
        "L" + points[3][0] + "," + points[3][1] + "Z";
    }

    function collapsedPoints(s) {
      var midX = (s.points[0][0] + s.points[1][0]) / 2;
      var midY = (s.points[0][1] + s.points[3][1]) / 2;
      return [[midX, midY], [midX, midY], [midX, midY], [midX, midY]];
    }

    root = chart.dom.chartArea.selectAll(".tag-funnel-" + layer.id)
      .data([null])
      .join("g")
      .attr("class", "tag-funnel-" + layer.id);

    stageGroups = root.selectAll(".funnel-stage-group")
      .data(stages, function(d) { return d.stage; });

    stageGroups.exit()
      .transition().duration(transitionSpeed)
      .style("opacity", 0)
      .remove();

    var stageEnter = stageGroups.enter().append("g")
      .attr("class", "funnel-stage-group")
      .style("opacity", 0);

    stageEnter.append("path")
      .attr("class", "funnel-stage")
      .attr("d", function(d) { return pathFor(collapsedPoints(d)); })
      .attr("fill", function(d) { return d.color; });

    stageEnter.append("text")
      .attr("class", "funnel-label")
      .attr("x", function(d) { return d.labelX; })
      .attr("y", function(d) { return d.labelY; })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.stage; });

    var stagesMerged = stageEnter.merge(stageGroups);

    stagesMerged
      .transition().duration(transitionSpeed)
      .style("opacity", 1);

    stagesMerged.select(".funnel-stage")
      .transition().duration(transitionSpeed)
      .attr("d", function(d) { return pathFor(d.points); })
      .attr("fill", function(d) { return d.color; });

    stagesMerged.select(".funnel-label")
      .text(function(d) { return d.stage; })
      .transition().duration(transitionSpeed)
      .attr("x", function(d) { return d.labelX; })
      .attr("y", function(d) { return d.labelY; });
  }

  getHoverSelector(chart, layer) {
    return ".tag-funnel-" + layer.id + " .funnel-stage";
  }

  formatTooltip(chart, d) {
    return {
      title: { text: String(d.stage) },
      items: [{ color: d.color, label: String(d.stage), value: String(d.value) }]
    };
  }

  remove(chart, layer) {
    chart.dom.chartArea.selectAll(".tag-funnel-" + layer.id).remove();
  }
}

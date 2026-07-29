import { chartBackgroundColor, readableTextColor } from "../theme/contrast.js";
import { FAB_BAND_BOTTOM, FAB_GUTTER } from "../layout/scaffold.js";
import { textWidth } from "../utils/text-metrics.js";

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
    // Cap the widest stage so it stays clear of the floating action button in the
    // top-right corner (style.css .myIO-fab); the funnel itself stays centred.
    var fabGutter = Math.max(0, FAB_GUTTER - margin.right);
    var maxStageWidth = Math.max(1, Math.min(width * 0.95, width - 2 * fabGutter));
    // The button's rectangle in plot coordinates. The stages were pushed out of
    // this band, but an outside value label is placed against the full plot
    // width, so it can still slide under the button. A label whose text box
    // sits below fabBandBottom may run to the full width; one that does not has
    // to stop at fabLeft. When margin.top >= 48 the band is above the plot
    // entirely, fabBandBottom goes negative and nothing is ever capped.
    var fabLeft = width - fabGutter;
    var fabBandBottom = FAB_BAND_BOTTOM - margin.top;
    var VALUE_HALF_HEIGHT = 8;   // 12px text on a 0.35em dy
    var stageVar = layer.mapping.stage;
    var valueVar = layer.mapping.value;
    var stageGap = (layer.options && layer.options.stageGap) || 6;
    var showValues = !(layer.options && layer.options.showValues === false);
    var valueFormat = d3.format(
      (layer.options && layer.options.valueFormat) ||
      (chart.options && chart.options.yAxisFormat) || ","
    );
    var percentFormat = d3.format((layer.options && layer.options.percentFormat) || ".1%");
    var baseValue = layer.data.length > 0 ? (+layer.data[0][valueVar] || 0) : 0;
    var outsideInk = readableTextColor(chartBackgroundColor(chart));
    var maxValue = d3.max(layer.data, function(d) {
      return +d[valueVar];
    }) || 0;
    var widthScale = d3.scaleLinear()
      .domain([0, maxValue > 0 ? maxValue : 1])
      .range([0, maxStageWidth]);
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
        labelY: (y0 + y1) / 2,
        conversion: baseValue > 0 ? (+d[valueVar] || 0) / baseValue : 0,
        innerWidth: Math.min(topWidth, bottomWidth),
        outsideX: centerX + topWidth / 2 + 6
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

    // Value placement degrades with the height of a stage band:
    //   >= 34px  two lines -- name above the band's centre, value below it
    //   >= 18px  one line  -- name centred, value just outside the right edge
    //   <  18px  name only -- the value stays on the tooltip
    // 18px is the 12px value type's own extent plus enough clearance that two
    // adjacent stages' outside values cannot touch (band 18 => stage pitch 24
    // at the default 6px gap, against ~16.5px of text).
    var TWO_LINE_MIN_BAND = 34;
    var ONE_LINE_MIN_BAND = 18;
    var stageBand = stageHeight - stageGap;
    var valueLayout = !showValues
      ? "none"
      : (stageBand >= TWO_LINE_MIN_BAND ? "two" : (stageBand >= ONE_LINE_MIN_BAND ? "one" : "none"));

    function labelBaseline(s) {
      return valueLayout === "two" ? s.labelY - 9 : s.labelY;
    }

    function valueText(s) {
      return showValues ? valueFormat(s.value) + " (" + percentFormat(s.conversion) + ")" : "";
    }

    // Graceful degradation: inside the trapezoid when it fits, otherwise just
    // outside its right edge, otherwise hidden (tooltip still carries the value).
    function placeValueLabel(selection) {
      selection.each(function(s) {
        var length = textWidth(this, valueText(s));
        // One-line mode leaves the stage name on the centre line, so the value
        // can only go outside the trapezoid.
        var inside = valueLayout === "two" && length <= Math.max(0, s.innerWidth - 8);
        var clearsFab = (s.labelY - VALUE_HALF_HEIGHT) >= fabBandBottom;
        var outsideFits = s.outsideX + length <= (clearsFab ? width : fabLeft);
        var visible = valueLayout !== "none" && (inside || outsideFits);
        d3.select(this)
          .attr("x", inside ? s.labelX : s.outsideX)
          .attr("y", inside ? s.labelY + 9 : s.labelY)
          .attr("text-anchor", inside ? "middle" : "start")
          .attr("fill", inside ? readableTextColor(s.color) : outsideInk)
          .attr("fill-opacity", visible ? 1 : 0);
      });
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
      .attr("y", function(d) { return labelBaseline(d); })
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.stage; });

    stageEnter.append("text")
      .attr("class", "funnel-value")
      .attr("dy", "0.35em")
      .attr("font-size", "12px")
      .attr("pointer-events", "none");

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
      .attr("fill", function(d) { return readableTextColor(d.color); })
      .transition().duration(transitionSpeed)
      .attr("x", function(d) { return d.labelX; })
      .attr("y", function(d) { return labelBaseline(d); });

    stagesMerged.select(".funnel-value")
      .text(function(d) { return valueText(d); })
      .call(placeValueLabel);
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

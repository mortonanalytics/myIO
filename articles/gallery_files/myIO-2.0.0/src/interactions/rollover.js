import { getRendererForLayer } from "../registry.js";
import { createHoverOverlay, hideChartTooltip, removeHoverOverlay, showChartTooltip } from "../tooltip.js";
import { pointRadius, resolveColor, tagName } from "../utils/responsive.js";

const HOVER_TRANSITION_MS = 300;

export function bindRollover(chart, layers) {
  var lys = layers || chart.currentLayers || [];
  var that = chart;
  var exclusions = ["text", "yearMon"];
  var xFormat = exclusions.indexOf(chart.options.xAxisFormat) > -1
    ? function(x) { return x; }
    : d3.format(chart.options.xAxisFormat ? chart.options.xAxisFormat : "d");
  var yFormat = d3.format(chart.options.yAxisFormat ? chart.options.yAxisFormat : "d");
  var currentFormatY = chart.newScaleY ? d3.format(chart.newScaleY) : yFormat;

  removeHoverOverlay(chart);

  lys.forEach(function(layer) {
    if (["bar", "point", "hexbin", "histogram"].indexOf(layer.type) > -1) {
      bindElementLayer(layer);
    }
  });

  if (lys.some(function(layer) { return layer.type === "groupedBar"; })) {
    chart.chart.selectAll(".tag-grouped-bar-g rect")
      .on("mouseout", clearGroupedBar)
      .on("mouseover", showGroupedBar)
      .on("mousemove", showGroupedBar)
      .on("touchstart", function(event) {
        event.preventDefault();
        showGroupedBar.call(this, event);
      })
      .on("touchmove", function(event) {
        event.preventDefault();
        showGroupedBar.call(this, event);
      })
      .on("touchend", clearGroupedBar);
  }

  if (lys.length > 0 && lys.every(function(layer) {
    return ["line", "area"].indexOf(layer.type) > -1;
  })) {
    createHoverOverlay(chart, showOverlayTooltip, clearOverlayTooltip);
  }

  if (lys.some(function(layer) { return layer.type === "donut"; })) {
    bindOrdinalHover(".donut", "donut", function(d, layer) {
      return {
        title: { text: layer.mapping.x_var + ": " + d.data[layer.mapping.x_var] },
        items: [{
          color: chart.colorDiscrete(d.index),
          label: layer.mapping.y_var,
          value: d.data[layer.mapping.y_var]
        }]
      };
    });
  }

  if (lys.some(function(layer) { return layer.type === "treemap"; })) {
    chart.chart.selectAll(".root")
      .on("mouseout", clearTreemap)
      .on("mouseover", showTreemap)
      .on("mousemove", showTreemap)
      .on("touchstart", function(event) {
        event.preventDefault();
        showTreemap.call(this, event);
      })
      .on("touchmove", function(event) {
        event.preventDefault();
        showTreemap.call(this, event);
      })
      .on("touchend", clearTreemap);
  }

  function bindElementLayer(layer) {
    var renderer = getRendererForLayer(layer);
    var selector = renderer.getHoverSelector ? renderer.getHoverSelector(chart, layer) : "." + tagName(layer.type, chart.element.id, layer.label);

    chart.chart.selectAll(selector)
      .on("mouseout", function() {
        clearElementHover.call(this, layer);
      })
      .on("mouseover", function(event) {
        showElementHover.call(this, event, layer);
      })
      .on("mousemove", function(event) {
        showElementHover.call(this, event, layer);
      })
      .on("touchstart", function(event) {
        event.preventDefault();
        showElementHover.call(this, event, layer);
      })
      .on("touchmove", function(event) {
        event.preventDefault();
        showElementHover.call(this, event, layer);
      })
      .on("touchend", function() {
        clearElementHover.call(this, layer);
      });
  }

  function showElementHover(event, layer) {
    var data = d3.select(this).data()[0];
    var renderer = getRendererForLayer(layer);
    var tooltip = buildTooltip(layer, renderer, data, this);

    if (HTMLWidgets.shinyMode) {
      Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data));
    }

    applyElementHighlight(this, layer, data);
    showChartTooltip(that, {
      pointer: getContainerPointer(event),
      title: tooltip.title,
      items: tooltip.items
    });
  }

  function clearElementHover(layer) {
    removeElementHighlight(this, layer);
    hideChartTooltip(that);
  }

  function buildTooltip(layer, renderer, data, node) {
    if (layer.type === "hexbin") {
      var pointFormat = d3.format(",.2f");
      return {
        title: { text: "x: " + pointFormat(that.xScale.invert(data.x)) + ", y: " + pointFormat(that.yScale.invert(data.y)) },
        items: [{ color: d3.select(node).attr("fill"), label: "Count", value: data.length }]
      };
    }

    if (layer.type === "histogram") {
      return {
        title: { text: "Bin: " + data.x0 + " to " + data.x1 },
        items: [{ color: d3.select(node).attr("fill"), label: "Count", value: data.length }]
      };
    }

    var titleText = layer.mapping.x_var + ": " + xFormat(data[layer.mapping.x_var]);
    var yKey = that.newY ? that.newY : layer.mapping.y_var;
    var label = layer.type === "point" || layer.type === "bar" ? layer.mapping.y_var : layer.label;
    var color = resolveColor(that, layer.label, layer.color);

    if (renderer && typeof renderer.formatTooltip === "function") {
      var formatted = renderer.formatTooltip(that, data, layer);
      titleText = formatted.title || titleText;
      label = formatted.label || label;
      color = formatted.color || color;
    }

    return {
      title: { text: titleText },
      items: [{ color: color, label: label, value: currentFormatY(data[yKey]) }]
    };
  }

  function applyElementHighlight(node, layer) {
    var selection = d3.select(node);
    var color = layer.type === "hexbin" ? "#333" : selection.attr("fill") || selection.style("fill") || resolveColor(that, layer.label, layer.color);

    if (layer.type === "hexbin") {
      selection.style("stroke", color).style("stroke-width", "2px");
      return;
    }

    selection
      .interrupt()
      .style("stroke", color)
      .style("stroke-width", "2px")
      .style("stroke-opacity", 0.8);

    if (layer.type === "point") {
      selection.attr("r", Math.max(+selection.attr("r") || 0, 6));
    }
  }

  function removeElementHighlight(node, layer) {
    var selection = d3.select(node);
    selection.interrupt().transition().duration(HOVER_TRANSITION_MS)
      .style("stroke-width", "0px")
      .style("stroke", "transparent")
      .style("stroke-opacity", null);

    if (layer.type === "point") {
      selection.transition().duration(HOVER_TRANSITION_MS).attr("r", pointRadius(that));
    }
  }

  function showGroupedBar(event) {
    var data = d3.select(this).data()[0];
    var thisLayer = lys[data.idx];
    var color = resolveColor(that, thisLayer.label, thisLayer.color);

    if (HTMLWidgets.shinyMode) {
      Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(data.data.values));
    }

    d3.select(this)
      .interrupt()
      .style("stroke", color)
      .style("stroke-width", "2px")
      .style("stroke-opacity", 0.8);

    showChartTooltip(that, {
      pointer: getContainerPointer(event),
      title: { text: thisLayer.mapping.x_var + ": " + xFormat(data.data[0]) },
      items: [{ color: color, label: thisLayer.mapping.y_var, value: currentFormatY(data[1] - data[0]) }]
    });
  }

  function clearGroupedBar() {
    d3.select(this).interrupt().transition().duration(HOVER_TRANSITION_MS)
      .style("stroke-width", "0px")
      .style("stroke", "transparent")
      .style("stroke-opacity", null);
    hideChartTooltip(that);
  }

  function showOverlayTooltip(event) {
    var mouse = d3.pointer(event, this);
    var xPos = that.xScale.invert(mouse[0]);
    var tipText = [];
    var bisect = d3.bisector(function(d) { return +d[0]; }).left;

    lys.forEach(function(layer) {
      var values = layer.data;
      var xVar = layer.mapping.x_var;
      var yVar = that.newY ? that.newY : (layer.mapping.y_var || layer.mapping.high_y);
      var layerIndex = values.map(function(value) { return value[xVar]; });
      var idx = bisect(layerIndex, xPos);
      var d0 = values[idx - 1];
      var d1 = values[idx];
      var v = !d0 ? d1 : !d1 ? d0 : xPos - d0[xVar] > d1[xVar] - xPos ? d1 : d0;

      if (!v) {
        return;
      }

      tipText.push({
        color: layer.color,
        label: layer.label,
        xVar: xVar,
        yVar: yVar,
        displayValue: v.density != null ? v.density : v[yVar],
        value: v
      });
    });

    if (tipText.length === 0) {
      clearOverlayTooltip();
      return;
    }

    if (HTMLWidgets.shinyMode) {
      Shiny.onInputChange("myIO-" + that.element.id + "-rollover", JSON.stringify(tipText.map(function(d) {
        return d.value;
      })));
    }

    var xValue = tipText[0].value[tipText[0].xVar];
    that.toolLine
      .style("stroke", "var(--chart-ref-line-color)")
      .style("stroke-width", "1px")
      .style("stroke-dasharray", "4,4")
      .attr("x1", that.xScale(xValue))
      .attr("x2", that.xScale(xValue))
      .attr("y1", 0)
      .attr("y2", that.height - (that.margin.top + that.margin.bottom));

    var points = that.toolPointLayer.selectAll("circle").data(tipText);
    points.exit().remove();
    points.enter().append("circle")
      .attr("r", 4)
      .merge(points)
      .attr("cx", function(d) { return that.xScale(d.value[d.xVar]); })
      .attr("cy", function(d) { return that.yScale(d.value[d.yVar]); })
      .attr("fill", "#ffffff")
      .attr("stroke", function(d) { return d.color; })
      .attr("stroke-width", 2);

    showChartTooltip(that, {
      pointer: getContainerPointer(event),
      title: { text: tipText[0].xVar + ": " + xFormat(xValue) },
      items: tipText.map(function(d) {
        return { color: d.color, label: d.label, value: currentFormatY(d.displayValue) };
      })
    });
  }

  function clearOverlayTooltip() {
    if (that.toolLine) {
      that.toolLine.style("stroke", "none");
    }
    if (that.toolPointLayer) {
      that.toolPointLayer.selectAll("*").remove();
    }
    hideChartTooltip(that);
  }

  function bindOrdinalHover(selector, layerType, tooltipBuilder) {
    var layer = lys.filter(function(candidate) {
      return candidate.type === layerType;
    })[0];
    chart.chart.selectAll(selector)
      .on("mouseout", function() {
        chart.chart.selectAll(selector).transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
        hideChartTooltip(that);
      })
      .on("mouseover", function(event, d) {
        chart.chart.selectAll(selector).style("opacity", 0.4);
        d3.select(this).style("opacity", 0.85);
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      })
      .on("mousemove", function(event, d) {
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      })
      .on("touchstart", function(event, d) {
        event.preventDefault();
        chart.chart.selectAll(selector).style("opacity", 0.4);
        d3.select(this).style("opacity", 0.85);
        var tooltip = tooltipBuilder(d, layer);
        showChartTooltip(that, { pointer: getContainerPointer(event), title: tooltip.title, items: tooltip.items });
      })
      .on("touchend", function() {
        chart.chart.selectAll(selector).transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
        hideChartTooltip(that);
      });
  }

  function showTreemap(event, d) {
    var layer = lys.filter(function(candidate) {
      return candidate.type === "treemap";
    })[0];
    var colorNode = d;
    while (colorNode.depth > 1) {
      colorNode = colorNode.parent;
    }
    chart.chart.selectAll(".root").style("opacity", 0.4);
    d3.select(this).style("opacity", 0.85);
    showChartTooltip(that, {
      pointer: getContainerPointer(event),
      title: { text: layer.mapping.level_1 + ": " + d.data[layer.mapping.level_1] },
      items: [{
        color: chart.colorDiscrete(colorNode.data.id),
        label: d.data[layer.mapping.level_2],
        value: d.value
      }]
    });
  }

  function clearTreemap() {
    chart.chart.selectAll(".root").transition().duration(HOVER_TRANSITION_MS).style("opacity", 1);
    hideChartTooltip(that);
  }

  function getContainerPointer(event) {
    return d3.pointer(event, that.dom.element);
  }
}

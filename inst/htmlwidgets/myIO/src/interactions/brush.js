import { showStatusBar, removeStatusBar } from "./status-bar.js";
import { tagName } from "../utils/responsive.js";

var BRUSHABLE_TYPES = ["point", "bar", "histogram", "hexbin", "groupedBar"];

export function bindBrush(chart) {
  var cfg = chart.config.interactions.brush;
  if (!cfg || !cfg.enabled) return;

  var brushableLayers = (chart.derived.currentLayers || []).filter(function(l) {
    return BRUSHABLE_TYPES.indexOf(l.type) > -1;
  });
  if (brushableLayers.length === 0) return;

  removeBrush(chart);

  var brushFn = cfg.direction === "x" ? d3.brushX()
    : cfg.direction === "y" ? d3.brushY()
    : d3.brush();

  var margin = chart.config.layout.margin;
  var chartWidth = chart.runtime.width - (margin.left + margin.right);
  var chartHeight = chart.runtime.height - (margin.top + margin.bottom);

  brushFn.extent([[0, 0], [chartWidth, chartHeight]]);

  brushFn
    .on("brush", function(event) { onBrush(chart, event, brushableLayers, cfg); })
    .on("end", function(event) { onBrushEnd(chart, event, brushableLayers, cfg); });

  // Insert brush BELOW data elements so clicks on points reach annotation/drag handlers
  chart.dom.chartArea.insert("g", ":first-child")
    .attr("class", "myIO-brush")
    .call(brushFn);

  chart.dom.chartArea.select(".myIO-brush .overlay")
    .style("cursor", "crosshair");

  chart.runtime._brushFn = brushFn;

  d3.select(chart.dom.element).on("keydown.brush", function(event) {
    if (event.key === "Escape" && chart.runtime._brushed) {
      clearBrush(chart);
    }
  });
}

function onBrush(chart, event, layers, cfg) {
  if (!event.selection) return;
  var sel = event.selection;
  var dir = cfg.direction;

  layers.forEach(function(layer) {
    var selector = getLayerSelector(chart, layer);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      var inside = isInsideBrush(chart, d, layer, sel, dir);
      d3.select(this)
        .style("opacity", inside ? 1.0 : "var(--chart-brush-dim-opacity)");
    });
  });
}

function onBrushEnd(chart, event, layers, cfg) {
  if (!event.selection) {
    clearBrush(chart);
    return;
  }
  var sel = event.selection;
  var dir = cfg.direction;
  var extent = invertExtent(chart, sel, dir);
  var selected = [];
  var keys = [];

  layers.forEach(function(layer) {
    layer.data.forEach(function(d) {
      if (isInsideBrush(chart, d, layer, sel, dir)) {
        selected.push(d);
        if (d._source_key) keys.push(d._source_key);
      }
    });
  });

  chart.runtime._brushed = { data: selected, extent: extent, keys: keys };

  var totalPoints = layers.reduce(function(sum, l) { return sum + l.data.length; }, 0);
  showStatusBar(chart,
    selected.length + " of " + totalPoints + " points selected",
    [{ label: "Clear", handler: function() { clearBrush(chart); } }]
  );

  chart.emit("brushed", {
    data: selected,
    extent: extent,
    keys: keys,
    layerLabel: layers.length === 1 ? layers[0].label : null
  });
}

function clearBrush(chart) {
  // Moving the brush to null re-dispatches d3's "end" event with no selection,
  // which lands back here through onBrushEnd. Without this guard that recursion
  // overflows the stack and the unwind skips the reset and the "brushed" emit
  // below, leaving linked target charts dimmed forever.
  if (chart.runtime._brushClearing) return;
  chart.runtime._brushClearing = true;

  try {
    (chart.derived.currentLayers || []).forEach(function(layer) {
      if (BRUSHABLE_TYPES.indexOf(layer.type) > -1) {
        var selector = getLayerSelector(chart, layer);
        chart.dom.chartArea.selectAll(selector)
          .style("opacity", 1.0);
      }
    });
    if (chart.runtime._brushFn) {
      chart.dom.chartArea.select(".myIO-brush").call(chart.runtime._brushFn.move, null);
    }
    chart.runtime._brushed = null;
    removeStatusBar(chart);
    chart.emit("brushed", { data: [], extent: null, keys: [], layerLabel: null });
  } finally {
    chart.runtime._brushClearing = false;
  }
}

function isInsideBrush(chart, d, layer, sel, dir) {
  var xVar = layer.mapping.x_var;
  var yVar = layer.mapping.y_var;
  var px = chart.xScale(d[xVar]);
  var py = chart.yScale(d[yVar]);

  if (isNaN(px) || isNaN(py)) return false;

  if (dir === "x") return px >= sel[0] && px <= sel[1];
  if (dir === "y") return py >= sel[0] && py <= sel[1];
  return px >= sel[0][0] && px <= sel[1][0] && py >= sel[0][1] && py <= sel[1][1];
}

function safeInvert(scale, v0, v1) {
  if (typeof scale.invert === "function") {
    return [scale.invert(v0), scale.invert(v1)];
  }
  return null;
}

function invertExtent(chart, sel, dir) {
  if (dir === "x") {
    return {
      x: safeInvert(chart.xScale, sel[0], sel[1]),
      y: null
    };
  }
  if (dir === "y") {
    return {
      x: null,
      y: safeInvert(chart.yScale, sel[1], sel[0])
    };
  }
  return {
    x: safeInvert(chart.xScale, sel[0][0], sel[1][0]),
    y: safeInvert(chart.yScale, sel[1][1], sel[0][1])
  };
}

function getLayerSelector(chart, layer) {
  if (layer.type === "groupedBar") return ".tag-grouped-bar-g rect";
  return "." + tagName(layer.type, chart.dom.element.id, layer.label);
}

export function removeBrush(chart) {
  if (chart.dom && chart.dom.chartArea) {
    chart.dom.chartArea.selectAll(".myIO-brush").remove();
  }
  if (chart.dom && chart.dom.element) {
    d3.select(chart.dom.element).on("keydown.brush", null);
  }
  chart.runtime._brushed = null;
}

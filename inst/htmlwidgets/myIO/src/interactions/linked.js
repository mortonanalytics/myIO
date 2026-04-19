import { tagName } from "../utils/responsive.js";
import { unregisterLinkedCursor } from "./linked-cursor.js";

var LINKABLE_TYPES = [
  "point",
  "bar",
  "histogram",
  "hexbin",
  "groupedBar",
  "waffle",
  "beeswarm",
  "lollipop",
  "dumbbell"
];

export function bindLinked(chart) {
  var cfg = chart.config.interactions.linked;
  if (!cfg || !cfg.enabled) return;
  if (typeof crosstalk === "undefined") return;

  cleanupLinked(chart);

  var sel = new crosstalk.SelectionHandle(cfg.group);
  var fil = cfg.filter ? new crosstalk.FilterHandle(cfg.group) : null;

  chart.runtime._crosstalkSel = sel;
  chart.runtime._crosstalkFil = fil;

  // OUTBOUND — store handler ref for cleanup (EventEmitter has no namespace support)
  if (cfg.mode === "source" || cfg.mode === "both") {
    chart.runtime._linkedBrushHandler = function(e) {
      if (e.keys && e.keys.length > 0) {
        sel.set(e.keys);
      } else {
        sel.clear();
      }
    };
    chart.on("brushed", chart.runtime._linkedBrushHandler);
  }

  // INBOUND
  if (cfg.mode === "target" || cfg.mode === "both") {
    sel.on("change.myIO", function(e) {
      applySelection(chart, e.value);
    });

    if (fil) {
      fil.on("change.myIO", function(e) {
        applyFilter(chart, e.value);
      });
    }
  }
}

function applySelection(chart, selectedKeys) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!selectedKeys) {
        d3.select(this).style("opacity", 1.0);
      } else {
        var inside = selectedKeys.indexOf(d._source_key) > -1;
        d3.select(this).style("opacity", inside ? 1.0 : "var(--chart-brush-dim-opacity)");
      }
    });
  });
}

function applyFilter(chart, filteredKeys) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!filteredKeys) {
        d3.select(this).style("display", null);
      } else {
        var visible = filteredKeys.indexOf(d._source_key) > -1;
        d3.select(this).style("display", visible ? null : "none");
      }
    });
  });
}

export function cleanupLinked(chart) {
  if (chart.runtime._linkedBrushHandler) {
    chart.off("brushed", chart.runtime._linkedBrushHandler);
    chart.runtime._linkedBrushHandler = null;
  }
  if (chart.runtime._crosstalkSel) {
    chart.runtime._crosstalkSel.close();
    chart.runtime._crosstalkSel = null;
  }
  if (chart.runtime._crosstalkFil) {
    chart.runtime._crosstalkFil.close();
    chart.runtime._crosstalkFil = null;
  }
  unregisterLinkedCursor(chart);
}

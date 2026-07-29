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

// linkCharts() (R/linkCharts.R) serialized mode "bidirectional" through v1.3.0;
// setLinked() uses "both". They mean the same thing, so accept either. Kept in
// JS as well as normalised in R so widgets already serialized with the old
// token keep working against a newer bundle.
function normalizeMode(mode) {
  return mode === "bidirectional" ? "both" : mode;
}

// Crosstalk-free selection bus. linkCharts() coordinates widgets by a shared
// group id and ships no crosstalk dependency, so a static R Markdown / Quarto
// page needs an in-page place for selections to meet. Implements only the
// slice of crosstalk.SelectionHandle that bindLinked() uses, with crosstalk's
// dispatch semantics (the sender is notified too).
var _localGroups = new Map();

function LocalSelectionHandle(group) {
  this._group = group;
  this._onChange = null;
  var members = _localGroups.get(group);
  if (!members) { members = new Set(); _localGroups.set(group, members); }
  members.add(this);
}
LocalSelectionHandle.prototype.on = function(type, fn) {
  if (type === "change") this._onChange = fn;
};
LocalSelectionHandle.prototype.set = function(keys) { this._broadcast(keys); };
LocalSelectionHandle.prototype.clear = function() { this._broadcast(null); };
LocalSelectionHandle.prototype.close = function() {
  var members = _localGroups.get(this._group);
  this._onChange = null;
  if (!members) return;
  members.delete(this);
  if (members.size === 0) _localGroups.delete(this._group);
};
LocalSelectionHandle.prototype._broadcast = function(keys) {
  var self = this;
  var members = _localGroups.get(this._group);
  if (!members) return;
  members.forEach(function(handle) {
    if (handle._onChange) handle._onChange({ value: keys, sender: self });
  });
};

// linkCharts(on = "col") matches rows across charts by a shared data column.
// setLinked() has no keyColumn and keeps matching on the per-widget row key,
// which R/util.R ensure_source_key() fills positionally and which is therefore
// only meaningful when both charts were built from the same rows.
function linkKeys(cfg, e) {
  if (!cfg || !cfg.keyColumn) return e.keys || [];
  var keys = [];
  (e.data || []).forEach(function(d) {
    var value = d[cfg.keyColumn];
    if (value === undefined || value === null) return;
    value = String(value);
    if (keys.indexOf(value) === -1) keys.push(value);
  });
  return keys;
}

function matchKey(cfg, d) {
  return (cfg && cfg.keyColumn) ? String(d[cfg.keyColumn]) : d._source_key;
}

export function bindLinked(chart) {
  var cfg = chart.config.interactions.linked;
  if (!cfg || !cfg.enabled) return;

  var hasCrosstalk = typeof crosstalk !== "undefined";
  // linkCharts() attaches no crosstalk dependency, so fall back to the in-page
  // group bus rather than binding nothing. A group id is required either way.
  if (!hasCrosstalk && !cfg.group) return;

  var mode = normalizeMode(cfg.mode);

  cleanupLinked(chart);

  var sel = hasCrosstalk
    ? new crosstalk.SelectionHandle(cfg.group)
    : new LocalSelectionHandle(cfg.group);
  var fil = (hasCrosstalk && cfg.filter) ? new crosstalk.FilterHandle(cfg.group) : null;

  chart.runtime._crosstalkSel = sel;
  chart.runtime._crosstalkFil = fil;

  // OUTBOUND — store handler ref for cleanup (EventEmitter has no namespace support)
  if (mode === "source" || mode === "both") {
    chart.runtime._linkedBrushHandler = function(e) {
      var keys = linkKeys(cfg, e);
      if (keys && keys.length > 0) {
        sel.set(keys);
      } else {
        sel.clear();
      }
    };
    chart.on("brushed", chart.runtime._linkedBrushHandler);
  }

  // INBOUND — Crosstalk's Events emitter keys subscriptions by the exact event
  // type string (no jQuery-style namespaces), and only ever triggers "change",
  // so a namespaced type would never be dispatched. Cleanup is handled by
  // handle.close(), which removes all listeners.
  if (mode === "target" || mode === "both") {
    sel.on("change", function(e) {
      applySelection(chart, e.value, cfg);
    });

    if (fil) {
      fil.on("change", function(e) {
        applyFilter(chart, e.value, cfg);
      });
    }
  }
}

function applySelection(chart, selectedKeys, cfg) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!selectedKeys) {
        d3.select(this).style("opacity", 1.0);
      } else {
        var inside = selectedKeys.indexOf(matchKey(cfg, d)) > -1;
        d3.select(this).style("opacity", inside ? 1.0 : "var(--chart-brush-dim-opacity)");
      }
    });
  });
}

function applyFilter(chart, filteredKeys, cfg) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!filteredKeys) {
        d3.select(this).style("display", null);
      } else {
        var visible = filteredKeys.indexOf(matchKey(cfg, d)) > -1;
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

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
// setLinked() has no keyColumn: it matches on the per-widget row key, which
// R/util.R ensure_source_key() fills positionally as "row_<i>". Crosstalk's own
// key space is whatever SharedData$key() returned (row names, an id column, ...),
// and R/setLinked.R ships it as cfg.key in the row order of the data frame handed
// to addIoLayer(). buildKeyMap() turns that parallel vector into a
// row_<i> -> real-key lookup so a myIO chart puts crosstalk's keys on the wire
// instead of its private positional ones -- without which a sibling DT / plotly /
// leaflet in the same group matches nothing.
function buildKeyMap(chart, cfg) {
  if (!cfg || cfg.keyColumn) return null;
  var keys = cfg.key;
  if (!Array.isArray(keys) || keys.length === 0) return null;
  var layers = (chart.config.layers || chart.derived.currentLayers || [])
    .filter(function(l) { return LINKABLE_TYPES.indexOf(l.type) > -1; });
  if (layers.length === 0) return null;
  // cfg.key indexes the SharedData rows. A linkable layer with a different row
  // count was built from other rows (a filtered frame, a transform output), so
  // its row_<i> ids do not index cfg.key and translating them would silently
  // mislabel marks. One such layer disables translation for the whole chart and
  // the row_<i> space stays in use, exactly as before this change.
  for (var i = 0; i < layers.length; i++) {
    if (!Array.isArray(layers[i].data) || layers[i].data.length !== keys.length) {
      return null;
    }
  }
  var map = Object.create(null);
  layers.forEach(function(layer) {
    layer.data.forEach(function(d, i) {
      if (d && d._source_key != null) map[d._source_key] = String(keys[i]);
    });
  });
  return map;
}

function linkKeys(cfg, e, keyMap) {
  if (cfg && cfg.keyColumn) {
    var cols = [];
    (e.data || []).forEach(function(d) {
      var value = d[cfg.keyColumn];
      if (value === undefined || value === null) return;
      value = String(value);
      if (cols.indexOf(value) === -1) cols.push(value);
    });
    return cols;
  }
  var raw = e.keys || [];
  if (!keyMap) return raw;
  var out = [];
  raw.forEach(function(k) {
    var mapped = keyMap[k] !== undefined ? keyMap[k] : k;
    if (out.indexOf(mapped) === -1) out.push(mapped);
  });
  return out;
}

function matchKey(cfg, d, keyMap) {
  if (cfg && cfg.keyColumn) return String(d[cfg.keyColumn]);
  var sk = d._source_key;
  if (keyMap && sk != null && keyMap[sk] !== undefined) return keyMap[sk];
  return sk;
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

  var keyMap = buildKeyMap(chart, cfg);
  chart.runtime._linkedKeyMap = keyMap;

  var sel = hasCrosstalk
    ? new crosstalk.SelectionHandle(cfg.group)
    : new LocalSelectionHandle(cfg.group);
  var fil = (hasCrosstalk && cfg.filter) ? new crosstalk.FilterHandle(cfg.group) : null;

  chart.runtime._crosstalkSel = sel;
  chart.runtime._crosstalkFil = fil;

  // OUTBOUND — store handler ref for cleanup (EventEmitter has no namespace support)
  if (mode === "source" || mode === "both") {
    chart.runtime._linkedBrushHandler = function(e) {
      var keys = linkKeys(cfg, e, keyMap);
      if (keys && keys.length > 0) {
        sel.set(keys);
      } else if (e && e.active === true) {
        // A brush over empty space IS a selection -- of nothing. Sending clear()
        // here made the target restore full opacity while the source stayed
        // dimmed from onBrush(), so two linked charts disagreed about the same
        // state. Broadcasting an empty key array keeps them in step:
        // applySelection() already dims every mark for a present-but-empty
        // array. Only an actually-removed brush (clearBrush -> active:false)
        // clears, which is the path 34eb990/85bfb4b restored.
        sel.set([]);
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
      applySelection(chart, e.value, cfg, keyMap);
    });

    if (fil) {
      fil.on("change", function(e) {
        applyFilter(chart, e.value, cfg, keyMap);
      });
    }
  }
}

function applySelection(chart, selectedKeys, cfg, keyMap) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!selectedKeys) {
        d3.select(this).style("opacity", 1.0);
      } else {
        var inside = selectedKeys.indexOf(matchKey(cfg, d, keyMap)) > -1;
        d3.select(this).style("opacity", inside ? 1.0 : "var(--chart-brush-dim-opacity)");
      }
    });
  });
}

function applyFilter(chart, filteredKeys, cfg, keyMap) {
  var layers = (chart.derived.currentLayers || []).filter(function(l) {
    return LINKABLE_TYPES.indexOf(l.type) > -1;
  });

  layers.forEach(function(layer) {
    var selector = "." + tagName(layer.type, chart.dom.element.id, layer.label);
    chart.dom.chartArea.selectAll(selector).each(function(d) {
      if (!filteredKeys) {
        d3.select(this).style("display", null);
      } else {
        var visible = filteredKeys.indexOf(matchKey(cfg, d, keyMap)) > -1;
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
  chart.runtime._linkedKeyMap = null;
  unregisterLinkedCursor(chart);
}

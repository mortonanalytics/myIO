import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { bindLinked } from "../../inst/htmlwidgets/myIO/src/interactions/linked.js";

// Mirrors crosstalk's Events class (crosstalk.js Events#on/#trigger): listeners
// are stored under the exact event-type string, and dispatch only ever uses
// "change". A namespaced subscription is therefore never invoked.
function makeCrosstalk() {
  var groups = {};
  function SelectionHandle(group) {
    this._group = group;
    this._types = {};
    groups[group] = groups[group] || [];
    groups[group].push(this);
  }
  SelectionHandle.prototype.on = function(type, fn) {
    (this._types[type] = this._types[type] || []).push(fn);
  };
  SelectionHandle.prototype.set = function(keys) {
    var self = this;
    groups[this._group].forEach(function(h) {
      (h._types["change"] || []).forEach(function(fn) {
        fn({ value: keys, sender: self });
      });
    });
  };
  SelectionHandle.prototype.clear = function() { this.set(undefined); };
  SelectionHandle.prototype.close = function() { this._types = {}; };
  return { SelectionHandle: SelectionHandle, FilterHandle: SelectionHandle };
}

function makeChart(id, mode, nodes) {
  var handlers = {};
  return {
    config: { interactions: { linked: { enabled: true, group: "g1", mode: mode } } },
    derived: {
      currentLayers: [{
        type: "point",
        label: "pts",
        data: nodes.map(function(n) { return { _source_key: n.key }; })
      }]
    },
    dom: {
      element: { id: id },
      chartArea: {
        selectAll: function() {
          return {
            each: function(fn) {
              nodes.forEach(function(n) { fn.call(n, { _source_key: n.key }); });
            }
          };
        }
      }
    },
    runtime: {},
    on: function(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    off: function(evt, fn) {
      handlers[evt] = (handlers[evt] || []).filter(function(h) { return h !== fn; });
    },
    emit: function(evt, payload) {
      (handlers[evt] || []).forEach(function(fn) { fn(payload); });
    }
  };
}

describe("linked brushing propagation", function() {
  beforeEach(function() {
    globalThis.crosstalk = makeCrosstalk();
    globalThis.d3 = {
      select: function(node) {
        return {
          style: function(k, v) {
            node.style = node.style || {};
            node.style[k] = v;
            return this;
          }
        };
      }
    };
  });

  afterEach(function() {
    delete globalThis.crosstalk;
    delete globalThis.d3;
  });

  it("subscribes to crosstalk's un-namespaced change event", function() {
    var tgt = makeChart("B", "target", [{ key: "row_1" }]);
    bindLinked(tgt);
    expect(Object.keys(tgt.runtime._crosstalkSel._types)).toEqual(["change"]);
  });

  it("a source chart's brush dims non-selected points on the target chart", function() {
    var srcNodes = [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }];
    var tgtNodes = [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }];
    var src = makeChart("A", "source", srcNodes);
    var tgt = makeChart("B", "target", tgtNodes);
    bindLinked(src);
    bindLinked(tgt);

    src.emit("brushed", { keys: ["row_1", "row_3"] });

    expect(tgtNodes.map(function(n) { return (n.style || {}).opacity; }))
      .toEqual([1.0, "var(--chart-brush-dim-opacity)", 1.0]);
  });

  it("clearing the source brush restores full opacity on the target chart", function() {
    var tgtNodes = [{ key: "row_1" }, { key: "row_2" }];
    var src = makeChart("A", "source", [{ key: "row_1" }, { key: "row_2" }]);
    var tgt = makeChart("B", "target", tgtNodes);
    bindLinked(src);
    bindLinked(tgt);

    src.emit("brushed", { keys: ["row_1"] });
    expect(tgtNodes[1].style.opacity).toBe("var(--chart-brush-dim-opacity)");

    src.emit("brushed", { keys: [] });
    expect(tgtNodes.map(function(n) { return n.style.opacity; })).toEqual([1.0, 1.0]);
  });

  it("accepts the legacy \"bidirectional\" mode written by linkCharts()", function() {
    var tgtNodes = [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }];
    var src = makeChart("A", "bidirectional", [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }]);
    var tgt = makeChart("B", "bidirectional", tgtNodes);
    bindLinked(src);
    bindLinked(tgt);

    expect(src.runtime._linkedBrushHandler).toBeTruthy();

    src.emit("brushed", { keys: ["row_1", "row_3"] });

    expect(tgtNodes.map(function(n) { return (n.style || {}).opacity; }))
      .toEqual([1.0, "var(--chart-brush-dim-opacity)", 1.0]);
  });

  it("matches rows by keyColumn when linkCharts() supplied one", function() {
    function makeKeyedChart(id, rows) {
      var handlers = {};
      return {
        // A stale/wrong-length cfg.key must not displace keyColumn: linkCharts()
        // matching wins over the setLinked() crosstalk key space.
        config: { interactions: { linked: { enabled: true, group: "gk", mode: "bidirectional", keyColumn: "cyl", key: ["a", "b", "c", "d", "e"] } } },
        derived: { currentLayers: [{ type: "point", label: "pts", data: rows }] },
        dom: {
          element: { id: id },
          chartArea: { selectAll: function() { return { each: function(fn) { rows.forEach(function(r) { fn.call(r, r); }); } }; } }
        },
        runtime: {},
        on: function(e, f) { (handlers[e] = handlers[e] || []).push(f); },
        off: function(e, f) { handlers[e] = (handlers[e] || []).filter(function(h) { return h !== f; }); },
        emit: function(e, p) { (handlers[e] || []).forEach(function(f) { f(p); }); }
      };
    }

    var tgtRows = [{ _source_key: "row_1", cyl: 4 }, { _source_key: "row_2", cyl: 6 }, { _source_key: "row_3", cyl: 8 }];
    var src = makeKeyedChart("A", [{ _source_key: "row_9", cyl: 4 }, { _source_key: "row_10", cyl: 8 }]);
    var tgt = makeKeyedChart("B", tgtRows);
    bindLinked(src);
    bindLinked(tgt);

    // brush.js emits both keys (positional) and data (full rows); with keyColumn
    // set, only the cyl values must travel - the row_9/row_10 keys match nothing.
    src.emit("brushed", { keys: ["row_9", "row_10"], data: [{ _source_key: "row_9", cyl: 4 }, { _source_key: "row_10", cyl: 8 }] });

    expect(tgtRows.map(function(r) { return (r.style || {}).opacity; }))
      .toEqual([1.0, "var(--chart-brush-dim-opacity)", 1.0]);
  });
});

describe("linked brushing without crosstalk", function() {
  beforeEach(function() {
    delete globalThis.crosstalk;
    globalThis.d3 = {
      select: function(node) {
        return {
          style: function(k, v) { node.style = node.style || {}; node.style[k] = v; return this; }
        };
      }
    };
  });
  afterEach(function() { delete globalThis.d3; });

  it("propagates through the in-page group bus when crosstalk is absent", function() {
    var tgtNodes = [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }];
    var src = makeChart("A", "bidirectional", [{ key: "row_1" }, { key: "row_2" }, { key: "row_3" }]);
    var tgt = makeChart("B", "bidirectional", tgtNodes);
    bindLinked(src);
    bindLinked(tgt);

    src.emit("brushed", { keys: ["row_1", "row_3"] });

    expect(tgtNodes.map(function(n) { return (n.style || {}).opacity; }))
      .toEqual([1.0, "var(--chart-brush-dim-opacity)", 1.0]);
  });
});

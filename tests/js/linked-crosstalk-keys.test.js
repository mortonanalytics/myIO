import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { bindLinked } from "../../inst/htmlwidgets/myIO/src/interactions/linked.js";

// Mirrors crosstalk's Events class: listeners are stored under the exact event
// type string and dispatch only ever uses "change", so every handle registered
// in the group -- including a third-party spy -- hears every set().
function makeCrosstalk() {
  var groups = {};
  function SelectionHandle(group) {
    this._group = group;
    this._types = {};
    this.received = [];
    groups[group] = groups[group] || [];
    groups[group].push(this);
  }
  SelectionHandle.prototype.on = function(type, fn) {
    (this._types[type] = this._types[type] || []).push(fn);
  };
  SelectionHandle.prototype.set = function(keys) {
    var self = this;
    groups[this._group].forEach(function(h) {
      h.received.push(keys);
      (h._types["change"] || []).forEach(function(fn) {
        fn({ value: keys, sender: self });
      });
    });
  };
  SelectionHandle.prototype.clear = function() { this.set(undefined); };
  SelectionHandle.prototype.close = function() { this._types = {}; };
  return { SelectionHandle: SelectionHandle, FilterHandle: SelectionHandle };
}

// The chart carries BOTH config.layers (the stable full set buildKeyMap reads
// first) and derived.currentLayers (the legend-filtered subset), holding the
// same layer object, which is what Chart.js does at runtime.
function makeChart(id, mode, keys, rowKeys) {
  var handlers = {};
  var nodes = rowKeys.map(function(k) { return { _source_key: k }; });
  var layer = { type: "point", label: "pts", data: nodes };
  return {
    nodes: nodes,
    config: {
      layers: [layer],
      interactions: {
        linked: { enabled: true, group: "gx", mode: mode, key: keys }
      }
    },
    derived: { currentLayers: [layer] },
    dom: {
      element: { id: id },
      chartArea: {
        selectAll: function() {
          return {
            each: function(fn) { nodes.forEach(function(n) { fn.call(n, n); }); }
          };
        }
      }
    },
    runtime: {},
    on: function(e, f) { (handlers[e] = handlers[e] || []).push(f); },
    off: function(e, f) { handlers[e] = (handlers[e] || []).filter(function(h) { return h !== f; }); },
    emit: function(e, p) { (handlers[e] || []).forEach(function(f) { f(p); }); }
  };
}

function opacities(chart) {
  return chart.nodes.map(function(n) { return (n.style || {}).opacity; });
}

var CT_KEYS = ["Mazda RX4", "Datsun 710", "Hornet 4 Drive"];
var DIM = "var(--chart-brush-dim-opacity)";

describe("setLinked() key-space translation", function() {
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

  it("puts crosstalk's own keys on the wire, not the positional row_<i> ids", function() {
    var spy = new globalThis.crosstalk.SelectionHandle("gx");
    var src = makeChart("A", "source", CT_KEYS, ["row_1", "row_2", "row_3"]);
    bindLinked(src);

    src.emit("brushed", {
      keys: ["row_1", "row_3"],
      data: [],
      extent: { x: [0, 1], y: [0, 1] },
      active: true
    });

    expect(spy.received[spy.received.length - 1])
      .toEqual(["Mazda RX4", "Hornet 4 Drive"]);
  });

  it("matches an inbound selection expressed in crosstalk's key space", function() {
    var third = new globalThis.crosstalk.SelectionHandle("gx");
    var tgt = makeChart("B", "target", CT_KEYS, ["row_1", "row_2", "row_3"]);
    bindLinked(tgt);

    third.set(["Datsun 710"]);

    expect(opacities(tgt)).toEqual([DIM, 1.0, DIM]);
  });

  it("keeps the row_<i> key space when cfg.key is absent", function() {
    var spy = new globalThis.crosstalk.SelectionHandle("gx");
    var src = makeChart("A", "source", undefined, ["row_1", "row_2", "row_3"]);
    var tgt = makeChart("B", "target", undefined, ["row_1", "row_2", "row_3"]);
    bindLinked(src);
    bindLinked(tgt);

    src.emit("brushed", { keys: ["row_1"], data: [], active: true });

    expect(spy.received[spy.received.length - 1]).toEqual(["row_1"]);
    expect(opacities(tgt)).toEqual([1.0, DIM, DIM]);
  });

  it("falls back to the row_<i> key space when cfg.key does not index the layer", function() {
    // A linkable layer whose row count differs from cfg.key was built from
    // other rows, so translating its positional ids would mislabel marks.
    var spy = new globalThis.crosstalk.SelectionHandle("gx");
    var src = makeChart("A", "source", CT_KEYS, ["row_1", "row_2"]);
    var tgt = makeChart("B", "target", CT_KEYS, ["row_1", "row_2"]);
    bindLinked(src);
    bindLinked(tgt);

    src.emit("brushed", { keys: ["row_1"], data: [], active: true });

    expect(spy.received[spy.received.length - 1]).toEqual(["row_1"]);
    expect(opacities(tgt)).toEqual([1.0, DIM]);
  });

  it("clears the key map on teardown", function() {
    var src = makeChart("A", "source", CT_KEYS, ["row_1", "row_2", "row_3"]);
    bindLinked(src);
    expect(src.runtime._linkedKeyMap).toBeTruthy();

    // bindLinked() re-runs on every render and cleanupLinked() runs first, so
    // a re-bind with swapped data must not retain the previous map.
    src.config.layers[0].data = [{ _source_key: "row_1" }];
    src.derived.currentLayers = src.config.layers;
    bindLinked(src);
    expect(src.runtime._linkedKeyMap).toBe(null);
  });
});

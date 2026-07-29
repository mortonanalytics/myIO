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
});

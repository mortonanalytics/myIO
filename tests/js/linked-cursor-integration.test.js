import * as d3 from "d3";
import { beforeEach, describe, expect, test } from "vitest";
import {
  registerLinkedCursor,
  unregisterLinkedCursor,
  maybeEmitCursor,
  maybeClearCursor,
  _receive,
  _registry
} from "../../inst/htmlwidgets/myIO/src/interactions/linked-cursor.js";

function makeChart(id, group, cursor = true) {
  return {
    element: { id },
    config: { interactions: { linked: { group, cursor, keyColumn: "id" } } },
    runtime: {}
  };
}

function mountChart(id, group, opts) {
  opts = opts || {};
  var container = document.createElement("div");
  container.id = id;
  document.body.appendChild(container);
  var svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  container.appendChild(svgNode);
  var chart = makeChart(id, group, opts.cursor !== false);
  chart.svg = d3.select(svgNode);
  chart.height = opts.height || 400;
  chart.xScale = opts.xScale || d3.scaleLinear().domain([0, 10]).range([0, 800]);
  chart.element = container;
  return chart;
}

describe("linked-cursor: rollover hover-tail wiring", function() {
  beforeEach(function() { _registry.clear(); });

  test("maybeEmitCursor routes a full payload from chart A to chart B", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    var row = { id: "row-7", x_var: 5, y_var: 42 };
    maybeEmitCursor(a, row, 5, { title: { text: "x: 5" }, items: [] });

    expect(b.runtime._linkedCursor.lastPayload).toMatchObject({
      sourceId: "A",
      group: "g1",
      keyValue: "row-7",
      xValue: 5
    });
    expect(b.runtime._linkedCursor.lastPayload.tooltip.title.text).toBe("x: 5");
  });

  test("maybeEmitCursor is a no-op when cursor=false (criterion 5)", function() {
    var a = makeChart("A", "g1", false);
    var b = makeChart("B", "g1", true);
    registerLinkedCursor(b);

    maybeEmitCursor(a, { id: "k" }, 5, null);

    expect(b.runtime._linkedCursor.lastPayload).toBeUndefined();
  });

  test("maybeEmitCursor keyValue is null when row lacks keyColumn (hexbin/histogram)", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    maybeEmitCursor(a, { length: 4, x: 100, y: 200 }, 5, null);

    expect(b.runtime._linkedCursor.lastPayload.keyValue).toBeNull();
  });

  test("maybeClearCursor emits a clear payload to siblings", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    maybeClearCursor(a);

    expect(b.runtime._linkedCursor.lastPayload.clear).toBe(true);
  });

  test("unlinked chart is unaffected by emits to other groups (criterion 3)", function() {
    var a = makeChart("A", "g1");
    var c = makeChart("C", "other-group");
    registerLinkedCursor(a);
    registerLinkedCursor(c);

    maybeEmitCursor(a, { id: "row-1" }, 5, null);

    expect(c.runtime._linkedCursor.lastPayload).toBeUndefined();
  });

  test("echo suppression: source chart never receives its own emit (criterion 4)", function() {
    var a = makeChart("A", "g1");
    registerLinkedCursor(a);

    maybeEmitCursor(a, { id: "row-1" }, 5, null);

    expect(a.runtime._linkedCursor.lastPayload).toBeUndefined();
  });
});

describe("linked-cursor: crosshair render on receive", function() {
  beforeEach(function() {
    _registry.clear();
    document.body.innerHTML = "";
  });

  test("criterion 1: sibling renders line.myIO-hover-rule at xScaleB(5)", function() {
    var a = mountChart("A", "g1");
    var b = mountChart("B", "g1", {
      xScale: d3.scaleLinear().domain([0, 10]).range([0, 600]),
      height: 300
    });
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    maybeEmitCursor(a, { id: "row-1" }, 5, null);

    var rule = b.element.querySelector("line.myIO-hover-rule");
    expect(rule).not.toBeNull();
    expect(Number(rule.getAttribute("x1"))).toBeCloseTo(300, 0); // xScaleB(5) = 300
    expect(Number(rule.getAttribute("x2"))).toBeCloseTo(300, 0);
    expect(Number(rule.getAttribute("y1"))).toBe(0);
    expect(Number(rule.getAttribute("y2"))).toBe(300);
  });

  test("criterion 2: clear payload removes sibling crosshair", function() {
    var a = mountChart("A", "g1");
    var b = mountChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    maybeEmitCursor(a, { id: "r" }, 5, null);
    expect(b.element.querySelector("line.myIO-hover-rule")).not.toBeNull();

    maybeClearCursor(a);
    expect(b.element.querySelector("line.myIO-hover-rule")).toBeNull();
  });

  test("criterion 3: unlinked chart is unaffected (no crosshair)", function() {
    var a = mountChart("A", "g1");
    var c = mountChart("C", "other-group");
    registerLinkedCursor(a);
    registerLinkedCursor(c);

    maybeEmitCursor(a, { id: "r" }, 5, null);

    expect(c.element.querySelector("line.myIO-hover-rule")).toBeNull();
  });

  test("criterion 5: default cursor=false draws no crosshair on siblings", function() {
    var a = mountChart("A", "g1", { cursor: false });
    var b = mountChart("B", "g1", { cursor: false });
    // Do NOT register — cursor is off and register is a no-op anyway

    maybeEmitCursor(a, { id: "r" }, 5, null);

    expect(b.element.querySelector("line.myIO-hover-rule")).toBeNull();
  });

  test("criterion 6: receiver maps xValue through its own scale", function() {
    var a = mountChart("A", "g1", { xScale: d3.scaleLinear().domain([0, 10]).range([0, 800]) });
    var b = mountChart("B", "g1", { xScale: d3.scaleLinear().domain([0, 10]).range([0, 400]) });
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    maybeEmitCursor(a, { id: "r" }, 7, null);

    var rule = b.element.querySelector("line.myIO-hover-rule");
    expect(rule).not.toBeNull();
    expect(Number(rule.getAttribute("x1"))).toBeCloseTo(280, 0); // xScaleB(7) = 280, not xScaleA(7)=560
  });

  test("criterion 7: xValue outside domain draws nothing and does not throw", function() {
    var a = mountChart("A", "g1", { xScale: d3.scaleLinear().domain([0, 10]).range([0, 800]) });
    var b = mountChart("B", "g1", { xScale: d3.scaleLinear().domain([100, 200]).range([0, 600]) });
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    expect(function() {
      maybeEmitCursor(a, { id: "r" }, 5, null);
    }).not.toThrow();

    expect(b.element.querySelector("line.myIO-hover-rule")).toBeNull();
  });

  test("criterion 9: unregister on teardown clears the registry", function() {
    var a = mountChart("A", "g1");
    var b = mountChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);
    expect(_registry.has("g1")).toBe(true);

    unregisterLinkedCursor(a);
    unregisterLinkedCursor(b);

    expect(_registry.has("g1")).toBe(false);
  });
});

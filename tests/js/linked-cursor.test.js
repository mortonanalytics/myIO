import { describe, test, expect, beforeEach } from "vitest";
import {
  registerLinkedCursor,
  unregisterLinkedCursor,
  emitCursor,
  clearCursor,
  _receive,
  _registry
} from "../../inst/htmlwidgets/myIO/src/interactions/linked-cursor.js";

function makeChart(id, group, cursor = true) {
  return {
    element: { id },
    config: { interactions: { linked: { group, cursor, keyColumn: "k" } } },
    runtime: {}
  };
}

describe("linked-cursor registry", function() {
  beforeEach(function() { _registry.clear(); });

  test("register adds chart to group bucket", function() {
    var c = makeChart("A", "g1");
    registerLinkedCursor(c);
    expect(_registry.has("g1")).toBe(true);
    expect(_registry.get("g1").has(c)).toBe(true);
  });

  test("register without group is a no-op", function() {
    var c = makeChart("A", undefined);
    registerLinkedCursor(c);
    expect(_registry.size).toBe(0);
  });

  test("register without cursor=true is a no-op", function() {
    var c = makeChart("A", "g1", false);
    registerLinkedCursor(c);
    expect(_registry.size).toBe(0);
  });

  test("unregister removes chart and prunes empty bucket", function() {
    var c = makeChart("A", "g1");
    registerLinkedCursor(c);
    unregisterLinkedCursor(c);
    expect(_registry.has("g1")).toBe(false);
  });

  test("unregister leaves bucket if other charts remain", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);
    unregisterLinkedCursor(a);
    expect(_registry.get("g1").has(b)).toBe(true);
    expect(_registry.get("g1").has(a)).toBe(false);
  });
});

describe("linked-cursor emit/receive", function() {
  beforeEach(function() { _registry.clear(); });

  test("emit routes payload to all siblings in group except self", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    var c = makeChart("C", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);
    registerLinkedCursor(c);

    emitCursor(a, { sourceId: "A", group: "g1", xValue: 5, ts: 1 });

    expect(a.runtime._linkedCursor.lastPayload).toBeUndefined();
    expect(b.runtime._linkedCursor.lastPayload).toMatchObject({ sourceId: "A", xValue: 5 });
    expect(c.runtime._linkedCursor.lastPayload).toMatchObject({ sourceId: "A", xValue: 5 });
  });

  test("emit from chart with cursor=false does nothing", function() {
    var a = makeChart("A", "g1", false);
    var b = makeChart("B", "g1", true);
    registerLinkedCursor(b);
    emitCursor(a, { sourceId: "A", group: "g1", xValue: 5, ts: 1 });
    expect(b.runtime._linkedCursor.lastPayload).toBeUndefined();
  });

  test("emit to a different group does not reach charts in other groups", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g2");
    registerLinkedCursor(a);
    registerLinkedCursor(b);
    emitCursor(a, { sourceId: "A", group: "g1", xValue: 5, ts: 1 });
    expect(b.runtime._linkedCursor.lastPayload).toBeUndefined();
  });

  test("stale events (ts older than last received) are dropped", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    emitCursor(a, { sourceId: "A", group: "g1", xValue: 5, ts: 100 });
    emitCursor(a, { sourceId: "A", group: "g1", xValue: 3, ts: 50 }); // older

    expect(b.runtime._linkedCursor.lastPayload.xValue).toBe(5);
  });

  test("clearCursor emits a clear payload to siblings", function() {
    var a = makeChart("A", "g1");
    var b = makeChart("B", "g1");
    registerLinkedCursor(a);
    registerLinkedCursor(b);

    clearCursor(a);
    expect(b.runtime._linkedCursor.lastPayload.clear).toBe(true);
  });
});

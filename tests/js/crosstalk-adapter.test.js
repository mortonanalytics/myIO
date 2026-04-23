import { describe, it, expect, beforeEach, vi } from "vitest";
import { CrosstalkAdapter } from "../../inst/htmlwidgets/myIO/src/crosstalk-adapter/index.js";

function makeFakeCoord(rowsByQuery) {
  // rowsByQuery: { [sql]: rowsArrayOrCount }
  const adapter = {
    query: async function*({ sql, queryId }) {
      const rows = rowsByQuery[sql] != null ? rowsByQuery[sql] : [];
      yield { rows, queryId };
      yield { __trailer: true, queryId, rowCount: rows.length, elapsedMs: 1 };
    }
  };
  return {
    adapters: new Map([["s1", adapter]]),
    setSelection: vi.fn(),
    subscribers: new Map()
  };
}

describe("CrosstalkAdapter", () => {
  beforeEach(() => {
    // Minimal window.crosstalk stub with SelectionHandle.
    const handlers = [];
    const set = vi.fn();
    const SelectionHandle = function() {};
    SelectionHandle.prototype.on = function(evt, cb) { handlers.push(cb); };
    SelectionHandle.prototype.set = set;
    SelectionHandle.prototype.close = vi.fn();
    globalThis.window = {
      crosstalk: { SelectionHandle }
    };
    globalThis.window._handlers = handlers;
    globalThis.window._set = set;
  });

  it("below threshold: broadcasts row keys to SharedData", async () => {
    const coord = makeFakeCoord({
      "SELECT count(*) AS n FROM \"s1\" WHERE x > 1": [{ n: 5 }],
      "SELECT \"__myio_rowkey__\" AS rowkey FROM \"s1\" WHERE x > 1": [
        { rowkey: "k1" }, { rowkey: "k2" }, { rowkey: "k3" },
        { rowkey: "k4" }, { rowkey: "k5" }
      ]
    });
    const a = new CrosstalkAdapter({ coordinator: coord, sourceId: "s1", threshold: 100 });
    a.attach("g1");
    await a.broadcast({ predicate: "x > 1" });
    expect(window._set).toHaveBeenCalledWith(["k1", "k2", "k3", "k4", "k5"]);
  });

  it("above threshold: suppresses broadcast + fires one-shot info", async () => {
    const coord = makeFakeCoord({
      "SELECT count(*) AS n FROM \"s1\" WHERE x > 1": [{ n: 5000 }]
    });
    const a = new CrosstalkAdapter({ coordinator: coord, sourceId: "s1", threshold: 100 });
    a.attach("g1");
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    await a.broadcast({ predicate: "x > 1" });
    expect(window._set).not.toHaveBeenCalled();
    expect(infoSpy).toHaveBeenCalled();
    // Second call should NOT re-fire the info (one-shot):
    const callCount = infoSpy.mock.calls.length;
    await a.broadcast({ predicate: "x > 2" });
    expect(infoSpy.mock.calls.length).toBe(callCount);
    infoSpy.mockRestore();
  });

  it("mode badge updates on threshold crossing", async () => {
    const coord = makeFakeCoord({
      "SELECT count(*) AS n FROM \"s1\" WHERE x > 1": [{ n: 5 }],
      "SELECT \"__myio_rowkey__\" AS rowkey FROM \"s1\" WHERE x > 1": [{ rowkey: "k1" }],
      "SELECT count(*) AS n FROM \"s1\" WHERE x > 2": [{ n: 5000 }]
    });
    const badge = { textContent: "" };
    const a = new CrosstalkAdapter({ coordinator: coord, sourceId: "s1", threshold: 100 });
    a.attach("g1");
    a.setBadge(badge);
    await a.broadcast({ predicate: "x > 1" });
    expect(badge.textContent).toBe("linked: row-level");
    await a.broadcast({ predicate: "x > 2" });
    expect(badge.textContent).toBe("linked: predicate-only");
  });

  it("incoming row keys convert to IN (...) predicate", () => {
    const coord = makeFakeCoord({});
    const a = new CrosstalkAdapter({ coordinator: coord, sourceId: "s1", threshold: 100 });
    a.attach("g1");
    // Simulate an incoming selection event.
    const handler = window._handlers[0];
    handler({ value: ["k1", "k2", "k3"] });
    expect(coord.setSelection).toHaveBeenCalled();
    const arg = coord.setSelection.mock.calls[0][0];
    expect(arg.predicate).toContain("IN ('k1','k2','k3')");
  });

  it("null predicate clears downstream selection", async () => {
    const coord = makeFakeCoord({});
    const a = new CrosstalkAdapter({ coordinator: coord, sourceId: "s1", threshold: 100 });
    a.attach("g1");
    await a.broadcast({ predicate: null });
    // Should call selectionHandle.set(null), NOT run a count query.
    expect(window._set).toHaveBeenCalledWith(null);
  });
});

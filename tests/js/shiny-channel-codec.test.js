import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { tableFromArrays, tableToIPC } from "apache-arrow";
import { ShinyEngineAdapter } from "../../inst/htmlwidgets/myIO/src/engines/shiny.js";
import { Coordinator } from "../../inst/htmlwidgets/myIO/src/coordinator/index.js";
import { normalizeCoordinatorBatches } from "../../inst/htmlwidgets/myIO/src/coordinator/webgl-bridge.js";

// What R's .myio_arrow_ipc_b64() sends in a myio:batch message.
function ipcB64(columns) {
  return Buffer.from(tableToIPC(tableFromArrays(columns), "stream")).toString("base64");
}

describe("ShinyEngineAdapter", () => {
  let handlers;
  let sent;

  beforeEach(() => {
    handlers = {};
    sent = [];
    globalThis.Shiny = {
      setInputValue: (name, val) => { sent.push({ name, val }); },
      addCustomMessageHandler: (name, fn) => { handlers[name] = fn; }
    };
  });

  afterEach(() => { delete globalThis.Shiny; });

  it("sends the query under the input name that selects R's myio.query handler", async () => {
    const a = new ShinyEngineAdapter();
    await a.init();
    const iter = a.query({ queryId: "q1", sql: "", templateId: "t",
      sourceId: "s", bindings: {}, limit: 10 });
    const queryMsg = sent.find(m => m.name === "myio_query:myio.query");
    expect(queryMsg.val).toMatchObject({ v: 1, queryId: "q1", templateId: "t", sourceId: "s" });
    handlers["myio:end"]({ queryId: "q1", rowCount: 0, elapsedMs: 1 });
    for await (const _ of iter) { /* drain */ }
    await a.close();
  });

  it("cancel sends the input name that selects R's myio.cancel handler", async () => {
    const a = new ShinyEngineAdapter();
    await a.init();
    await a.cancel("q1");
    expect(sent.some(m => m.name === "myio_cancel:myio.cancel" && m.val.queryId === "q1")).toBe(true);
    await a.close();
  });

  it("decodes each myio:batch into an Arrow table and acks it as myio.ack", async () => {
    const a = new ShinyEngineAdapter();
    await a.init();
    const iter = a.query({ queryId: "q2", templateId: "t", sourceId: "s",
      bindings: {}, limit: 10 });
    handlers["myio:batch"]({ queryId: "q2", seq: 0, ipc: ipcB64({ x: [1, 2], y: [3, 4] }) });
    handlers["myio:end"]({ queryId: "q2", rowCount: 2, elapsedMs: 0 });
    const items = [];
    for await (const item of iter) items.push(item);
    expect(normalizeCoordinatorBatches(items.filter(i => !i.__trailer)))
      .toEqual([expect.objectContaining({ x: 1, y: 3 }), expect.objectContaining({ x: 2, y: 4 })]);
    expect(sent.some(m => m.name === "myio_ack:myio.ack" && m.val.queryId === "q2" && m.val.seq === 0)).toBe(true);
    await a.close();
  });

  it("routes results to the adapter that owns the query when several are live", async () => {
    const a = new ShinyEngineAdapter();
    const b = new ShinyEngineAdapter();
    await a.init();
    await b.init();
    const iterA = a.query({ queryId: "qa", templateId: "t", sourceId: "sa", bindings: {} });
    const iterB = b.query({ queryId: "qb", templateId: "t", sourceId: "sb", bindings: {} });
    handlers["myio:end"]({ queryId: "qa", rowCount: 0, elapsedMs: 0 });
    handlers["myio:end"]({ queryId: "qb", rowCount: 0, elapsedMs: 0 });
    const trailers = [];
    for await (const item of iterA) trailers.push(item.queryId);
    for await (const item of iterB) trailers.push(item.queryId);
    expect(trailers).toEqual(["qa", "qb"]);
    await a.close();
    await b.close();
  });

  it("coordinator sends a server-engine chart query as a template R can compose and renders the reply", async () => {
    const c = new Coordinator({ config: { engine: "server" } });
    const results = [];
    c.register({
      chartId: "chart",
      queryTemplate: "SELECT \"wt\" AS x, \"mpg\" AS y, \"cyl\" AS color FROM \"s1\" WHERE {{where}} LIMIT {{limit}}",
      markSpec: { kind: "scatter", channels: { x: "wt", y: "mpg", color: "cyl" } },
      sourceHandle: { sourceId: "s1", engine: "server" },
      predicateFn: () => null,
      onResult: (payload) => results.push(payload)
    });
    c.register({ chartId: "other", queryTemplate: "", markSpec: {},
      sourceHandle: { sourceId: "s1", engine: "server" }, predicateFn: () => null });
    c.setSelection({
      chartId: "other",
      predicate: "\"__myio_rowkey__\" IN ('1','2')",
      filter: { column: "__myio_rowkey__", values: ["1", "2"] }
    });

    await expect.poll(() => sent.filter(m => m.name === "myio_query:myio.query").length).toBeGreaterThan(0);
    const query = sent.filter(m => m.name === "myio_query:myio.query").pop().val;
    expect(query).toMatchObject({
      sourceId: "s1",
      templateId: "mark_xy_color",
      bindings: {
        x: "wt", y: "mpg", color: "cyl",
        where: [{ column: "__myio_rowkey__", values: ["1", "2"] }]
      }
    });

    handlers["myio:batch"]({ queryId: query.queryId, seq: 0, ipc: ipcB64({ x: [2.5], y: [21], color: [4] }) });
    handlers["myio:end"]({ queryId: query.queryId, rowCount: 1, elapsedMs: 3 });
    await expect.poll(() => results.length).toBeGreaterThan(0);
    expect(normalizeCoordinatorBatches(results.at(-1).batches))
      .toEqual([expect.objectContaining({ x: 2.5, y: 21, color: 4 })]);
    await c.close();
  });

  it("coordinator withholds the template when a selection has no structured filter", () => {
    const c = new Coordinator({ config: { engine: "server" } });
    c.register({ chartId: "other", queryTemplate: "", markSpec: {},
      sourceHandle: { sourceId: "s1" }, predicateFn: () => null });
    c.setSelection({ chartId: "other", predicate: "x > 1" });
    const { templateId } = c._markTemplate({ channels: { x: "x", y: "y" } }, "chart", "s1");
    expect(templateId).toBeNull();
  });
});

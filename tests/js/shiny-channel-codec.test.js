import { describe, it, expect, beforeEach, afterEach } from "vitest";

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

  it("sends myio_query on query() via setInputValue, not sendCustomMessage", async () => {
    const { ShinyEngineAdapter } = await import("../../inst/htmlwidgets/myIO/src/engines/shiny.js");
    const a = new ShinyEngineAdapter();
    await a.init();
    const iter = a.query({ queryId: "q1", sql: "", templateId: "t",
      sourceId: "s", bindings: {}, limit: 10 });
    await new Promise(r => setTimeout(r, 0));
    expect(sent.some(m => m.name === "myio_query")).toBe(true);
    const queryMsg = sent.find(m => m.name === "myio_query");
    expect(queryMsg.val.v).toBe(1);
    expect(queryMsg.val.queryId).toBe("q1");
    expect(queryMsg.val.templateId).toBe("t");
    handlers["myio:end"]({ queryId: "q1", rowCount: 0, elapsedMs: 1 });
    for await (const item of iter) {
      if (item.__trailer) break;
    }
  });

  it("cancel sends myio_cancel via setInputValue", async () => {
    const { ShinyEngineAdapter } = await import("../../inst/htmlwidgets/myIO/src/engines/shiny.js");
    const a = new ShinyEngineAdapter();
    await a.init();
    await a.cancel("q1");
    expect(sent.some(m => m.name === "myio_cancel" && m.val.queryId === "q1")).toBe(true);
  });

  it("batch ack fires on each myio:batch handler invocation", async () => {
    const { ShinyEngineAdapter } = await import("../../inst/htmlwidgets/myIO/src/engines/shiny.js");
    const a = new ShinyEngineAdapter();
    await a.init();
    const iter = a.query({ queryId: "q2", templateId: "t", sourceId: "s",
      bindings: {}, limit: 10 });
    await new Promise(r => setTimeout(r, 0));
    handlers["myio:batch"]({ queryId: "q2", seq: 1, ipc: "" });
    handlers["myio:end"]({ queryId: "q2", rowCount: 0, elapsedMs: 0 });
    for await (const _ of iter) { /* drain */ }
    expect(sent.some(m => m.name === "myio_ack" && m.val.queryId === "q2" && m.val.seq === 1)).toBe(true);
  });
});

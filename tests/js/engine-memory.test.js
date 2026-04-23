import { describe, it, expect } from "vitest";
import { MemoryEngine } from "../../inst/htmlwidgets/myIO/src/engines/memory.js";
import { SvgNullAdapter } from "../../inst/htmlwidgets/myIO/src/engines/svg-null.js";
import { SourceRegistry } from "../../inst/htmlwidgets/myIO/src/coordinator/source-registry.js";

// Build a small Arrow IPC buffer inline using apache-arrow.
async function makeIpcB64(rows) {
  const arrow = await import("apache-arrow");
  const table = arrow.tableFromJSON(rows);
  const ipc = arrow.tableToIPC(table, "stream");
  // Node's Buffer for base64, or btoa for pure-browser; vitest runs in node.
  return Buffer.from(ipc).toString("base64");
}

describe("SvgNullAdapter", () => {
  it("yields a single trailer and no batches", async () => {
    const a = new SvgNullAdapter();
    await a.init();
    const it = a.query({ queryId: "q1" });
    let trailers = 0;
    for await (const item of it) {
      if (item.__trailer) trailers++;
    }
    expect(trailers).toBe(1);
    await a.close();
  });
});

describe("MemoryEngine", () => {
  it("registers an inline_ipc source and executes a SELECT", async () => {
    const ipcB64 = await makeIpcB64([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "c" }
    ]);
    const reg = new SourceRegistry();
    reg.register({
      sourceId: "test_src",
      mode: "inline_ipc",
      ipcB64,
      url: null,
      schema: [{ name: "id", type: "int" }, { name: "name", type: "utf8" }],
      rowCount: 3,
      rowkeyCol: "id"
    });
    const eng = new MemoryEngine();
    await eng.init({ sourceRegistry: reg });

    const batches = [];
    let trailer = null;
    for await (const item of eng.query({
      sql: "SELECT COUNT(*) AS n FROM test_src",
      queryId: "q1"
    })) {
      if (item.__trailer) trailer = item;
      else batches.push(item);
    }
    expect(batches.length).toBeGreaterThanOrEqual(1);
    expect(trailer).not.toBeNull();
    expect(trailer.queryId).toBe("q1");
    await eng.close();
  });

  it("returns syntax error for invalid SQL", async () => {
    const reg = new SourceRegistry();
    const eng = new MemoryEngine();
    await eng.init({ sourceRegistry: reg });
    await expect(async () => {
      for await (const _ of eng.query({ sql: "NOT SQL", queryId: "q" })) {
        // consume
      }
    }).rejects.toMatchObject({ code: "syntax" });
    await eng.close();
  });

  it("after close, queries raise engine-gone", async () => {
    const eng = new MemoryEngine();
    await eng.init({ sourceRegistry: new SourceRegistry() });
    await eng.close();
    await expect(async () => {
      for await (const _ of eng.query({ sql: "SELECT 1", queryId: "q" })) {}
    }).rejects.toMatchObject({ code: "engine-gone" });
  });
});

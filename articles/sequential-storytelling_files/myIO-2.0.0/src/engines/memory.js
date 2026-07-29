// MemoryEngine: pure in-browser test double. Loads each registered source
// into alasql from Arrow IPC bytes. Exposes the contract's query()
// async-iterator interface so coordinator unit tests can run without
// booting DuckDB-WASM or a Shiny server.
//
// Not used in production. alasql stays in package.json because tests run
// under the same bundle, but build-time the production bundle can
// tree-shake unreachable MemoryEngine paths.

import { b64ToBytes } from "../utils/b64-to-bytes.js";

export class MemoryEngine {
  constructor(config = {}) {
    this.sources = new Map();
    this.config = config;
    this._closed = false;
  }

  async init({ sourceRegistry } = {}) {
    if (!sourceRegistry) return;
    // Lazy-import alasql + arrow so the factory itself is cheap to load.
    const [arrow, alasqlMod] = await Promise.all([
      import("apache-arrow"),
      import("alasql")
    ]);
    const alasql = alasqlMod.default || alasqlMod;

    for (const src of sourceRegistry.all()) {
      if (src.mode !== "inline_ipc" || !src.ipcB64) {
        // Test double supports inline_ipc only.
        continue;
      }
      const bytes = b64ToBytes(src.ipcB64);
      const table = arrow.tableFromIPC(bytes);
      const rows = table.toArray().map(r => Object.assign({}, r));
      // Register as an alasql virtual table under the sourceId.
      alasql.tables[src.sourceId] = { data: rows };
      this.sources.set(src.sourceId, { table, rows });
    }
    this._alasql = alasql;
  }

  async *query({ sql, params = [], queryId, signal }) {
    if (this._closed) {
      throw Object.assign(new Error("engine-gone"), { queryId, code: "engine-gone" });
    }
    if (signal && signal.aborted) {
      throw Object.assign(new Error("cancelled"), { queryId, code: "cancelled" });
    }
    const started = Date.now();
    let rows;
    try {
      rows = this._alasql.exec(sql, params);
    } catch (e) {
      throw Object.assign(new Error(e.message || String(e)), {
        queryId,
        code: "syntax"
      });
    }
    // Yield one synthetic "batch" (just the rows) then the trailer.
    yield { rows, queryId };
    yield {
      __trailer: true,
      queryId,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      elapsedMs: Date.now() - started
    };
  }

  async cancel(_queryId) { /* alasql is synchronous; nothing to cancel */ }

  async applyPredicateCache(_hash, _predicateSQL) { /* no-op */ }

  async close() {
    if (this._alasql) {
      for (const srcId of this.sources.keys()) {
        delete this._alasql.tables[srcId];
      }
    }
    this.sources.clear();
    this._closed = true;
  }
}

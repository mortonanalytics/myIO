// WasmEngineAdapter: in-browser DuckDB-WASM engine. Boots DuckDB-WASM
// by dynamically importing the loader from a user-cache URL (installed
// via R's myIO::install_duckdb_wasm()); registers sources into DuckDB
// via registerFileBuffer (inline_ipc) or registerFileURL (url mode);
// forwards queries as SQL against the in-browser DuckDB instance.
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   Symbols (WasmEngineAdapter), JS engine adapter interface.

import { b64ToBytes } from "../utils/b64-to-bytes.js";

export class WasmEngineAdapter {
  constructor(config = {}) {
    this.config = config;
    // cacheUrl is a directory URL; loader + wasm binary + worker JS live inside.
    this.cacheUrl = (config.duckdb_wasm && config.duckdb_wasm.cache_url) || null;
    this.workerUrl = (config.duckdb_wasm && config.duckdb_wasm.worker_url) || null;
    this.db = null;
    this.conn = null;
    this._duckdb = null;
    this._closed = false;
  }

  async init({ sourceRegistry } = {}) {
    if (this._closed) {
      throw Object.assign(new Error("engine-gone"), { code: "engine-gone" });
    }
    if (!this.cacheUrl || !this.workerUrl) {
      throw Object.assign(
        new Error("WasmEngineAdapter: duckdb_wasm cache_url / worker_url not set. " +
                  "Ensure myIO::install_duckdb_wasm() has run."),
        { code: "engine-gone" }
      );
    }
    // Dynamic import of duckdb-wasm loader. The loader module exports
    // AsyncDuckDB and ConsoleLogger. The cacheUrl points at the dir
    // containing duckdb-browser.mjs (R-side htmlDependency serves it).
    const loaderUrl = this.cacheUrl.replace(/\/?$/, "/") + "duckdb-browser.mjs";
    let duckdb;
    try {
      duckdb = await import(/* @vite-ignore */ loaderUrl);
    } catch (err) {
      throw Object.assign(
        new Error("WasmEngineAdapter: failed to import duckdb-wasm loader from " +
                  loaderUrl + ": " + (err?.message || err)),
        { code: "engine-gone" }
      );
    }
    this._duckdb = duckdb;

    const worker = new Worker(this.workerUrl);
    const wasmModuleUrl = this.cacheUrl.replace(/\/?$/, "/") + "duckdb-mvp.wasm";
    const logger = new duckdb.ConsoleLogger();
    this.db = new duckdb.AsyncDuckDB(logger, worker);
    await this.db.instantiate(wasmModuleUrl);
    this.conn = await this.db.connect();

    if (sourceRegistry) {
      for (const src of sourceRegistry.all()) {
        await this._registerSource(src);
      }
    }
  }

  async _registerSource(src) {
    if (!this._duckdb) return;
    const DataProtocol = this._duckdb.DuckDBDataProtocol;
    if (src.mode === "inline_ipc" && src.ipcB64) {
      const bytes = b64ToBytes(src.ipcB64);
      const virtualName = src.sourceId + ".arrow";
      await this.db.registerFileBuffer(virtualName, bytes);
      await this.conn.query(
        "CREATE OR REPLACE VIEW \"" + src.sourceId.replace(/"/g, "\"\"") +
        "\" AS SELECT * FROM read_arrow('" + virtualName + "');"
      );
    } else if (src.mode === "url" && src.url) {
      const virtualName = src.sourceId + (/\.parquet$/i.test(src.url) ? ".parquet"
        : /\.arrow$/i.test(src.url) ? ".arrow"
          : /\.feather$/i.test(src.url) ? ".feather"
            : ".csv");
      await this.db.registerFileURL(virtualName, src.url, DataProtocol.HTTP, false);
      const reader = /\.parquet$/i.test(src.url) ? "read_parquet"
        : /\.arrow$/i.test(src.url) ? "read_arrow"
          : /\.feather$/i.test(src.url) ? "read_arrow"
            : "read_csv_auto";
      await this.conn.query(
        "CREATE OR REPLACE VIEW \"" + src.sourceId.replace(/"/g, "\"\"") +
        "\" AS SELECT * FROM " + reader + "('" + virtualName + "');"
      );
    }
    // dbi-mode sources are server-engine only; WasmEngineAdapter ignores them.
  }

  async *query({ sql, params = [], queryId, signal }) {
    void params;
    if (this._closed) {
      throw Object.assign(new Error("engine-gone"), { queryId, code: "engine-gone" });
    }
    if (signal && signal.aborted) {
      throw Object.assign(new Error("cancelled"), { queryId, code: "cancelled" });
    }
    const started = Date.now();
    let reader;
    let abortListener = null;
    try {
      // Use send() to get an async reader; send() accepts bound values via
      // a separate prepared-statement API. For v1, SQL is passed through
      // directly from the coordinator.
      reader = await this.conn.send(sql);
    } catch (err) {
      throw Object.assign(new Error(err?.message || String(err)), {
        queryId,
        code: "syntax"
      });
    }
    if (signal) {
      abortListener = () => {
        if (this.conn) {
          this.conn.cancelSent().catch(() => {});
        }
      };
      signal.addEventListener("abort", abortListener);
    }
    let rowCount = 0;
    try {
      while (true) {
        if (signal && signal.aborted) {
          try { await this.conn.cancelSent(); } catch (_) {}
          throw Object.assign(new Error("cancelled"), {
            queryId,
            code: "cancelled"
          });
        }
        const { done, value } = await reader.next();
        if (done) break;
        if (value) {
          rowCount += (value.numRows || 0);
          yield { batch: value, queryId };
        }
      }
    } finally {
      if (signal && abortListener) {
        signal.removeEventListener("abort", abortListener);
      }
      try { await reader.return(); } catch (_) {}
    }
    yield {
      __trailer: true,
      queryId,
      rowCount,
      elapsedMs: Date.now() - started
    };
  }

  async cancel(_queryId) {
    if (this.conn) {
      try { await this.conn.cancelSent(); } catch (_) {}
    }
  }

  async applyPredicateCache(_hash, _predicateSQL) { /* no-op - cache lives in coordinator */ }

  async close() {
    this._closed = true;
    if (this.conn) {
      try { await this.conn.close(); } catch (_) {}
      this.conn = null;
    }
    if (this.db) {
      try { await this.db.terminate(); } catch (_) {}
      this.db = null;
    }
  }
}

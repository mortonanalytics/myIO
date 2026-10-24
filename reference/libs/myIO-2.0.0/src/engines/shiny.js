// Browser-side Shiny engine adapter. Sends queries to R via setInputValue
// (input handler registered R-side: "myio.query"); receives results via
// addCustomMessageHandler("myio:batch" | "myio:end" | "myio:error").
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   §Shiny transport, §JS engine adapter interface.

import { b64ToBytes } from "../utils/b64-to-bytes.js";

// Shiny picks an input handler from the ":type" suffix of the input name;
// these suffixes match the types registered in R/shiny_dispatch.R.
export const SHINY_INPUTS = {
  query: "myio_query:myio.query",
  cancel: "myio_cancel:myio.cancel",
  ack: "myio_ack:myio.ack"
};

// Shiny keeps one handler per custom-message type, so a second adapter (one
// per big-data source) would replace the first adapter's handlers. One set of
// handlers is installed per page and routes each message to every live
// adapter; an adapter ignores query ids it does not own.
const liveAdapters = new Set();
let handlersInstalledOn = null;

function installSharedHandlers() {
  if (handlersInstalledOn === Shiny) return;
  for (const kind of ["batch", "end", "error"]) {
    Shiny.addCustomMessageHandler("myio:" + kind, (msg) => {
      for (const adapter of liveAdapters) adapter._route(kind, msg);
    });
  }
  handlersInstalledOn = Shiny;
}

export class ShinyEngineAdapter {
  constructor(config = {}) {
    this.config = config;
    /** @type {Map<string, { push: (x:any)=>void, end: ()=>void, error: (e:any)=>void, seqBudget: number }>} */
    this.pending = new Map();
    this.batchWindow = (config && config.shiny_batch_window) || 4;
  }

  async init({ sourceRegistry } = {}) {
    if (typeof Shiny === "undefined") {
      throw Object.assign(new Error("Shiny is not available in this context"), {
        code: "engine-gone"
      });
    }
    // Lazy import keeps src/ loadable as plain browser modules (no bare
    // specifier until a server engine actually starts).
    this._tableFromIPC = (await import("apache-arrow")).tableFromIPC;
    installSharedHandlers();
    liveAdapters.add(this);
    // renderMyIO() registers the source R-side in session$userData, so the
    // adapter does not echo sources back to R.
  }

  _route(kind, msg) {
    const slot = this.pending.get(msg.queryId);
    if (!slot) return;
    if (kind === "batch") {
      let table;
      try {
        table = this._tableFromIPC(b64ToBytes(msg.ipc));
      } catch (err) {
        slot.error(Object.assign(new Error("could not decode result batch: " +
          (err?.message || err)), { queryId: msg.queryId, code: "syntax" }));
        return;
      }
      slot.push({ batch: table, queryId: msg.queryId, seq: msg.seq });
      // Acknowledge receipt so R can release backpressure.
      Shiny.setInputValue(
        SHINY_INPUTS.ack,
        { v: 1, queryId: msg.queryId, seq: msg.seq },
        { priority: "event" }
      );
    } else if (kind === "end") {
      slot.push({
        __trailer: true,
        queryId: msg.queryId,
        rowCount: msg.rowCount,
        elapsedMs: msg.elapsedMs
      });
      slot.end();
    } else if (kind === "error") {
      slot.error(Object.assign(new Error(msg.message || "engine error"), {
        queryId: msg.queryId,
        code: msg.code || "engine-gone"
      }));
    }
  }

  /**
   * Async iterator for query results. R composes the SQL from templateId +
   * bindings; `sql` is forwarded as debug context only and R ignores it.
   */
  query({
    sql,
    params = [],
    queryId,
    signal,
    templateId,
    sourceId,
    bindings,
    predicateHash,
    limit
  }) {
    void params;
    if (typeof Shiny === "undefined") {
      throw Object.assign(new Error("Shiny not available"), {
        queryId,
        code: "engine-gone"
      });
    }
    // Build a bounded async queue for this query.
    const queue = [];
    let resolvers = [];
    let doneFlag = false;
    let errorFlag = null;
    const push = (item) => {
      if (resolvers.length) resolvers.shift()({ value: item, done: false });
      else queue.push(item);
    };
    const end = () => {
      doneFlag = true;
      while (resolvers.length) {
        resolvers.shift()({ value: undefined, done: true });
      }
    };
    const error = (err) => {
      errorFlag = err;
      while (resolvers.length) {
        resolvers.shift()({ value: undefined, done: true });
      }
    };
    this.pending.set(queryId, {
      push,
      end,
      error,
      seqBudget: this.batchWindow
    });

    // Cancel via AbortSignal -> setInputValue("myio_cancel").
    let abortListener = null;
    if (signal) {
      abortListener = () => {
        Shiny.setInputValue(
          SHINY_INPUTS.cancel,
          { v: 1, queryId },
          { priority: "event" }
        );
        error(Object.assign(new Error("cancelled"), {
          queryId,
          code: "cancelled"
        }));
      };
      if (signal.aborted) abortListener();
      else signal.addEventListener("abort", abortListener);
    }

    if (!errorFlag) {
      Shiny.setInputValue(
        SHINY_INPUTS.query,
        {
          v: 1,
          queryId,
          templateId: templateId || null,
          sourceId: sourceId || null,
          predicateHash: predicateHash || null,
          bindings: bindings || {},
          limit: limit || null,
          // Also forward raw `sql` for debugging; R-side validation ignores it.
          _debugSql: sql
        },
        { priority: "event" }
      );
    }

    const pending = this.pending;
    return (async function* () {
      try {
        while (true) {
          if (errorFlag) throw errorFlag;
          if (queue.length) {
            yield queue.shift();
            continue;
          }
          if (doneFlag) return;
          // Await next push.
          const next = await new Promise((res) => resolvers.push(res));
          if (next.done) {
            if (errorFlag) throw errorFlag;
            return;
          }
          yield next.value;
        }
      } finally {
        if (signal && abortListener) {
          signal.removeEventListener("abort", abortListener);
        }
        pending.delete(queryId);
      }
    })();
  }

  async cancel(queryId) {
    if (typeof Shiny !== "undefined") {
      Shiny.setInputValue(
        SHINY_INPUTS.cancel,
        { v: 1, queryId },
        { priority: "event" }
      );
    }
    const slot = this.pending.get(queryId);
    if (slot) {
      slot.error(Object.assign(new Error("cancelled"), {
        queryId,
        code: "cancelled"
      }));
    }
  }

  async applyPredicateCache(_hash, _predicateSQL) { /* no-op for Shiny engine */ }

  async close() {
    for (const [, slot] of this.pending) {
      slot.error(Object.assign(new Error("engine closed"), {
        code: "engine-gone"
      }));
    }
    this.pending.clear();
    liveAdapters.delete(this);
  }
}

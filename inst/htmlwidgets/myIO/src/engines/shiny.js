// Browser-side Shiny engine adapter. Sends queries to R via setInputValue
// (input handler registered R-side: "myio.query"); receives results via
// addCustomMessageHandler("myio:batch" | "myio:end" | "myio:error").
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   §Shiny transport, §JS engine adapter interface.

export class ShinyEngineAdapter {
  constructor(config = {}) {
    this.config = config;
    /** @type {Map<string, { push: (x:any)=>void, end: ()=>void, error: (e:any)=>void, seqBudget: number }>} */
    this.pending = new Map();
    this.batchWindow = (config && config.shiny_batch_window) || 4;
    this._handlersRegistered = false;
  }

  async init({ sourceRegistry } = {}) {
    if (typeof Shiny === "undefined") {
      throw Object.assign(new Error("Shiny is not available in this context"), {
        code: "engine-gone"
      });
    }
    if (this._handlersRegistered) return;
    const onBatch = (msg) => this._route("batch", msg);
    const onEnd = (msg) => this._route("end", msg);
    const onError = (msg) => this._route("error", msg);
    Shiny.addCustomMessageHandler("myio:batch", onBatch);
    Shiny.addCustomMessageHandler("myio:end", onEnd);
    Shiny.addCustomMessageHandler("myio:error", onError);
    this._handlersRegistered = true;
    // sourceRegistry is used R-side; the JS adapter does not echo sources
    // back to R because R already sees them via session$userData.
  }

  _route(kind, msg) {
    const slot = this.pending.get(msg.queryId);
    if (!slot) return;
    if (kind === "batch") {
      slot.push(msg);
      // Acknowledge receipt so R can release backpressure.
      Shiny.setInputValue(
        "myio_ack",
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
   * Async iterator for query results. Expects `sql` to already be a validated,
   * parameterized template string on the R side. In this adapter contract
   * layer, the "sql" field carries debug context only; the coordinator passes
   * templateId + bindings, which R validates and composes into SQL.
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
          "myio_cancel",
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
      // Fire the query. The R side expects templateId + bindings, not raw SQL.
      // The coordinator should pass these through query(); we forward them.
      Shiny.setInputValue(
        "myio_query",
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
        "myio_cancel",
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
    // We do NOT remove the Shiny custom message handlers because Shiny has
    // no un-register API; they become no-ops once this.pending is empty.
  }
}

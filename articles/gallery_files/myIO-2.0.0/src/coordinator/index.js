import { QueryCache } from "./query-cache.js";
import { SourceRegistry } from "./source-registry.js";
import { createEngine } from "../engines/index.js";

export class Coordinator {
  constructor({ config }) {
    this.config = config || {};
    this.cache = new QueryCache({ max: 128 });
    this.sourceRegistry = new SourceRegistry();
    /** @type {Map<string, object>} chartId -> registration */
    this.charts = new Map();
    /** @type {Map<string, Map<string,string>>} sourceId -> (chartId -> predicateSQL) */
    this.selectionStore = new Map();
    /** @type {Map<string, object>} sourceId -> engine adapter */
    this.adapters = new Map();
    /** @type {Map<string, Promise<object>>} sourceId -> in-flight adapter init */
    this._adapterInits = new Map();
    /** @type {Map<string, AbortController>} chartId -> in-flight query abort controller */
    this._inflightControllers = new Map();
    /** @type {Map<string, {preview:any, final:any}>} chartId -> debouncers */
    this._debouncers = new Map();
  }

  /** Ensure an engine adapter exists for `sourceId`. Lazy per Multi-widget lifecycle contract. */
  ensureAdapterFor(sourceId, engineName, config) {
    if (this.adapters.has(sourceId)) return Promise.resolve(this.adapters.get(sourceId));
    if (this._adapterInits.has(sourceId)) return this._adapterInits.get(sourceId);
    const adapter = createEngine(engineName, config);
    const promise = adapter.init({ sourceRegistry: this.sourceRegistry })
      .then(() => {
        this.adapters.set(sourceId, adapter);
        this._adapterInits.delete(sourceId);
        return adapter;
      })
      .catch((err) => {
        this._adapterInits.delete(sourceId);
        throw err;
      });
    this._adapterInits.set(sourceId, promise);
    return promise;
  }

  /** Register a source entry - wraps SourceRegistry.register and returns void. */
  registerSource(entry) {
    this.sourceRegistry.register(entry);
  }

  /** Register a chart. Expected payload shape in contract Chart registration. */
  register({ chartId, queryTemplate, markSpec, sourceHandle, predicateFn, onResult }) {
    this.charts.set(chartId, {
      chartId,
      queryTemplate,
      markSpec,
      sourceHandle,
      predicateFn,
      currentPredicate: null,
      onResult
    });
    if (!this.selectionStore.has(sourceHandle.sourceId)) {
      this.selectionStore.set(sourceHandle.sourceId, new Map());
    }
    if (queryTemplate && String(queryTemplate).trim() && onResult) {
      setTimeout(() => this._dispatch(chartId, { preview: false }), 0);
    }
  }

  unregister(chartId) {
    const reg = this.charts.get(chartId);
    if (!reg) return;
    this.charts.delete(chartId);

    const inflight = this._inflightControllers.get(chartId);
    if (inflight) {
      inflight.abort();
      this._inflightControllers.delete(chartId);
    }

    const sourceId = reg.sourceHandle.sourceId;
    const selMap = this.selectionStore.get(sourceId);
    if (selMap) selMap.delete(chartId);

    const db = this._debouncers.get(chartId);
    if (db) {
      if (db.preview) clearTimeout(db.preview);
      if (db.final) clearTimeout(db.final);
      this._debouncers.delete(chartId);
    }

    const remaining = [...this.charts.values()]
      .filter(r => r.sourceHandle.sourceId === sourceId);
    if (remaining.length === 0) {
      const adapter = this.adapters.get(sourceId);
      if (adapter) {
        adapter.close().catch(() => {});
        this.adapters.delete(sourceId);
      }
      this._adapterInits.delete(sourceId);
      this.selectionStore.delete(sourceId);
    }
  }

  /** Called by charts when their local selection changes. */
  setSelection({ chartId, predicate }) {
    const reg = this.charts.get(chartId);
    if (!reg) return;

    const sourceId = reg.sourceHandle.sourceId;
    let selMap = this.selectionStore.get(sourceId);
    if (!selMap) {
      selMap = new Map();
      this.selectionStore.set(sourceId, selMap);
    }

    if (predicate == null) {
      selMap.delete(chartId);
    } else {
      selMap.set(chartId, predicate);
    }
    reg.currentPredicate = predicate;

    for (const other of this.charts.values()) {
      if (other.chartId === chartId) continue;
      if (other.sourceHandle.sourceId !== sourceId) continue;
      this._scheduleDispatch(other.chartId);
    }

    // Fire subscribers (e.g., crosstalk adapter) after selection store
    // is consistent but independent of the _scheduleDispatch debounce.
    if (this._subscribers) {
      const subs = this._subscribers.get(reg.sourceHandle.sourceId);
      if (subs) {
        for (const cb of subs) {
          try {
            cb({ chartId, predicate });
          } catch (e) {
            console.error("[myIO coordinator] subscriber error:", e);
          }
        }
      }
    }
  }

  /**
   * Subscribe a callback to selection changes on a source. Called after
   * the internal selection store updates but before dispatch fires for
   * other charts. Useful for the crosstalk adapter which broadcasts
   * row-key selections to sibling htmlwidgets.
   *
   * @param {string} sourceId
   * @param {(evt: {chartId:string, predicate:string|null}) => void} callback
   * @returns {() => void} unsubscribe function
   */
  subscribe(sourceId, callback) {
    if (!this._subscribers) this._subscribers = new Map();
    if (!this._subscribers.has(sourceId)) {
      this._subscribers.set(sourceId, new Set());
    }
    this._subscribers.get(sourceId).add(callback);
    return () => {
      const set = this._subscribers.get(sourceId);
      if (set) set.delete(callback);
    };
  }

  /** Schedule preview (50ms trailing) + final (200ms trailing) dispatch. */
  _scheduleDispatch(chartId) {
    let db = this._debouncers.get(chartId);
    if (!db) {
      db = { preview: null, final: null };
      this._debouncers.set(chartId, db);
    }
    if (db.preview) clearTimeout(db.preview);
    if (db.final) clearTimeout(db.final);
    db.preview = setTimeout(() => this._dispatch(chartId, { preview: true }), 50);
    db.final = setTimeout(() => this._dispatch(chartId, { preview: false }), 200);
  }

  async _dispatch(chartId, { preview = false } = {}) {
    const reg = this.charts.get(chartId);
    if (!reg) return;
    if (!reg.onResult || !reg.queryTemplate || !String(reg.queryTemplate).trim()) return;

    const sourceId = reg.sourceHandle.sourceId;
    const predicate = this._composeOthersPredicate(chartId, sourceId);
    const sqlForCoords = this._substituteTemplate(reg.queryTemplate, {
      where: predicate,
      limit: preview ? 1000 : 100000
    });
    const predicateHash = await this._hash(predicate);
    const engineName = reg.sourceHandle.engine || this.config.engine;
    const cacheKey = await this._hash(
      sqlForCoords + "\x1f" + predicateHash + "\x1f" + engineName
    );

    const hit = this.cache.get(cacheKey);
    if (hit) {
      this._deliverToRenderer(chartId, hit);
      return;
    }

    let adapter = this.adapters.get(sourceId);
    try {
      if (!adapter && engineName) {
        adapter = await this.ensureAdapterFor(sourceId, engineName, this.config);
      }
      if (!this.charts.has(chartId)) return;
      if (!adapter) return;

      if (typeof adapter.applyPredicateCache === "function") {
        await adapter.applyPredicateCache(predicateHash, predicate);
      }
    } catch (err) {
      if (!this.charts.has(chartId)) return;
      console.error("[myIO coordinator]", chartId, err?.code, err?.message || err);
      this._deliverToRenderer(chartId, {
        batches: [],
        trailer: { error: err?.message || String(err), code: err?.code || "engine_error" }
      });
      return;
    }

    const queryId = "q_" + Math.random().toString(36).slice(2, 10);
    let abortCtrl = null;
    if (!this.cache.inflight.has(cacheKey)) {
      const previous = this._inflightControllers.get(chartId);
      if (previous) previous.abort();
      abortCtrl = new AbortController();
      this._inflightControllers.set(chartId, abortCtrl);
    }
    const promise = this.cache.inflightOrStore(cacheKey, () => {
      return (async () => {
        const batches = [];
        let trailer = null;
        for await (const item of adapter.query({
          sql: sqlForCoords,
          params: [],
          queryId,
          sourceId,
          limit: preview ? 1000 : 100000,
          signal: abortCtrl.signal
        })) {
          if (item.__trailer) {
            trailer = item;
          } else {
            batches.push(item);
          }
        }
        return { batches, trailer };
      })();
    });

    try {
      const result = await promise;
      const currentCtrl = this._inflightControllers.get(chartId);
      if (abortCtrl && currentCtrl === abortCtrl) {
        this._inflightControllers.delete(chartId);
      }
      if (abortCtrl && abortCtrl.signal.aborted) {
        this.cache.rejectInflight(cacheKey);
        return;
      }
      this.cache.resolveInflight(cacheKey, result);
      if (!this.charts.has(chartId)) return;
      this._deliverToRenderer(chartId, result);
    } catch (err) {
      this.cache.rejectInflight(cacheKey);
      const currentCtrl = this._inflightControllers.get(chartId);
      if (abortCtrl && currentCtrl === abortCtrl) {
        this._inflightControllers.delete(chartId);
      }
      if (abortCtrl && abortCtrl.signal.aborted) return;
      console.error("[myIO coordinator]", chartId, err?.code, err?.message || err);
      this._deliverToRenderer(chartId, {
        batches: [],
        trailer: { error: err?.message || String(err), code: err?.code || "query_error" }
      });
    }
  }

  _composeOthersPredicate(chartId, sourceId) {
    const selMap = this.selectionStore.get(sourceId) || new Map();
    const others = [...selMap.entries()]
      .filter(([id]) => id !== chartId)
      .map(([, p]) => p)
      .filter(Boolean);
    return others.length ? "(" + others.join(") AND (") + ")" : "TRUE";
  }

  _substituteTemplate(template, { where, limit }) {
    return template
      .replace(/\{\{\s*where\s*\}\}/g, where)
      .replace(/\{\{\s*limit\s*\}\}/g, String(limit))
      .replace(/\$where\b/g, where)
      .replace(/\$limit\b/g, String(limit));
  }

  async _hash(str) {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const buf = new TextEncoder().encode(str);
      const h = await crypto.subtle.digest("SHA-1", buf);
      return Array.from(new Uint8Array(h, 0, 8))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  _deliverToRenderer(chartId, { batches, trailer }) {
    const reg = this.charts.get(chartId);
    if (!reg || !reg.onResult) return;

    try {
      reg.onResult({ batches, trailer, markSpec: reg.markSpec });
    } catch (e) {
      console.error("[myIO coordinator] renderer error for", chartId, e);
    }
  }

  /** Public hook: attach a result callback to a registered chart. */
  onChartResult(chartId, callback) {
    const reg = this.charts.get(chartId);
    if (reg) reg.onResult = callback;
  }

  async close() {
    for (const db of this._debouncers.values()) {
      if (db.preview) clearTimeout(db.preview);
      if (db.final) clearTimeout(db.final);
    }

    for (const [, adapter] of this.adapters) {
      await adapter.close().catch(() => {});
    }
    this.adapters.clear();
    for (const ctrl of this._inflightControllers.values()) {
      ctrl.abort();
    }
    this._adapterInits.clear();
    this._inflightControllers.clear();
    this.charts.clear();
    this.selectionStore.clear();
    this.sourceRegistry.clear();
    this.cache.clear();
    this._debouncers.clear();
  }
}

/**
 * Called from the htmlwidget entry on first widget mount.
 * Returns the page-level singleton, creating it if needed.
 */
export function bootCoordinator(config) {
  if (!globalThis.__myioCoordinator) {
    globalThis.__myioCoordinator = new Coordinator({ config });
  }
  return globalThis.__myioCoordinator;
}

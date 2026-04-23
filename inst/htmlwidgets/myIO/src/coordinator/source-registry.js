// Source handle registry. The coordinator owns one SourceRegistry per page.
// Every `setBigData()`-attached source is registered here before any chart
// issues a query. Engine adapters read this registry at init() time and
// bind each source to the underlying engine (WASM registerFileBuffer,
// Shiny session lookup, etc.).
//
// Contract reference: md/design/large-dataset-virtualization-contract.md
//   §"Symbols (R + JS)" - SourceRegistry row; §"Widget payload shape" -
//   x.bigdata.source_id, x.bigdata.mode, x.bigdata.ipc_b64, x.bigdata.url,
//   x.bigdata.schema, x.bigdata.row_count, x.bigdata.rowkey_col.

/**
 * @typedef {Object} SourceEntry
 * @property {string} sourceId
 * @property {"none"|"inline_ipc"|"url"|"shiny_handle"|"dbi"} mode
 * @property {string|null} ipcB64
 * @property {string|null} url
 * @property {Array<{name:string,type:string}>} schema
 * @property {number} rowCount
 * @property {string} rowkeyCol
 */

export class SourceRegistry {
  constructor() {
    /** @type {Map<string, SourceEntry>} */
    this.sources = new Map();
  }

  register(entry) {
    if (!entry || typeof entry.sourceId !== "string") {
      throw new Error("SourceRegistry.register: entry must have sourceId");
    }
    if (entry.mode === "none") {
      // Charts with no big-data attachment still produce a sourceId but we
      // do not register them - keeps the registry only holding real sources.
      return;
    }
    this.sources.set(entry.sourceId, entry);
  }

  unregister(sourceId) {
    this.sources.delete(sourceId);
  }

  get(sourceId) {
    return this.sources.get(sourceId);
  }

  has(sourceId) {
    return this.sources.has(sourceId);
  }

  all() {
    return Array.from(this.sources.values());
  }

  clear() {
    this.sources.clear();
  }
}

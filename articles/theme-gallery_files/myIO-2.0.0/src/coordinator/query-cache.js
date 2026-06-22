// LRU query cache with in-flight promise deduplication.
// Keyed by (sql-hash + predicate-hash + engine-name). Consumers of the
// coordinator do not construct keys directly - QueryCache is internal.
//
// Contract reference: md/design/large-dataset-virtualization-contract.md
//   §"Symbols (R + JS)" - QueryCache row.

export class QueryCache {
  constructor({ max = 128 } = {}) {
    this.max = max;
    // Insertion-order Map; touched keys are deleted+re-inserted to become MRU.
    this.lru = new Map();
    // Keyed map of in-flight query promises for dedup.
    this.inflight = new Map();
  }

  /** @returns {unknown | undefined} */
  get(key) {
    if (!this.lru.has(key)) return undefined;
    const value = this.lru.get(key);
    // Re-insert to move to MRU position.
    this.lru.delete(key);
    this.lru.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.lru.has(key)) this.lru.delete(key);
    this.lru.set(key, value);
    while (this.lru.size > this.max) {
      // Oldest key is the first key in insertion order.
      const oldest = this.lru.keys().next().value;
      this.lru.delete(oldest);
    }
  }

  delete(key) {
    this.lru.delete(key);
  }

  clear() {
    this.lru.clear();
    this.inflight.clear();
  }

  size() {
    return this.lru.size;
  }

  /**
   * Dedup helper. If a promise is already in flight for this key, returns it.
   * Otherwise stores the provided promise under the key and returns it. The
   * coordinator must call resolveInflight / rejectInflight when the promise
   * settles so the key is freed.
   */
  inflightOrStore(key, promiseFactory) {
    if (this.inflight.has(key)) return this.inflight.get(key);
    const p = promiseFactory();
    this.inflight.set(key, p);
    return p;
  }

  resolveInflight(key, value) {
    this.set(key, value);
    this.inflight.delete(key);
  }

  rejectInflight(key) {
    this.inflight.delete(key);
  }
}

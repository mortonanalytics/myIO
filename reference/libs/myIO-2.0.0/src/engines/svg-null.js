// SvgNullAdapter: no-op implementation of the engine adapter interface.
// Returned by createEngine("svg") when the file-protocol override fires.
// query() yields an empty async iterator and the trailer with rowCount 0.
//
// Contract reference: §JS engine adapter interface. Error codes follow
// the contract's enum: cancelled | syntax | oom | engine-gone | timeout.

export class SvgNullAdapter {
  constructor(_config = {}) {
    // no state
  }

  async init(_opts = {}) { /* no-op */ }

  async cancel(_queryId) { /* no-op */ }

  async close() { /* no-op */ }

  async applyPredicateCache(_hash, _predicateSQL) { /* no-op */ }

  /**
   * Returns an async iterable that yields nothing but a trailer.
   * The contract specifies: AsyncIterable<ArrowBatch> plus trailing
   * {queryId, rowCount, elapsedMs}. Because this adapter is a no-op,
   * we yield only the trailer.
   */
  async *query({ queryId }) {
    yield { __trailer: true, queryId, rowCount: 0, elapsedMs: 0 };
  }
}

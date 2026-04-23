// CrosstalkAdapter: per-source bridge between myIO's predicate-based
// coordinator and crosstalk::SharedData's row-key broadcast model.
//
// Below a configured row-count threshold, the adapter round-trips selections
// as row-key sets so myIO charts interop with plotly / leaflet / reactable.
// Above the threshold, outgoing broadcasts are suppressed with a one-shot
// console info; myIO->myIO linking still works via the coordinator's
// internal predicate flow.
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   §Symbols (CrosstalkAdapter), §Row-key contract,
//   §"Crosstalk bridge is predicate-first with a small-data adapter".

export class CrosstalkAdapter {
  constructor({ coordinator, sourceId, group, rowkeyCol, threshold = 100000 }) {
    if (!coordinator) throw new Error("CrosstalkAdapter: coordinator is required");
    if (!sourceId) throw new Error("CrosstalkAdapter: sourceId is required");
    this.coordinator = coordinator;
    this.sourceId = sourceId;
    this.group = group || null;
    this.rowkeyCol = rowkeyCol || "__myio_rowkey__";
    this.threshold = Number(threshold) || 100000;
    this._selectionHandle = null;
    this._filterHandle = null;
    this._suppressedOnce = false;
    this._badgeEl = null;
    this._mode = "row-level"; // or "predicate-only"
  }

  /**
   * Attach to a crosstalk group. Expects window.crosstalk to be present
   * (htmlwidgets' crosstalk loader adds it when the widget ships with a
   * crosstalk shared dataset).
   */
  attach(group) {
    this.group = group || this.group;
    if (!this.group) return;
    if (typeof window === "undefined" || !window.crosstalk) return;
    const SelectionHandle = window.crosstalk.SelectionHandle;
    const FilterHandle = window.crosstalk.FilterHandle;
    if (!SelectionHandle) return;
    this._selectionHandle = new SelectionHandle(this.group);
    this._selectionHandle.on("change", (e) => this._onIncoming(e));
    if (FilterHandle) {
      this._filterHandle = new FilterHandle(this.group);
      this._filterHandle.on("change", (e) => this._onIncoming(e));
    }
  }

  /** Set the footer badge element (chart-provided). */
  setBadge(el) {
    this._badgeEl = el;
    this._renderBadge();
  }

  _renderBadge() {
    if (!this._badgeEl) return;
    this._badgeEl.textContent = "linked: " + this._mode;
  }

  /**
   * Incoming selection from a sibling widget. Convert row-keys to a
   * predicate and feed the coordinator.
   */
  _onIncoming(evt) {
    const keys = (evt && (evt.value || evt.keys)) || null;
    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      this.coordinator.setSelection({
        chartId: "__crosstalk__:" + this.sourceId,
        predicate: null
      });
      return;
    }
    // Build a predicate: "rowkey" IN (key1, key2, ...). Quote each key
    // as a SQL string literal with escapes.
    const quoted = keys.map(k => {
      if (k == null) return "NULL";
      const s = String(k).replace(/'/g, "''");
      return "'" + s + "'";
    });
    const col = "\"" + this.rowkeyCol.replace(/"/g, "\"\"") + "\"";
    const predicate = col + " IN (" + quoted.join(",") + ")";
    this.coordinator.setSelection({
      chartId: "__crosstalk__:" + this.sourceId,
      predicate
    });
  }

  /**
   * Outgoing selection triggered by a local myIO chart. Called by the
   * chart-type glue when the user brushes locally. Size-gates the row-key
   * broadcast per the contract: issue count(*) first, broadcast only if
   * <= threshold, else suppress + one-shot info.
   */
  async broadcast({ predicate }) {
    if (!this._selectionHandle) {
      // No crosstalk group attached - nothing to broadcast.
      return;
    }
    if (predicate == null) {
      // Clearing - no size gate needed.
      try { this._selectionHandle.set(null); } catch (_) {}
      return;
    }
    const countSql = this._countSql(predicate);
    const adapter = this.coordinator.adapters &&
                    this.coordinator.adapters.get(this.sourceId);
    if (!adapter) return;
    let count = 0;
    try {
      for await (const item of adapter.query({
        sql: countSql, params: [], queryId: "__xcount__" + Date.now()
      })) {
        if (!item || item.__trailer) continue;
        // Pull the first numeric value from the batch.
        const rows = item.rows || (item.batch && item.batch.toArray && item.batch.toArray()) || [];
        if (rows[0]) {
          count = Number(rows[0].n ?? rows[0][0] ?? rows[0]["count(*)"] ?? 0);
        }
      }
    } catch (err) {
      console.warn("[myIO crosstalk] count query failed:", err?.message || err);
      return;
    }
    if (count > this.threshold) {
      if (!this._suppressedOnce) {
        console.info(
          "myIO: selection above crosstalk_threshold (" + count + " > " +
          this.threshold + "); downstream row-indexed widgets will not " +
          "react to this selection. myIO-to-myIO linking still works."
        );
        this._suppressedOnce = true;
      }
      this._mode = "predicate-only";
      this._renderBadge();
      return;
    }
    // Under threshold - fetch rowkeys and broadcast.
    const keys = await this._fetchKeys(predicate);
    if (keys && keys.length > 0) {
      try { this._selectionHandle.set(keys); } catch (_) {}
    }
    this._mode = "row-level";
    this._renderBadge();
  }

  _countSql(predicate) {
    const src = "\"" + this.sourceId.replace(/"/g, "\"\"") + "\"";
    return "SELECT count(*) AS n FROM " + src + " WHERE " + predicate;
  }

  async _fetchKeys(predicate) {
    const adapter = this.coordinator.adapters &&
                    this.coordinator.adapters.get(this.sourceId);
    if (!adapter) return [];
    const src = "\"" + this.sourceId.replace(/"/g, "\"\"") + "\"";
    const col = "\"" + this.rowkeyCol.replace(/"/g, "\"\"") + "\"";
    const sql = "SELECT " + col + " AS rowkey FROM " + src + " WHERE " + predicate;
    const keys = [];
    try {
      for await (const item of adapter.query({
        sql, params: [], queryId: "__xkeys__" + Date.now()
      })) {
        if (!item || item.__trailer) continue;
        const rows = item.rows || (item.batch && item.batch.toArray && item.batch.toArray()) || [];
        for (const r of rows) {
          const k = r && (r.rowkey ?? r[0]);
          if (k != null) keys.push(String(k));
        }
      }
    } catch (err) {
      console.warn("[myIO crosstalk] key fetch failed:", err?.message || err);
    }
    return keys;
  }

  destroy() {
    try { if (this._selectionHandle) this._selectionHandle.close(); } catch (_) {}
    try { if (this._filterHandle) this._filterHandle.close(); } catch (_) {}
    this._selectionHandle = null;
    this._filterHandle = null;
  }
}

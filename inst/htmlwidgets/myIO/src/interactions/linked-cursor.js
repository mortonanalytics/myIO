/**
 * Cross-chart hover cursor sync.
 *
 * Registry keyed by link group. Charts register on mount when
 * config.interactions.linked.cursor === true, unregister on teardown.
 * Hover on any member chart emits a CursorEvent to every sibling in the
 * same group; receivers draw a synchronized crosshair using their own
 * x-scale to map the incoming xValue.
 *
 * @typedef {Object} CursorEvent
 * @property {string} sourceId
 * @property {string} group
 * @property {(string|number|null)} [keyValue]
 * @property {(number|string|Date)} xValue
 * @property {number} [yValue]
 * @property {({title: string, items: Array}|null)} [tooltip]
 * @property {number} ts
 * @property {boolean} [clear]
 */

export const _registry = new Map();

function linkedConfig(chart) {
  return chart && chart.config && chart.config.interactions && chart.config.interactions.linked;
}

function groupOf(chart) {
  var linked = linkedConfig(chart);
  return linked && linked.cursor === true && linked.group ? linked.group : null;
}

export function registerLinkedCursor(chart) {
  var g = groupOf(chart);
  if (!g) return;
  var set = _registry.get(g);
  if (!set) { set = new Set(); _registry.set(g, set); }
  set.add(chart);
  chart.runtime = chart.runtime || {};
  if (!chart.runtime._linkedCursor) {
    chart.runtime._linkedCursor = { lastTs: 0 };
  }
}

export function unregisterLinkedCursor(chart) {
  // Walk every bucket, not just the current group, to handle rebinds where
  // the group name changed between register and unregister.
  _registry.forEach(function(set, key) {
    if (set.delete(chart) && set.size === 0) {
      _registry.delete(key);
    }
  });
}

export function emitCursor(chart, payload) {
  var g = groupOf(chart);
  if (!g) return;
  var set = _registry.get(g);
  if (!set) return;
  set.forEach(function(sibling) {
    if (sibling === chart) return;
    _receive(sibling, payload);
  });
}

export function clearCursor(chart) {
  var g = groupOf(chart);
  if (!g) return;
  emitCursor(chart, {
    sourceId: chart.element && chart.element.id,
    group: g,
    ts: (typeof performance !== "undefined" ? performance.now() : Date.now()),
    clear: true
  });
}

/**
 * Convenience wrapper invoked from rollover.js hover tails. Builds and
 * emits a CursorEvent if the chart has cursor sync enabled; no-op otherwise.
 * Keeps the call-site in rollover.js to a single line.
 */
export function maybeEmitCursor(chart, row, xValue, tooltipPayload) {
  var linked = linkedConfig(chart);
  if (!linked || linked.cursor !== true) return;
  var keyColumn = linked.keyColumn;
  var keyValue = (row && keyColumn && row[keyColumn] !== undefined) ? row[keyColumn] : null;
  emitCursor(chart, {
    sourceId: chart.element && chart.element.id,
    group: linked.group,
    keyValue: keyValue,
    xValue: xValue,
    tooltip: tooltipPayload || null,
    ts: (typeof performance !== "undefined" ? performance.now() : Date.now())
  });
}

/**
 * Convenience wrapper for the mouseout path. Emits a clear event if cursor
 * sync is on; no-op otherwise.
 */
export function maybeClearCursor(chart) {
  var linked = linkedConfig(chart);
  if (!linked || linked.cursor !== true) return;
  clearCursor(chart);
}

export function _receive(chart, payload) {
  var rt = chart.runtime && chart.runtime._linkedCursor;
  if (!rt) return;
  if (typeof payload.ts === "number" && payload.ts < rt.lastTs) return;
  rt.lastTs = typeof payload.ts === "number" ? payload.ts : rt.lastTs;
  rt.lastPayload = payload;

  if (payload.clear) {
    removeCrosshair(chart);
    return;
  }

  var xPx = coerceXToPixel(chart, payload.xValue);
  if (xPx == null) {
    removeCrosshair(chart);
    return;
  }
  drawCrosshair(chart, xPx);
}

function coerceXToPixel(chart, xValue) {
  var xScale = chart.xScale;
  if (!xScale || typeof xScale !== "function") return null;

  // Continuous scale: check numeric domain; fall back gracefully for dates.
  if (typeof xScale.domain === "function" && typeof xScale.invert === "function") {
    var domain = xScale.domain();
    var lo = domain[0];
    var hi = domain[domain.length - 1];
    var coerced = xValue;
    if (lo instanceof Date && !(xValue instanceof Date)) {
      coerced = new Date(xValue);
    }
    var numeric = +coerced;
    if (!Number.isFinite(numeric)) return null;
    if (numeric < +lo || numeric > +hi) return null;
    var px = xScale(coerced);
    return Number.isFinite(px) ? px : null;
  }

  // Ordinal / band scale: domain must include the value.
  var ordDomain = typeof xScale.domain === "function" ? xScale.domain() : [];
  if (ordDomain.indexOf(xValue) === -1) return null;
  var opx = xScale(xValue);
  return Number.isFinite(opx) ? opx : null;
}

function drawCrosshair(chart, xPx) {
  if (!chart.svg || typeof chart.svg.select !== "function") return;
  var line = chart.svg.select("line.myIO-hover-rule");
  if (line.empty()) {
    line = chart.svg.append("line").attr("class", "myIO-hover-rule");
  }
  line
    .attr("x1", xPx)
    .attr("x2", xPx)
    .attr("y1", 0)
    .attr("y2", chart.height || 0)
    .style("display", null);
}

function removeCrosshair(chart) {
  if (!chart.svg || typeof chart.svg.select !== "function") return;
  chart.svg.select("line.myIO-hover-rule").remove();
}

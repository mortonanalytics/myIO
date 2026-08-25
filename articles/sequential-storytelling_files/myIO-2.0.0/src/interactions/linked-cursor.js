/**
 * Cross-chart hover cursor sync.
 *
 * Registry keyed by link group. Charts register on mount when
 * config.interactions.linked.cursor === true, unregister on teardown.
 * Hover on any member chart emits a CursorEvent to every sibling in the
 * same group; receivers draw a synchronized crosshair using their own
 * scales to map the incoming xValue and yValue. Which rules get drawn is
 * governed by linked.cursorAxis: "x" (default) is a vertical rule, "y" is a
 * horizontal rule, "xy" is both.
 *
 * @typedef {Object} CursorEvent
 * @property {string} sourceId
 * @property {string} group
 * @property {(string|number|null)} [keyValue]
 * @property {(number|string|Date)} xValue
 * @property {(number|string|null)} [yValue]
 * @property {({title: string, items: Array}|null)} [tooltip]
 * @property {number} ts
 * @property {boolean} [clear]
 */

export const _registry = new Map();

// The vertical rule keeps the bare myIO-hover-rule class it has always had, so
// axis "x" output is unchanged. The horizontal rule carries it too — callers
// and stylesheets selecting line.myIO-hover-rule pick up both — plus a
// -y suffix class so the two can be updated and removed independently.
const VERTICAL_SELECTOR = "line.myIO-hover-rule:not(.myIO-hover-rule-y)";
const HORIZONTAL_SELECTOR = "line.myIO-hover-rule-y";

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
 *
 * yValue is optional: layers with no meaningful y datum (calendar heatmap
 * cells, for instance) pass nothing and receivers on axis "y" draw nothing.
 */
export function maybeEmitCursor(chart, row, xValue, tooltipPayload, yValue) {
  var linked = linkedConfig(chart);
  if (!linked || linked.cursor !== true) return;
  var keyColumn = linked.keyColumn;
  var keyValue = (row && keyColumn && row[keyColumn] !== undefined) ? row[keyColumn] : null;
  emitCursor(chart, {
    sourceId: chart.element && chart.element.id,
    group: linked.group,
    keyValue: keyValue,
    xValue: xValue,
    yValue: yValue === undefined ? null : yValue,
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

  var linked = linkedConfig(chart);
  var axis = (linked && linked.cursorAxis) || "x";
  var drewX = false;
  var drewY = false;

  if (axis === "x" || axis === "xy") {
    var xPx = coerceXToPixel(chart, payload.xValue);
    if (xPx != null) {
      drawCrosshair(chart, xPx);
      drewX = true;
    }
  }

  if (axis === "y" || axis === "xy") {
    var yPx = coerceYToPixel(chart, payload.yValue);
    if (yPx != null) {
      drawHorizontalRule(chart, yPx);
      drewY = true;
    }
  }

  if (!drewX) removeRule(chart, VERTICAL_SELECTOR);
  if (!drewY) removeRule(chart, HORIZONTAL_SELECTOR);
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

function coerceYToPixel(chart, yValue) {
  var yScale = chart.yScale;
  if (yValue === undefined || yValue === null) return null;
  if (!yScale || typeof yScale !== "function") return null;

  // Continuous scale: reject values outside the domain. Unlike the x-scale
  // helper, compare against min/max — inverted y domains are routine.
  if (typeof yScale.domain === "function" && typeof yScale.invert === "function") {
    var domain = yScale.domain();
    var lo = domain[0];
    var hi = domain[domain.length - 1];
    var coerced = yValue;
    if (lo instanceof Date && !(yValue instanceof Date)) {
      coerced = new Date(yValue);
    }
    var numeric = +coerced;
    if (!Number.isFinite(numeric)) return null;
    if (numeric < Math.min(+lo, +hi) || numeric > Math.max(+lo, +hi)) return null;
    var px = yScale(coerced);
    return Number.isFinite(px) ? px : null;
  }

  // Ordinal / band scale: domain must include the value.
  var ordDomain = typeof yScale.domain === "function" ? yScale.domain() : [];
  if (ordDomain.indexOf(yValue) === -1) return null;
  var opx = yScale(yValue);
  return Number.isFinite(opx) ? opx : null;
}

function drawCrosshair(chart, xPx) {
  // Append to the translated plot-area group when present (production charts)
  // so xPx — which comes from chart.xScale, itself in plot-local coords —
  // lands inside the plot area. Fall back to chart.svg for synthetic fixtures
  // that don't build a plot group (e.g. unit-test mounts).
  var host = chart.plot || chart.svg;
  if (!host || typeof host.select !== "function") return;
  var line = host.select(VERTICAL_SELECTOR);
  if (line.empty()) {
    line = host.append("line").attr("class", "myIO-hover-rule");
  }
  var m = chart.margin || {};
  var innerH = (chart.height || 0) - ((+m.top || 0) + (+m.bottom || 0));
  line
    .attr("x1", xPx)
    .attr("x2", xPx)
    .attr("y1", 0)
    .attr("y2", innerH)
    .style("display", null);
}

function drawHorizontalRule(chart, yPx) {
  // Same plot-group-then-svg host resolution as drawCrosshair: yPx comes from
  // chart.yScale, which is also in plot-local coords.
  var host = chart.plot || chart.svg;
  if (!host || typeof host.select !== "function") return;
  var line = host.select(HORIZONTAL_SELECTOR);
  if (line.empty()) {
    line = host.append("line").attr("class", "myIO-hover-rule myIO-hover-rule-y");
  }
  var m = chart.margin || {};
  var innerW = (chart.width || 0) - ((+m.left || 0) + (+m.right || 0));
  line
    .attr("x1", 0)
    .attr("x2", innerW)
    .attr("y1", yPx)
    .attr("y2", yPx)
    .style("display", null);
}

function removeRule(chart, selector) {
  var host = chart.plot || chart.svg;
  if (!host || typeof host.select !== "function") return;
  host.selectAll(selector).remove();
}

function removeCrosshair(chart) {
  removeRule(chart, VERTICAL_SELECTOR);
  removeRule(chart, HORIZONTAL_SELECTOR);
}

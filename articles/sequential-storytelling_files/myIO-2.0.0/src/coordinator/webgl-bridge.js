const WEBGL_KINDS = new Set(["scatter", "line", "area"]);
const RESIZE_DEBOUNCE_MS = 150;

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeWebGLThreshold(value) {
  if (value === "Inf" || value === "Infinity" || value === Infinity) {
    return Infinity;
  }
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : 50000;
}

export function isWebGLEligible({ markSpec, rowCount, threshold }) {
  const kind = markSpec && markSpec.kind;
  if (!WEBGL_KINDS.has(kind)) return false;
  const cutoff = normalizeWebGLThreshold(threshold);
  if (!Number.isFinite(cutoff)) return false;
  const count = Number(rowCount);
  return Number.isFinite(count) && count >= cutoff;
}

function rowFromArrowLike(table, i) {
  const row = {};
  ["x", "y", "category", "color", "value", "baseline"].forEach((name) => {
    const col = table.getChild ? table.getChild(name) : null;
    if (col) row[name] = col.get(i);
  });
  return row;
}

function rowsFromArrowLike(table) {
  if (!table) return [];
  if (typeof table.toArray === "function") {
    return table.toArray().map((row) => Object.assign({}, row));
  }
  if (typeof table.getChild === "function") {
    const xCol = table.getChild("x");
    const len = table.numRows || table.length || (xCol ? xCol.length : 0);
    const rows = new Array(len);
    for (let i = 0; i < len; i++) rows[i] = rowFromArrowLike(table, i);
    return rows;
  }
  return [];
}

export function normalizeCoordinatorBatches(batches) {
  const rows = [];
  (batches || []).forEach((item) => {
    if (!item) return;
    if (Array.isArray(item)) {
      rows.push(...item);
    } else if (Array.isArray(item.rows)) {
      rows.push(...item.rows);
    } else if (item.batch) {
      rows.push(...rowsFromArrowLike(item.batch));
    } else if (typeof item.getChild === "function" || typeof item.toArray === "function") {
      rows.push(...rowsFromArrowLike(item));
    }
  });
  return rows.map((row) => ({
    ...row,
    x: toFiniteNumber(row.x),
    y: toFiniteNumber(row.y),
    category: row.category == null ? undefined : toFiniteNumber(row.category),
    color: row.color == null ? undefined : row.color,
    value: row.value == null ? undefined : toFiniteNumber(row.value),
    baseline: row.baseline == null ? undefined : toFiniteNumber(row.baseline)
  })).filter((row) => row.x != null && row.y != null);
}

function plotRect(chart) {
  const margin = chart.margin || (chart.config && chart.config.layout && chart.config.layout.margin) ||
    { top: 0, right: 0, bottom: 0, left: 0 };
  const width = Math.max(0, (chart.width || chart.runtime?.width || 0) - margin.left - margin.right);
  const height = Math.max(0, (chart.height || chart.runtime?.height || 0) - margin.top - margin.bottom);
  return { left: margin.left, top: margin.top, width, height };
}

function createOverlay(chart) {
  const element = chart.dom?.element || chart.element;
  const svgNode = chart.dom?.svg?.node ? chart.dom.svg.node() : element.querySelector("svg");
  const overlay = document.createElement("div");
  overlay.className = "myIO-webgl-overlay";
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  overlay.style.overflow = "hidden";
  overlay.style.zIndex = "0";

  const loading = document.createElement("div");
  loading.className = "myIO-webgl-loading";
  loading.textContent = "Loading data...";
  loading.style.position = "absolute";
  loading.style.left = "50%";
  loading.style.top = "50%";
  loading.style.transform = "translate(-50%, -50%)";
  loading.style.font = "12px sans-serif";
  loading.style.color = "#666";
  loading.style.background = "rgba(255,255,255,0.85)";
  loading.style.padding = "6px 8px";
  loading.style.border = "1px solid rgba(0,0,0,0.12)";
  overlay.appendChild(loading);

  if (svgNode && svgNode.parentNode === element) {
    element.insertBefore(overlay, svgNode);
  } else {
    element.appendChild(overlay);
  }
  syncOverlayGeometry(chart, overlay);
  return overlay;
}

function syncOverlayGeometry(chart, overlay) {
  const rect = plotRect(chart);
  overlay.style.left = rect.left + "px";
  overlay.style.top = rect.top + "px";
  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
  return rect;
}

function emitChartEvent(chart, event, payload) {
  if (chart && typeof chart.emit === "function") {
    chart.emit(event, payload);
  }
}

function setMessage(overlay, className, text) {
  const current = overlay.querySelector(".myIO-webgl-loading,.myIO-webgl-empty");
  if (!text) {
    if (current) current.remove();
    return;
  }
  const node = current || document.createElement("div");
  node.className = className;
  node.textContent = text;
  node.style.position = "absolute";
  node.style.left = "50%";
  node.style.top = "50%";
  node.style.transform = "translate(-50%, -50%)";
  node.style.font = "12px sans-serif";
  node.style.color = "#666";
  node.style.background = "rgba(255,255,255,0.85)";
  node.style.padding = "6px 8px";
  node.style.border = "1px solid rgba(0,0,0,0.12)";
  if (!node.parentNode) overlay.appendChild(node);
}

function mapColorCategories(rows, colorLookup) {
  return rows.map((row) => {
    if (row.category != null || row.color == null) return row;
    const key = String(row.color);
    if (!colorLookup.has(key)) colorLookup.set(key, colorLookup.size);
    return { ...row, category: colorLookup.get(key) };
  });
}

function makeNearestIndex(chart, rows) {
  const xScale = chart.xScale;
  const yScale = chart.yScale;
  if (typeof xScale !== "function" || typeof yScale !== "function") {
    return null;
  }
  const d3 = globalThis.window && window.d3;
  if (d3 && typeof d3.quadtree === "function") {
    return d3.quadtree()
      .x((d) => d.__px)
      .y((d) => d.__py)
      .addAll(rows.map((row) => ({ row, __px: xScale(row.x), __py: yScale(row.y) })));
  }
  return rows.map((row) => ({ row, __px: xScale(row.x), __py: yScale(row.y) }));
}

function findNearest(index, x, y) {
  if (!index) return null;
  if (typeof index.find === "function") return index.find(x, y, 16)?.row || null;
  let best = null;
  let bestDist = Infinity;
  index.forEach((entry) => {
    const dist = Math.hypot(entry.__px - x, entry.__py - y);
    if (dist < bestDist) {
      bestDist = dist;
      best = entry.row;
    }
  });
  return bestDist <= 16 ? best : null;
}

function installHoverBridge(chart, getRows) {
  const svg = chart.dom?.svg?.node ? chart.dom.svg.node() : chart.element?.querySelector("svg");
  if (!svg) {
    return {
      rebuild() {},
      destroy() {}
    };
  }
  let index = null;
  let scheduled = false;
  let lastEvent = null;

  function rebuild() {
    index = makeNearestIndex(chart, getRows());
  }

  function onMove(event) {
    lastEvent = event;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      if (!index) rebuild();
      const rect = svg.getBoundingClientRect();
      const nearest = findNearest(index, lastEvent.clientX - rect.left, lastEvent.clientY - rect.top);
      if (nearest) emitChartEvent(chart, "rollover", { data: nearest, source: "webgl-bridge" });
    });
  }

  svg.addEventListener("mousemove", onMove);
  return {
    rebuild,
    destroy() {
      svg.removeEventListener("mousemove", onMove);
    }
  };
}

export function installWebGLBridge({
  chart,
  coordinator,
  chartId,
  markSpec,
  createRenderer,
  layerIndex = 0
}) {
  const overlay = createOverlay(chart);
  const fallback = installSVGCoordinatorPath({ chart, layerIndex });
  const rendererFactory = createRenderer ||
    (globalThis.window && window.myIO && window.myIO.webglRenderers &&
      window.myIO.webglRenderers.createWebGLRenderer);
  const colorLookup = new Map();
  let renderer = null;
  let lastRows = [];
  let lastPayload = null;
  let destroyed = false;
  let fallbackActive = false;
  let resizeTimer = null;
  const hover = installHoverBridge(chart, () => lastRows);

  function activateFallback(reason, err) {
    if (fallbackActive || destroyed) return;
    fallbackActive = true;
    console.warn("[myIO webgl bridge] falling back to SVG:", reason, err || "");
    if (renderer && typeof renderer.destroy === "function") {
      try { renderer.destroy(); } catch (_) {}
    }
    renderer = null;
    overlay.remove();
    if (lastPayload) fallback.onResult(lastPayload);
  }

  function ensureRenderer() {
    if (renderer || destroyed || fallbackActive) return renderer;
    if (typeof rendererFactory !== "function") {
      activateFallback("renderer unavailable");
      return null;
    }
    const rect = syncOverlayGeometry(chart, overlay);
    try {
      renderer = rendererFactory({
        kind: markSpec.kind,
        el: overlay,
        width: rect.width,
        height: rect.height,
        xScale: chart.xScale,
        yScale: chart.yScale
      });
    } catch (err) {
      activateFallback("renderer creation failed", err);
      return null;
    }
    const canvas = overlay.querySelector("canvas");
    if (!renderer) {
      activateFallback("renderer unavailable");
      return null;
    }
    if (canvas) {
      let context = null;
      try {
        context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      } catch (_) {
        context = null;
      }
      if (!context) {
        activateFallback("WebGL context unavailable");
        return null;
      }
      canvas.addEventListener("webglcontextlost", (event) => {
        event.preventDefault();
        activateFallback("WebGL context lost");
      }, { once: true });
    }
    return renderer;
  }

  function handleTrailerError(payload) {
    const trailer = payload && payload.trailer;
    const error = trailer && (trailer.error || trailer.message);
    if (!error) return false;
    if (renderer && typeof renderer.update === "function") {
      Promise.resolve(renderer.update([])).catch(() => {});
    }
    emitChartEvent(chart, "error", {
      message: String(error),
      trailer,
      chartId
    });
    return true;
  }

  function onResult(payload) {
    if (destroyed) return;
    lastPayload = payload;
    if (fallbackActive) {
      fallback.onResult(payload);
      return;
    }
    if (handleTrailerError(payload)) return;
    lastRows = mapColorCategories(
      normalizeCoordinatorBatches(payload && payload.batches),
      colorLookup
    );
    hover.rebuild();
    const active = ensureRenderer();
    if (!active || typeof active.update !== "function") return;
    setMessage(overlay, lastRows.length ? null : "myIO-webgl-empty", lastRows.length ? "" : "No data in selection");
    if (!lastRows.length) emitChartEvent(chart, "emptySelection", { chartId });
    Promise.resolve(active.update(lastRows)).catch((err) => {
      activateFallback("render failed", err);
    });
  }

  function applyResize() {
    if (destroyed || fallbackActive) return;
    const rect = syncOverlayGeometry(chart, overlay);
    if (renderer && typeof renderer.resize === "function") {
      renderer.resize(rect.width, rect.height);
    }
    if (renderer && typeof renderer.update === "function") {
      Promise.resolve(renderer.update(lastRows)).catch((err) => {
        activateFallback("resize render failed", err);
      });
    }
  }

  function resize() {
    if (destroyed) return;
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applyResize, RESIZE_DEBOUNCE_MS);
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    if (resizeTimer) clearTimeout(resizeTimer);
    if (coordinator && typeof coordinator.onChartResult === "function") {
      coordinator.onChartResult(chartId, null);
    }
    hover.destroy();
    fallback.destroy();
    if (renderer && typeof renderer.destroy === "function") {
      renderer.destroy();
    }
    overlay.remove();
  }

  if (chart && typeof chart.on === "function") {
    chart.on("resize", resize);
    chart.on("destroy", destroy);
  }

  return {
    onResult,
    resize,
    destroy,
    get pointCount() {
      return lastRows.length;
    },
    get overlay() {
      return fallbackActive ? undefined : overlay;
    },
    get fallbackActive() {
      return fallbackActive;
    }
  };
}

export function installSVGCoordinatorPath({ chart, layerIndex = 0 }) {
  let lastRows = [];
  let destroyed = false;

  function onResult(payload) {
    if (destroyed) return;
    const trailer = payload && payload.trailer;
    const error = trailer && (trailer.error || trailer.message);
    if (error) {
      emitChartEvent(chart, "error", { message: String(error), trailer });
      return;
    }
    lastRows = normalizeCoordinatorBatches(payload && payload.batches);
    if (chart.config && chart.config.layers && chart.config.layers[layerIndex]) {
      chart.config.layers[layerIndex].data = lastRows;
    }
    if (!lastRows.length) emitChartEvent(chart, "emptySelection", {});
    if (typeof chart.renderCurrentLayers === "function") {
      chart.renderCurrentLayers();
    }
  }

  function destroy() {
    destroyed = true;
  }

  if (chart && typeof chart.on === "function") {
    chart.on("destroy", destroy);
  }

  return {
    onResult,
    destroy,
    get pointCount() {
      return lastRows.length;
    }
  };
}

export function createCoordinatorResultHandler(opts) {
  if (isWebGLEligible(opts)) {
    return installWebGLBridge(opts);
  }
  if (opts && opts.unifyDataPath) {
    return installSVGCoordinatorPath(opts);
  }
  return null;
}

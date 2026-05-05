import { describe, expect, test, vi } from "vitest";
import {
  createCoordinatorResultHandler,
  installSVGCoordinatorPath,
  installWebGLBridge,
  isWebGLEligible,
  normalizeCoordinatorBatches,
  normalizeWebGLThreshold
} from "../../inst/htmlwidgets/myIO/src/coordinator/webgl-bridge.js";

function makeVector(values) {
  return {
    length: values.length,
    get(i) {
      return values[i];
    }
  };
}

function makeArrowBatch(rows) {
  const cols = {};
  ["x", "y", "baseline", "category", "color"].forEach((name) => {
    cols[name] = makeVector(rows.map((row) => row[name]));
  });
  return {
    numRows: rows.length,
    getChild(name) {
      return cols[name] || null;
    }
  };
}

function makeChart() {
  document.body.innerHTML = '<div id="chart"></div>';
  const element = document.getElementById("chart");
  element.style.position = "relative";
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  element.appendChild(svg);
  const listeners = {};
  const chart = {
    dom: {
      element,
      svg: { node: () => svg }
    },
    element,
    margin: { top: 20, right: 10, bottom: 30, left: 40 },
    width: 800,
    height: 600,
    xScale: { domain: () => [0, 1], range: () => [0, 730] },
    yScale: { domain: () => [0, 1], range: () => [550, 0] },
    config: { layers: [{ data: [] }] },
    on(event, handler) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    },
    emit(event, payload) {
      (listeners[event] || []).forEach((handler) => handler(payload));
    },
    renderCurrentLayers: vi.fn()
  };
  return chart;
}

describe("webgl bridge", () => {
  test("normalizes supported batch shapes and empty results", () => {
    const rows = normalizeCoordinatorBatches([
      { rows: [{ x: 1, y: 2 }] },
      [{ x: 3, y: 4 }],
      { batch: makeArrowBatch([{ x: 5, y: 6, baseline: 1, color: "a" }]) }
    ]);
    expect(rows).toEqual([
      { x: 1, y: 2, category: undefined, color: undefined, value: undefined, baseline: undefined },
      { x: 3, y: 4, category: undefined, color: undefined, value: undefined, baseline: undefined },
      { x: 5, y: 6, category: undefined, color: "a", value: undefined, baseline: 1 }
    ]);
    expect(normalizeCoordinatorBatches([])).toEqual([]);
  });

  test("applies WebGL threshold and Inf sentinel", () => {
    expect(normalizeWebGLThreshold("Inf")).toBe(Infinity);
    expect(isWebGLEligible({
      markSpec: { kind: "scatter" },
      rowCount: 100000,
      threshold: 50000
    })).toBe(true);
    expect(isWebGLEligible({
      markSpec: { kind: "scatter" },
      rowCount: 100000,
      threshold: "Inf"
    })).toBe(false);
    expect(isWebGLEligible({
      markSpec: { kind: "bar" },
      rowCount: 100000,
      threshold: 50000
    })).toBe(false);
  });

  test("installs WebGL overlay, updates once per delivery, resizes, and tears down", async () => {
    vi.useFakeTimers();
    const chart = makeChart();
    const update = vi.fn();
    const resize = vi.fn();
    const destroy = vi.fn();
    const coordinator = { onChartResult: vi.fn() };
    const bridge = installWebGLBridge({
      chart,
      coordinator,
      chartId: "c1",
      markSpec: { kind: "scatter" },
      createRenderer: vi.fn(({ el }) => {
        const canvas = document.createElement("canvas");
        canvas.getContext = vi.fn(() => ({}));
        el.appendChild(canvas);
        return { update, resize, destroy };
      })
    });

    bridge.onResult({ batches: [
      { rows: [{ x: 1, y: 2, color: "a" }] },
      { rows: [{ x: 3, y: 4, color: "b" }] },
      { rows: [{ x: 5, y: 6, color: "a" }] }
    ] });
    await Promise.resolve();
    expect(chart.element.querySelectorAll(".myIO-webgl-overlay")).toHaveLength(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith([
      { x: 1, y: 2, category: 0, color: "a", value: undefined, baseline: undefined },
      { x: 3, y: 4, category: 1, color: "b", value: undefined, baseline: undefined },
      { x: 5, y: 6, category: 0, color: "a", value: undefined, baseline: undefined }
    ]);

    chart.width = 1000;
    chart.height = 700;
    chart.emit("resize", {});
    expect(resize).not.toHaveBeenCalled();
    vi.advanceTimersByTime(150);
    await Promise.resolve();
    expect(resize).toHaveBeenCalledWith(950, 650);
    expect(update).toHaveBeenCalledTimes(2);

    bridge.destroy();
    bridge.destroy();
    expect(destroy).toHaveBeenCalledTimes(1);
    expect(coordinator.onChartResult).toHaveBeenCalledWith("c1", null);
    expect(chart.element.querySelectorAll(".myIO-webgl-overlay")).toHaveLength(0);
    vi.useRealTimers();
  });

  test("SVG coordinator path replaces layer data and rerenders", () => {
    const chart = makeChart();
    const path = installSVGCoordinatorPath({ chart, layerIndex: 0 });
    path.onResult({ batches: [{ rows: [{ x: 10, y: 20 }] }] });
    expect(chart.config.layers[0].data).toEqual([
      { x: 10, y: 20, category: undefined, color: undefined, value: undefined, baseline: undefined }
    ]);
    expect(chart.renderCurrentLayers).toHaveBeenCalledTimes(1);
  });

  test("factory selects WebGL above threshold and opt-in SVG below threshold", () => {
    const chart = makeChart();
    const webgl = createCoordinatorResultHandler({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "line" },
      rowCount: 60000,
      threshold: 50000,
      createRenderer: ({ el }) => {
        const canvas = document.createElement("canvas");
        canvas.getContext = vi.fn(() => ({}));
        el.appendChild(canvas);
        return { update() {}, resize() {}, destroy() {} };
      }
    });
    expect(webgl.overlay).toBeTruthy();
    webgl.destroy();

    const skipped = createCoordinatorResultHandler({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "line" },
      rowCount: 100,
      threshold: 50000
    });
    expect(skipped).toBeNull();

    const svg = createCoordinatorResultHandler({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "line" },
      rowCount: 100,
      threshold: 50000,
      unifyDataPath: true
    });
    expect(svg.overlay).toBeUndefined();
  });

  test("falls back to SVG when WebGL context creation fails", async () => {
    const chart = makeChart();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const bridge = installWebGLBridge({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "scatter" },
      createRenderer: ({ el }) => {
        const canvas = document.createElement("canvas");
        canvas.getContext = vi.fn(() => null);
        el.appendChild(canvas);
        return { update: vi.fn(), destroy: vi.fn() };
      }
    });

    bridge.onResult({ batches: [{ rows: [{ x: 1, y: 2 }] }] });
    await Promise.resolve();
    expect(bridge.fallbackActive).toBe(true);
    expect(chart.config.layers[0].data).toHaveLength(1);
    expect(chart.renderCurrentLayers).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  test("allows renderers that create their canvas lazily during update", async () => {
    const chart = makeChart();
    const bridge = installWebGLBridge({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "scatter" },
      createRenderer: ({ el }) => ({
        update: vi.fn(() => {
          const canvas = document.createElement("canvas");
          canvas.getContext = vi.fn(() => ({}));
          el.appendChild(canvas);
        }),
        destroy() {}
      })
    });

    bridge.onResult({ batches: [{ rows: [{ x: 1, y: 2 }] }] });
    await Promise.resolve();
    expect(bridge.fallbackActive).toBe(false);
    expect(chart.element.querySelectorAll("canvas")).toHaveLength(1);
  });

  test("handles trailer errors and empty selections", async () => {
    const chart = makeChart();
    const errors = [];
    const empties = [];
    chart.on("error", (evt) => errors.push(evt));
    chart.on("emptySelection", (evt) => empties.push(evt));
    const update = vi.fn();
    const createRenderer = vi.fn(({ el }) => {
      const canvas = document.createElement("canvas");
      canvas.getContext = vi.fn(() => ({}));
      el.appendChild(canvas);
      return { update, destroy() {} };
    });
    const bridge = installWebGLBridge({
      chart,
      coordinator: {},
      chartId: "c1",
      markSpec: { kind: "scatter" },
      createRenderer
    });

    bridge.onResult({ batches: [], trailer: { error: "query failed" } });
    await Promise.resolve();
    expect(errors[0].message).toBe("query failed");
    expect(createRenderer).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();

    bridge.onResult({ batches: [] });
    await Promise.resolve();
    expect(empties).toHaveLength(1);
    expect(update).toHaveBeenLastCalledWith([]);
  });
});

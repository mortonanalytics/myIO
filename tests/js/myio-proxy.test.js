import * as d3 from "d3";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { myIOchart } from "../../inst/htmlwidgets/myIO/src/Chart.js";
import { registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

globalThis.d3 = d3;
globalThis.HTMLWidgets = { shinyMode: false };

function pointLayer(data) {
  return {
    id: "layer_001", type: "point", label: "pts", data: data,
    mapping: { x_var: "x", y_var: "y" }, options: { barSize: "large" },
    transform: "identity", transformMeta: {}, encoding: {}, sourceKey: "_source_key",
    derivedFrom: null, order: 1, visibility: true, color: "#4E79A7"
  };
}

function makeChart(data) {
  return new myIOchart({
    element: document.getElementById("chart"),
    width: 600, height: 400,
    config: {
      specVersion: 1, layers: [pointLayer(data)],
      layout: { margin: { top: 30, bottom: 60, left: 50, right: 5 }, suppressLegend: false, suppressAxis: { xAxis: false, yAxis: false } },
      scales: { xlim: { min: 0, max: 10 }, ylim: { min: 0, max: 100 }, categoricalScale: { xAxis: false, yAxis: false }, flipAxis: false, colorScheme: { colors: ["#4E79A7"], domain: ["none"], enabled: false } },
      axes: { xAxisFormat: "s", yAxisFormat: "s", xAxisLabel: null, yAxisLabel: null, toolTipFormat: "s" },
      interactions: { dragPoints: false, toggleY: { variable: null, format: null }, toolTipOptions: { suppressY: false } },
      theme: {}, transitions: { speed: 0 }, referenceLines: { x: null, y: null }
    }
  });
}

describe("Chart.updateData (myIOProxy partial update)", () => {
  beforeEach(() => {
    document.body.innerHTML = "<div id='chart'></div>";
    registerBuiltInRenderers();
  });

  // Real DOM re-render is asserted in Playwright (transition.spec.ts-style) since
  // jsdom lacks SVG transform.baseVal for d3's axis-update interpolation. Here we
  // pin the data-swap contract by spying on the re-render call.
  test("swaps an existing layer's data and triggers a re-render (not a destroy)", () => {
    const chart = makeChart([{ x: 1, y: 10 }, { x: 2, y: 20 }]);
    chart.renderCurrentLayers = vi.fn();
    chart.updateData([{ label: "pts", data: [{ x: 1, y: 10 }, { x: 2, y: 20 }, { x: 3, y: 30 }] }]);
    expect(chart.config.layers[0].data.length).toBe(3);
    expect(chart.renderCurrentLayers).toHaveBeenCalledTimes(1);
  });

  test("ignores unknown labels and malformed input", () => {
    const chart = makeChart([{ x: 1, y: 10 }]);
    chart.renderCurrentLayers = vi.fn();
    expect(() => chart.updateData([{ label: "nope", data: [{ x: 9, y: 9 }] }])).not.toThrow();
    expect(chart.config.layers[0].data.length).toBe(1);
    expect(() => chart.updateData(null)).not.toThrow();
    expect(() => chart.updateData([{ label: "pts", data: "bad" }])).not.toThrow();
    expect(chart.config.layers[0].data.length).toBe(1);
  });

  test("does not reset visibility (preserves legend-toggled subset)", () => {
    const chart = makeChart([{ x: 1, y: 10 }]);
    chart.renderCurrentLayers = vi.fn();
    // Simulate a legend toggle leaving an empty visible subset.
    chart.derived.currentLayers = [];
    chart.updateData([{ label: "pts", data: [{ x: 1, y: 10 }, { x: 2, y: 20 }] }]);
    expect(chart.derived.currentLayers).toEqual([]); // not reset to all layers
    expect(chart.config.layers[0].data.length).toBe(2); // data still swapped
  });

  test("does not pollute Object.prototype via a __proto__ label", () => {
    const chart = makeChart([{ x: 1, y: 10 }]);
    chart.renderCurrentLayers = vi.fn();
    chart.updateData([{ label: "__proto__", data: [{ x: 9, y: 9 }] }]);
    expect(({}).data).toBeUndefined();
    expect(chart.config.layers[0].data.length).toBe(1);
  });
});

describe("proxy message handler wiring", () => {
  test("installProxyHandler routes myio:proxy-update to the registered chart", async () => {
    const handlers = {};
    window.Shiny = {
      addCustomMessageHandler: (name, fn) => { handlers[name] = fn; }
    };
    delete window.myIO; // fresh namespace for this test
    vi.resetModules();  // force index.js top-level to re-run and re-populate window.myIO
    await import("../../inst/htmlwidgets/myIO/src/index.js");

    window.myIO.installProxyHandler();
    expect(typeof handlers["myio:proxy-update"]).toBe("function");
    expect(typeof handlers["myio:keyframe-control"]).toBe("function");

    const fakeChart = { config: {}, updateData: vi.fn() };
    window.myIO.registerInstance("chartA", fakeChart);

    const payload = { id: "chartA", layers: [{ label: "pts", data: [{ x: 1, y: 2 }] }] };
    handlers["myio:proxy-update"](payload);
    expect(fakeChart.updateData).toHaveBeenCalledWith(payload.layers);

    fakeChart.config.keyframes = [
      { label: "Start", layers: payload.layers },
      { label: "End", layers: payload.layers }
    ];
    fakeChart.runtime = {};
    handlers["myio:keyframe-control"]({
      id: "chartA", action: "select", frame: "End"
    });
    expect(fakeChart.updateData).toHaveBeenLastCalledWith(payload.layers);

    // unknown id is a no-op
    expect(() => handlers["myio:proxy-update"]({ id: "missing", layers: [] })).not.toThrow();

    // a __proto__ id must not resolve to Object.prototype
    expect(() => handlers["myio:proxy-update"]({ id: "__proto__", layers: [] })).not.toThrow();

    // a destroyed chart (config nulled) is lazily reaped, not called
    const deadChart = { config: null, updateData: vi.fn() };
    window.myIO.registerInstance("chartDead", deadChart);
    handlers["myio:proxy-update"]({ id: "chartDead", layers: [] });
    expect(deadChart.updateData).not.toHaveBeenCalled();
    expect(window.myIO._instances["chartDead"]).toBeUndefined();

    // unregister removes it
    window.myIO.unregisterInstance("chartA");
    expect(window.myIO._instances["chartA"]).toBeUndefined();
  });
});

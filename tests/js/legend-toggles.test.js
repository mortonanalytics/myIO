import { describe, expect, test, vi } from "vitest";
import {
  resetLegendVisibility,
  toggleLayerVisibility,
  toggleOrdinalSegment
} from "../../inst/htmlwidgets/myIO/src/interactions/legend-toggles.js";

function buildOrdinalChart() {
  const chart = {
    runtime: { _hiddenOrdinalSegments: [] },
    currentLayers: [{ label: "segments", type: "donut" }],
    routeLayers: vi.fn()
  };
  return chart;
}

describe("toggleOrdinalSegment", function() {
  test("adds then removes the segment key on successive calls", function() {
    const chart = buildOrdinalChart();

    toggleOrdinalSegment(chart, { key: "A" });
    expect(chart.runtime._hiddenOrdinalSegments).toEqual(["A"]);

    toggleOrdinalSegment(chart, { key: "B" });
    expect(chart.runtime._hiddenOrdinalSegments).toEqual(["A", "B"]);

    toggleOrdinalSegment(chart, { key: "A" });
    expect(chart.runtime._hiddenOrdinalSegments).toEqual(["B"]);
  });

  test("reroutes layers with the rebuild suppression flag set during the call", function() {
    const chart = buildOrdinalChart();
    let flagDuringRoute = null;
    chart.routeLayers = vi.fn(function() {
      flagDuringRoute = chart.runtime._suppressOrdinalLegendRebuild;
    });

    toggleOrdinalSegment(chart, { key: "A" });

    expect(chart.routeLayers).toHaveBeenCalledWith(chart.currentLayers);
    expect(flagDuringRoute).toBe(true);
    expect(chart.runtime._suppressOrdinalLegendRebuild).toBe(false);
  });

  test("fires onToggled after rerouting; tolerates its absence", function() {
    const chart = buildOrdinalChart();
    const onToggled = vi.fn();

    toggleOrdinalSegment(chart, { key: "A" }, onToggled);
    expect(onToggled).toHaveBeenCalledWith(chart);

    // No callback: must not throw (inline and sheet callers differ here).
    expect(function() { toggleOrdinalSegment(chart, { key: "B" }); }).not.toThrow();
  });
});

describe("toggleLayerVisibility", function() {
  test("hides then reshows a layer and re-renders", function() {
    const layers = [
      { label: "alpha", type: "line" },
      { label: "beta", type: "line" }
    ];
    const chart = {
      runtime: {},
      plotLayers: layers,
      derived: {},
      syncLegacyAliases: vi.fn(),
      renderCurrentLayers: vi.fn()
    };

    toggleLayerVisibility(chart, { key: "beta" });
    expect(chart.runtime._hiddenLayerKeys).toEqual(["beta"]);
    expect(chart.derived.currentLayers.map(function(l) { return l.label; })).toEqual(["alpha"]);

    toggleLayerVisibility(chart, { key: "beta" });
    expect(chart.runtime._hiddenLayerKeys).toEqual([]);
    expect(chart.derived.currentLayers).toHaveLength(2);
    expect(chart.renderCurrentLayers).toHaveBeenCalledTimes(2);
  });
});

describe("resetLegendVisibility (ordinal path with callback)", function() {
  test("clears hidden segments and fires onToggled", function() {
    const chart = buildOrdinalChart();
    chart.runtime._hiddenOrdinalSegments = ["A", "B"];
    const onToggled = vi.fn();

    resetLegendVisibility(chart, "ordinal", onToggled);

    expect(chart.runtime._hiddenOrdinalSegments).toEqual([]);
    expect(chart.routeLayers).toHaveBeenCalled();
    expect(onToggled).toHaveBeenCalledWith(chart);
  });
});

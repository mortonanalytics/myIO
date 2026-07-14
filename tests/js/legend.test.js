import * as d3 from "d3";
import { describe, expect, test, vi } from "vitest";
import { resetLegendVisibility } from "../../inst/htmlwidgets/myIO/src/interactions/bottom-sheet.js";
import { syncLegend, syncOrdinalLegendData } from "../../inst/htmlwidgets/myIO/src/layout/legend.js";

globalThis.d3 = d3;

describe("legend data sync", function() {
  test("syncLegend stores layer legend data on runtime", function() {
    const chart = {
      options: { suppressLegend: false },
      runtime: {},
      plotLayers: [
        { label: "alpha", color: "#E69F00", type: "line" },
        { label: "beta", color: "#56B4E9", type: "line" }
      ],
      currentLayers: [
        { label: "alpha", color: "#E69F00", type: "line" }
      ],
      derived: {
        currentLayers: [
          { label: "alpha", color: "#E69F00", type: "line" }
        ]
      }
    };

    syncLegend(chart, { axesChart: true });

    expect(chart.runtime._legendState).toEqual({ axesChart: true });
    expect(chart.runtime._legendData.type).toBe("layer");
    expect(chart.runtime._legendData.items).toHaveLength(2);
    expect(chart.runtime._legendData.items[0].visible).toBe(true);
    expect(chart.runtime._legendData.items[1].visible).toBe(false);
  });

  test("syncOrdinalLegendData stores ordinal legend data on runtime", function() {
    const chart = {
      runtime: {},
      colorDiscrete: d3.scaleOrdinal().domain(["A", "B"]).range(["#E69F00", "#56B4E9"]),
      plotLayers: [
        {
          label: "segments",
          type: "donut",
          mapping: { x_var: "name" },
          data: [
            { name: "A", value: 1 },
            { name: "B", value: 2 }
          ]
        }
      ],
      currentLayers: [
        {
          label: "segments",
          type: "donut",
          mapping: { x_var: "name" },
          data: [
            { name: "A", value: 1 },
            { name: "B", value: 2 }
          ]
        }
      ],
      derived: {
        currentLayers: [
          {
            label: "segments",
            type: "donut",
            mapping: { x_var: "name" },
            data: [
              { name: "A", value: 1 },
              { name: "B", value: 2 }
            ]
          }
        ]
      }
    };

    syncOrdinalLegendData(chart, chart.currentLayers[0]);

    expect(chart.runtime._legendState).toEqual({ ordinalLegend: true });
    expect(chart.runtime._legendData.type).toBe("ordinal");
    expect(chart.runtime._legendData.items).toHaveLength(2);
    expect(chart.runtime._legendData.items[0].color).toBe("#E69F00");
  });

  test("resetLegendVisibility clears hidden layer keys", function() {
    const chart = {
      runtime: { _hiddenLayerKeys: ["alpha", "beta"] },
      derived: { currentLayers: [] },
      plotLayers: [
        { label: "alpha", color: "#E69F00", type: "line" },
        { label: "beta", color: "#56B4E9", type: "line" }
      ],
      syncLegacyAliases: vi.fn(),
      renderCurrentLayers: vi.fn()
    };

    resetLegendVisibility(chart, "layer");

    expect(chart.runtime._hiddenLayerKeys).toEqual([]);
    expect(chart.derived.currentLayers).toHaveLength(2);
    expect(chart.renderCurrentLayers).toHaveBeenCalled();
  });

  test("resetLegendVisibility clears hidden ordinal segments", function() {
    const chart = {
      runtime: { _hiddenOrdinalSegments: ["A", "B"] },
      currentLayers: [{ label: "donut", type: "donut" }],
      routeLayers: vi.fn()
    };

    resetLegendVisibility(chart, "ordinal");

    expect(chart.runtime._hiddenOrdinalSegments).toEqual([]);
    expect(chart.routeLayers).toHaveBeenCalled();
  });
});

describe("inline legend (GH #84)", function() {
  function buildInlineChart(layerCount, totalWidth) {
    document.body.innerHTML = "<div id='inline-chart'></div>";
    const element = document.getElementById("inline-chart");
    const svg = d3.select(element).append("svg");
    const layers = Array.from({ length: layerCount }, function(_, i) {
      return { label: "series " + i, type: "line", color: "#56B4E9" };
    });

    const chart = {
      element,
      svg,
      options: { suppressLegend: false },
      runtime: { totalWidth: totalWidth || 800 },
      margin: { left: 30, right: 20 },
      height: 300,
      plotLayers: layers,
      currentLayers: layers.slice(),
      derived: { currentLayers: layers.slice() },
      syncLegacyAliases: vi.fn(),
      renderCurrentLayers: vi.fn()
    };
    return chart;
  }

  test("renders one interactive switch per series", function() {
    const chart = buildInlineChart(3);
    syncLegend(chart, { axesChart: true });

    const items = chart.element.querySelectorAll(".myIO-inline-legend-item");
    expect(items).toHaveLength(3);
    expect(items[0].getAttribute("role")).toBe("switch");
    expect(items[0].getAttribute("aria-checked")).toBe("true");
    expect(items[0].getAttribute("tabindex")).toBe("0");
    expect(items[0].querySelector("title").textContent).toBe("series 0");
  });

  test("click on an inline item hides that series", function() {
    const chart = buildInlineChart(3);
    syncLegend(chart, { axesChart: true });

    const item = chart.element.querySelectorAll(".myIO-inline-legend-item")[1];
    item.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(chart.runtime._hiddenLayerKeys).toEqual(["series 1"]);
    expect(chart.derived.currentLayers.map(function(l) { return l.label; }))
      .toEqual(["series 0", "series 2"]);
    expect(chart.renderCurrentLayers).toHaveBeenCalled();
  });

  test("Enter key toggles an inline item", function() {
    const chart = buildInlineChart(2);
    syncLegend(chart, { axesChart: true });

    const item = chart.element.querySelectorAll(".myIO-inline-legend-item")[0];
    item.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(chart.runtime._hiddenLayerKeys).toEqual(["series 0"]);
  });

  test("more than 10 series renders no inline legend", function() {
    const chart = buildInlineChart(12);
    syncLegend(chart, { axesChart: true });

    expect(chart.element.querySelector(".myIO-inline-legend")).toBeFalsy();
  });

  test("too-narrow container renders no inline legend", function() {
    const chart = buildInlineChart(3, 60);
    syncLegend(chart, { axesChart: true });

    expect(chart.element.querySelector(".myIO-inline-legend")).toBeFalsy();
  });

  test("hidden state survives the flip from inline to panel-only", function() {
    const chart = buildInlineChart(3);
    syncLegend(chart, { axesChart: true });

    chart.element.querySelectorAll(".myIO-inline-legend-item")[0]
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // Shrink below the legibility threshold and re-sync: panel becomes the
    // sole legend and must still see series 0 as hidden.
    chart.runtime.totalWidth = 60;
    syncLegend(chart, { axesChart: true });

    expect(chart.element.querySelector(".myIO-inline-legend")).toBeFalsy();
    const item = chart.runtime._legendData.items.find(function(d) { return d.key === "series 0"; });
    expect(item.visible).toBe(false);
  });

  test("click on an inline ordinal item hides the segment and refreshes the strip", function() {
    document.body.innerHTML = "<div id='inline-ordinal'></div>";
    const element = document.getElementById("inline-ordinal");
    const svg = d3.select(element).append("svg");
    const donutLayer = {
      label: "segments",
      type: "donut",
      mapping: { x_var: "name" },
      data: [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
        { name: "C", value: 3 }
      ]
    };
    const chart = {
      element,
      svg,
      options: { suppressLegend: false },
      runtime: { totalWidth: 800 },
      margin: { left: 30, right: 20 },
      height: 300,
      colorDiscrete: d3.scaleOrdinal().domain(["A", "B", "C"]).range(["#E69F00", "#56B4E9", "#009E73"]),
      plotLayers: [donutLayer],
      currentLayers: [donutLayer],
      derived: { currentLayers: [donutLayer] },
      routeLayers: vi.fn()
    };

    syncOrdinalLegendData(chart, donutLayer);
    expect(chart.element.querySelectorAll(".myIO-inline-legend-item")).toHaveLength(3);

    chart.element.querySelector(".myIO-inline-legend-item[data-key='B']")
      .dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(chart.runtime._hiddenOrdinalSegments).toEqual(["B"]);
    expect(chart.routeLayers).toHaveBeenCalled();
    // refreshAfterOrdinalToggle re-renders the strip from the updated state.
    expect(chart.element.querySelector(".myIO-inline-legend-item[data-key='B']")
      .getAttribute("aria-checked")).toBe("false");
  });

  test("off items render dimmed with aria-checked false", function() {
    const chart = buildInlineChart(3);
    chart.runtime._hiddenLayerKeys = ["series 2"];
    chart.derived.currentLayers = chart.plotLayers.slice(0, 2);
    chart.currentLayers = chart.plotLayers.slice(0, 2);
    syncLegend(chart, { axesChart: true });

    const items = chart.element.querySelectorAll(".myIO-inline-legend-item");
    expect(items[2].getAttribute("aria-checked")).toBe("false");
    expect(items[2].querySelector("text").style.opacity).toBe("0.45");
  });

  test("wraps by width onto at most two rows", function() {
    // 5 items x ~102px in 260px available: 2 per row would need 3 rows -> no legend;
    // in 800px they fit on one row + wrap check via a mid width.
    const chart = buildInlineChart(5, 310);
    syncLegend(chart, { axesChart: true });
    expect(chart.element.querySelector(".myIO-inline-legend")).toBeFalsy();

    const wide = buildInlineChart(5, 460);
    syncLegend(wide, { axesChart: true });
    const transforms = Array.from(wide.element.querySelectorAll(".myIO-inline-legend-item"))
      .map(function(node) { return node.getAttribute("transform"); });
    expect(transforms.some(function(t) { return t.indexOf(",16)") > -1; })).toBe(true);
  });
});

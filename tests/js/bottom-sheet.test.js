import * as d3 from "d3";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { addFAB, closePanel, openPanel, renderSheetLegend } from "../../inst/htmlwidgets/myIO/src/interactions/bottom-sheet.js";

globalThis.d3 = d3;

function flush() {
  return new Promise(function(resolve) {
    setTimeout(resolve, 0);
  });
}

function setMatchMedia(matches) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: function() {
      return { matches, addListener() {}, removeListener() {} };
    }
  });
}

function buildChart() {
  const element = document.getElementById("chart");
  const svg = d3.select(element).append("svg").attr("aria-label", "Grouped bar chart");

  return {
    element,
    svg,
    dom: { element },
    runtime: {
      totalWidth: 800,
      _sheetOpen: false
    },
    options: {
      suppressLegend: false,
      toggleY: ["value", "s"],
      yAxisFormat: "s"
    },
    plotLayers: [
      {
        label: "alpha",
        type: "groupedBar",
        color: "#E69F00",
        mapping: { y_var: "value" },
        data: [{ value: 1 }]
      },
      {
        label: "beta",
        type: "groupedBar",
        color: "#56B4E9",
        mapping: { y_var: "value" },
        data: [{ value: 2 }]
      }
    ],
    currentLayers: [
      {
        label: "alpha",
        type: "groupedBar",
        color: "#E69F00",
        mapping: { y_var: "value" },
        data: [{ value: 1 }]
      },
      {
        label: "beta",
        type: "groupedBar",
        color: "#56B4E9",
        mapping: { y_var: "value" },
        data: [{ value: 2 }]
      }
    ],
    derived: {
      currentLayers: [
        {
          label: "alpha",
          type: "groupedBar",
          color: "#E69F00",
          mapping: { y_var: "value" },
          data: [{ value: 1 }]
        },
        {
          label: "beta",
          type: "groupedBar",
          color: "#56B4E9",
          mapping: { y_var: "value" },
          data: [{ value: 2 }]
        }
      ]
    },
    renderCurrentLayers: vi.fn(function() {
      return this;
    }),
    routeLayers: vi.fn(function() {
      return this;
    }),
    toggleVarY: vi.fn(function() {
      return this;
    }),
    toggleGroupedLayout: vi.fn(function() {
      return this;
    })
  };
}

describe("bottom sheet", function() {
  beforeEach(function() {
    document.body.innerHTML = "<div id='chart'></div>";
    setMatchMedia(false);
  });

  test("addFAB opens a panel with actions and legend items", async function() {
    const chart = buildChart();
    addFAB(chart);

    expect(chart.element.querySelector(".myIO-fab")).toBeTruthy();

    openPanel(chart);
    await flush();

    expect(chart.runtime._sheetOpen).toBe(true);
    expect(chart.element.querySelector(".myIO-panel")).toBeTruthy();
    expect(chart.element.querySelector(".myIO-sheet-actions")).toBeTruthy();
    expect(chart.element.querySelectorAll(".myIO-sheet-action")).toHaveLength(4);
    expect(chart.element.querySelectorAll(".myIO-sheet-legend-item")).toHaveLength(2);
  });

  test("renderSheetLegend refreshes the open panel in place", async function() {
    const chart = buildChart();
    addFAB(chart);
    openPanel(chart);
    await flush();

    chart.runtime._legendData = {
      type: "layer",
      items: [
        { key: "alpha", label: "alpha", color: "#E69F00", visible: true, kind: "groupedBar" }
      ]
    };

    renderSheetLegend(chart);

    expect(chart.element.querySelectorAll(".myIO-sheet-legend-item")).toHaveLength(1);
    expect(chart.element.querySelector(".myIO-sheet-legend-label").textContent).toBe("alpha");
  });

  test("closePanel clears the panel and restores the FAB state", async function() {
    const chart = buildChart();
    addFAB(chart);
    openPanel(chart);
    await flush();

    setMatchMedia(true);

    closePanel(chart);

    expect(chart.runtime._sheetOpen).toBe(false);
    expect(chart.element.querySelector(".myIO-panel")).toBeFalsy();
    expect(chart.element.querySelector(".myIO-sheet-backdrop")).toBeFalsy();
    expect(chart.element.querySelector(".myIO-fab").getAttribute("aria-expanded")).toBe("false");
  });

  test("closePanel allows the sheet to reopen immediately", async function() {
    const chart = buildChart();
    addFAB(chart);
    openPanel(chart);
    await flush();

    closePanel(chart);
    openPanel(chart);
    await flush();

    expect(chart.runtime._sheetOpen).toBe(true);
    expect(chart.element.querySelector(".myIO-panel")).toBeTruthy();
  });

  test("suppressLegend charts still show actions in the panel", async function() {
    const chart = buildChart();
    chart.options.suppressLegend = true;
    chart.options.toggleY = null;
    addFAB(chart);
    openPanel(chart);
    await flush();

    expect(chart.element.querySelector(".myIO-sheet-legend-section")).toBeFalsy();
    expect(chart.element.querySelectorAll(".myIO-sheet-action")).toHaveLength(2);
  });
});

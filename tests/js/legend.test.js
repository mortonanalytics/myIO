import * as d3 from "d3";
import { describe, expect, test } from "vitest";
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
});

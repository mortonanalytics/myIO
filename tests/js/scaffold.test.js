import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { applyWidthTier, getChartHeight } from "../../inst/htmlwidgets/myIO/src/layout/scaffold.js";

globalThis.d3 = d3;

describe("applyWidthTier", function() {
  test("narrow container gets the narrow tier class regardless of viewport", function() {
    document.body.innerHTML = "<div id='tier-chart'></div>";
    var element = document.getElementById("tier-chart");
    var chart = { element: element, runtime: { totalWidth: 400 } };

    applyWidthTier(chart);
    expect(element.classList.contains("myIO-container--narrow")).toBe(true);

    // Resize wide: class toggles off from the same container-width signal.
    chart.runtime.totalWidth = 800;
    applyWidthTier(chart);
    expect(element.classList.contains("myIO-container--narrow")).toBe(false);
  });
});

describe("getChartHeight", function() {
  test("returns full height when legend suppressed", function() {
    var chart = {
      height: 400,
      options: { suppressLegend: true },
      runtime: { totalWidth: 800 }
    };
    expect(getChartHeight(chart)).toBe(400);
  });

  test("returns full height on desktop with legend", function() {
    var chart = {
      height: 400,
      options: { suppressLegend: false },
      runtime: { totalWidth: 800 }
    };
    expect(getChartHeight(chart)).toBe(400);
  });

  test("returns full height on mobile with legend", function() {
    var chart = {
      height: 400,
      options: { suppressLegend: false },
      runtime: { totalWidth: 400 }
    };
    expect(getChartHeight(chart)).toBe(400);
  });
});

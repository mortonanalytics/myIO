import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { getChartHeight } from "../../inst/htmlwidgets/myIO/src/layout/scaffold.js";

globalThis.d3 = d3;

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

  test("returns 80% height on mobile with legend", function() {
    var chart = {
      height: 400,
      options: { suppressLegend: false },
      runtime: { totalWidth: 400 }
    };
    expect(getChartHeight(chart)).toBe(320);
  });
});

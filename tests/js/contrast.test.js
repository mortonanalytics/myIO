import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { contrastRatio, readableTextColor, relativeLuminance } from "../../inst/htmlwidgets/myIO/src/theme/contrast.js";

globalThis.d3 = d3;

describe("WCAG contrast helpers", function() {
  test("relativeLuminance matches the sRGB reference values", function() {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 6);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 6);
    expect(relativeLuminance("not-a-color")).toBe(0);
  });

  test("contrastRatio matches known WCAG ratios", function() {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrastRatio("#6b7280", "#ffffff")).toBeCloseTo(4.83, 2);
  });

  test("the old sankey label ink fails against the ribbon it is drawn on", function() {
    // #6b7280 is what var(--chart-text-color, #333) resolved to live; the label
    // sits on a link ribbon composited at stroke-opacity 0.4 over white.
    expect(contrastRatio("#6b7280", "rgb(250,210,170)")).toBeLessThan(4.5);
  });

  test("readableTextColor picks the ink that wins", function() {
    expect(readableTextColor("#ffffff")).toBe("#000000");
    expect(readableTextColor("#111827")).toBe("#ffffff");
  });

  test("readableTextColor clears AA on every shipped palette colour", function() {
    var okabeIto = ["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7", "#999999"];
    okabeIto.concat(d3.schemeTableau10).forEach(function(color) {
      expect(contrastRatio(readableTextColor(color), color)).toBeGreaterThanOrEqual(4.5);
    });
  });
});

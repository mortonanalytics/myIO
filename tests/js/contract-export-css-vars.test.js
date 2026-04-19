import { describe, expect, test } from "vitest";

describe("CSS variable resolution contract", function() {
  test("CHART_CSS_VARS includes all SVG-relevant variables", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/utils/resolve-css-vars.js", "utf8");

    var required = [
      "--chart-text-color", "--chart-font", "--chart-grid-color", "--chart-grid-opacity",
      "--chart-bg", "--chart-ref-line-color", "--chart-ref-line-width",
      "--chart-annotation-ring", "--chart-primary-color",
      "--chart-brush-fill", "--chart-brush-stroke", "--chart-brush-dim-opacity",
      "--chart-legend-inactive-opacity", "--chart-annotation-font-size",
      "--chart-status-bar-color"
    ];

    for (var i = 0; i < required.length; i++) {
      expect(source).toContain(required[i]);
    }
  });
});

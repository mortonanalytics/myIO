import { describe, expect, test } from "vitest";

describe("Clipboard export contract", function() {
  test("copyAsSVG source imports injectExportLegend", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/utils/export-clipboard.js", "utf8");
    expect(source).toContain("injectExportLegend");
  });

  test("copyAsPNG source imports injectExportLegend", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/utils/export-clipboard.js", "utf8");
    // Both functions should use legend injection
    expect(source).toContain("injectExportLegend");
    // And the function should call it (not just import)
    var callCount = (source.match(/injectExportLegend\(/g) || []).length;
    expect(callCount).toBeGreaterThanOrEqual(2); // called in both copyAsSVG and copyAsPNG
  });
});

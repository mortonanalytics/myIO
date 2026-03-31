import { describe, expect, test } from "vitest";

describe("Export toolbar contract", function() {
  test("buttons.js defines PDF button", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain('"pdf"');
    expect(source).toContain("Export as PDF");
  });

  test("buttons.js defines clipboard button", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain('"clipboard"');
    expect(source).toContain("Copy to clipboard");
  });

  test("buttons.js defaults all export buttons to visible", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    // Should NOT contain strict equality check that hides SVG by default
    expect(source).not.toContain("exportConfig.svg === true");
    // Should use !== false pattern for all buttons
    expect(source).toContain("!== false");
  });

  test("export-pdf.js exists", async function() {
    var fs = await import("fs");
    var exists = fs.existsSync("inst/htmlwidgets/myIO/src/utils/export-pdf.js");
    expect(exists).toBe(true);
  });

  test("load-jspdf.js exists", async function() {
    var fs = await import("fs");
    var exists = fs.existsSync("inst/htmlwidgets/myIO/src/utils/load-jspdf.js");
    expect(exists).toBe(true);
  });

  test("jsPDF library is vendored", async function() {
    var fs = await import("fs");
    var exists = fs.existsSync("inst/htmlwidgets/lib/jspdf/jspdf.umd.min.js");
    expect(exists).toBe(true);
  });

  test("export-pdf.js imports loadJsPDF", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/utils/export-pdf.js", "utf8");
    expect(source).toContain("loadJsPDF");
    expect(source).toContain("exportToPDF");
  });

  test("buttons.js has copy submenu markup", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain("myIO-copy-menu");
  });

  test("style.css has copy menu styles", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/style.css", "utf8");
    expect(source).toContain(".myIO-copy-menu");
    expect(source).toContain(".myIO-btn-success");
    expect(source).toContain(".myIO-sr-announce");
  });

  test("buttons.js has overflow menu for narrow viewports", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain("myIO-overflow");
  });
});

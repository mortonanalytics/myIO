import { describe, expect, test } from "vitest";

describe("Export toolbar contract", function() {
  test("buttons.js defines PDF handler and label", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain('"pdf"');
    expect(source).toContain("Export as PDF");
    expect(source).toContain("exportToPDF");
  });

  test("buttons.js defines clipboard handler and label", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/buttons.js", "utf8");
    expect(source).toContain('"clipboard"');
    expect(source).toContain("Copy to clipboard");
  });

  test("bottom-sheet.js defaults all export buttons to visible", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/bottom-sheet.js", "utf8");
    // Should NOT contain strict equality check that hides SVG by default
    expect(source).not.toContain("exportConfig.svg === true");
    // Should use !== false pattern for all export buttons
    expect(source).toContain("exportConfig.svg !== false");
    expect(source).toContain("exportConfig.pdf !== false");
    expect(source).toContain("exportConfig.clipboard !== false");
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
    var exists = fs.existsSync("inst/htmlwidgets/myIO/lib/jspdf/jspdf.umd.min.js");
    expect(exists).toBe(true);
  });

  test("export-pdf.js imports loadJsPDF", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/utils/export-pdf.js", "utf8");
    expect(source).toContain("loadJsPDF");
    expect(source).toContain("exportToPDF");
  });

  test("style.css has copy menu styles", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/style.css", "utf8");
    expect(source).toContain(".myIO-copy-menu");
    expect(source).toContain(".myIO-btn-success");
    expect(source).toContain(".myIO-sr-announce");
  });

  test("bottom-sheet.js includes PDF and clipboard in action panel", async function() {
    var fs = await import("fs");
    var source = fs.readFileSync("inst/htmlwidgets/myIO/src/interactions/bottom-sheet.js", "utf8");
    expect(source).toContain("iconPDF");
    expect(source).toContain("iconClipboard");
  });
});

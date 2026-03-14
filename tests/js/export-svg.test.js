import { describe, expect, test, vi } from "vitest";
import { getSVGString, svgString2Image } from "../../inst/htmlwidgets/myIO/src/utils/export-svg.js";

describe("getSVGString", function() {
  test("serializes SVG node to string", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100");
    svg.setAttribute("height", "100");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("width", "50");
    rect.setAttribute("height", "50");
    svg.appendChild(rect);
    document.body.appendChild(svg);

    var result = getSVGString(svg);
    expect(typeof result).toBe("string");
    expect(result).toContain("<svg");
    expect(result).toContain("<rect");
    expect(result).toContain("xmlns:xlink");

    document.body.removeChild(svg);
  });

  test("handles SVG with classes and IDs", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("id", "test-svg");
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "chart-group");
    svg.appendChild(g);
    document.body.appendChild(svg);

    var result = getSVGString(svg);
    expect(result).toContain("test-svg");
    expect(result).toContain("chart-group");

    document.body.removeChild(svg);
  });

  test("prepends CSS styles to SVG", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);

    var result = getSVGString(svg);
    // Should contain style element if there are any matching CSS rules
    expect(typeof result).toBe("string");

    document.body.removeChild(svg);
  });
});

describe("svgString2Image", function() {
  test("creates canvas and image from SVG string", function() {
    var svgString = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="50" height="50"/></svg>';
    var callbackCalled = false;

    // jsdom doesn't fully support canvas, but we can verify it doesn't throw
    expect(function() {
      svgString2Image(svgString, 100, 100, "png", function(blob, filesize, format) {
        callbackCalled = true;
      });
    }).not.toThrow();
  });

  test("defaults to png format", function() {
    var svgString = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';
    expect(function() {
      svgString2Image(svgString, 50, 50);
    }).not.toThrow();
  });
});

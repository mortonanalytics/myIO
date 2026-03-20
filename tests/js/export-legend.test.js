import { describe, expect, test } from "vitest";
import { injectExportLegend } from "../../inst/htmlwidgets/myIO/src/utils/export-legend.js";

function makeChart(opts) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", opts.width || "400");
  svg.setAttribute("height", opts.height || "300");
  svg.setAttribute("viewBox", "0 0 " + (opts.width || 400) + " " + (opts.height || 300));
  document.body.appendChild(svg);

  var chart = {
    svg: { node: function() { return svg; } },
    width: opts.width || 400,
    totalWidth: opts.width || 400,
    height: opts.height || 300,
    plotLayers: opts.plotLayers || [],
    options: opts.options || {},
    runtime: opts.runtime || {},
    colorDiscrete: opts.colorDiscrete || null,
    colorContinuous: opts.colorContinuous || null
  };

  return { chart: chart, svg: svg };
}

function cleanup(svg) {
  if (svg.parentNode) {
    svg.parentNode.removeChild(svg);
  }
}

describe("injectExportLegend", function() {
  test("returns zero extraHeight when no legend data", function() {
    var c = makeChart({ plotLayers: [] });
    var result = injectExportLegend(c.chart);

    expect(result.extraHeight).toBe(0);
    expect(typeof result.cleanup).toBe("function");
    result.cleanup();
    cleanup(c.svg);
  });

  test("returns zero extraHeight when legend is suppressed", function() {
    var c = makeChart({
      options: { suppressLegend: true },
      plotLayers: [{ label: "Series A", color: "#ff0000", type: "line" }]
    });
    var result = injectExportLegend(c.chart);

    expect(result.extraHeight).toBe(0);
    cleanup(c.svg);
  });

  test("injects layer legend into SVG and cleans up", function() {
    var c = makeChart({
      plotLayers: [
        { label: "Series A", color: "#ff0000", type: "line" },
        { label: "Series B", color: "#0000ff", type: "line" }
      ]
    });
    // buildLayerLegendData needs currentLayers to determine visibility
    c.chart.currentLayers = c.chart.plotLayers;

    var result = injectExportLegend(c.chart);

    expect(result.extraHeight).toBeGreaterThan(0);
    // SVG should have the legend group appended
    var legendGroup = c.svg.querySelector(".myIO-export-legend");
    expect(legendGroup).not.toBeNull();
    // SVG height should be expanded
    expect(parseFloat(c.svg.getAttribute("height"))).toBeGreaterThan(300);

    // Cleanup should restore original state
    result.cleanup();
    expect(c.svg.querySelector(".myIO-export-legend")).toBeNull();
    expect(c.svg.getAttribute("height")).toBe("300");
    expect(c.svg.getAttribute("viewBox")).toBe("0 0 400 300");

    cleanup(c.svg);
  });

  test("injects ordinal legend with visible items", function() {
    var c = makeChart({
      plotLayers: [
        { label: "Donut", type: "donut", data: [{ cat: "A" }, { cat: "B" }], mapping: { x_var: "cat" } }
      ],
      runtime: {
        _legendState: { ordinalLegend: true },
        _hiddenOrdinalSegments: []
      }
    });
    c.chart.colorDiscrete = function(key) { return key === "A" ? "#f00" : "#00f"; };

    var result = injectExportLegend(c.chart);

    expect(result.extraHeight).toBeGreaterThan(0);
    var rects = c.svg.querySelectorAll(".myIO-export-legend rect");
    expect(rects.length).toBe(2);

    result.cleanup();
    cleanup(c.svg);
  });

  test("excludes hidden ordinal items", function() {
    var c = makeChart({
      plotLayers: [
        { label: "Donut", type: "donut", data: [{ cat: "A" }, { cat: "B" }], mapping: { x_var: "cat" } }
      ],
      runtime: {
        _legendState: { ordinalLegend: true },
        _hiddenOrdinalSegments: ["B"]
      }
    });
    c.chart.colorDiscrete = function() { return "#f00"; };

    var result = injectExportLegend(c.chart);

    // Only one visible item
    var rects = c.svg.querySelectorAll(".myIO-export-legend rect");
    expect(rects.length).toBe(1);

    result.cleanup();
    cleanup(c.svg);
  });

  test("injects continuous legend with gradient", function() {
    var mockScale = function(v) { return "rgb(" + Math.round(v) + ",0,0)"; };
    mockScale.domain = function() { return [0, 100]; };
    mockScale.ticks = function(n) { return [0, 25, 50, 75, 100]; };

    var c = makeChart({
      plotLayers: [{ label: "Heat", type: "heatmap", color: "#f00" }],
      runtime: {
        _legendState: { continuousLegend: true }
      }
    });
    c.chart.colorContinuous = mockScale;
    c.chart.currentLayers = c.chart.plotLayers;

    var result = injectExportLegend(c.chart);

    expect(result.extraHeight).toBeGreaterThan(0);
    var legendGroup = c.svg.querySelector(".myIO-export-legend");
    expect(legendGroup).not.toBeNull();
    // Should have a gradient rect
    expect(legendGroup.querySelector("rect")).not.toBeNull();
    // Should have tick labels
    var texts = legendGroup.querySelectorAll("text");
    expect(texts.length).toBe(5);

    result.cleanup();
    cleanup(c.svg);
  });
});

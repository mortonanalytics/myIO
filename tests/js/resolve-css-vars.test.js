import { beforeEach, describe, expect, test } from "vitest";
import { resolveCSSVariables } from "../../inst/htmlwidgets/myIO/src/utils/resolve-css-vars.js";

describe("resolveCSSVariables", function() {
  var container;

  beforeEach(function() {
    document.body.innerHTML = "";

    container = document.createElement("div");
    container.style.setProperty("--chart-text-color", "#6b7280");
    container.style.setProperty("--chart-grid-color", "#9ca3af");
    container.style.setProperty("--chart-bg", "#ffffff");
    container.style.setProperty("--chart-primary-color", "#E69F00");
    document.body.appendChild(container);
  });

  test("resolves var() in inline style attribute", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("style", "fill: var(--chart-text-color)");
    svg.appendChild(text);
    container.appendChild(svg);

    resolveCSSVariables(svg, container);

    var style = text.getAttribute("style");
    expect(style).not.toContain("var(");
    expect(style).toContain("#6b7280");
  });

  test("resolves var() in fill presentation attribute", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "var(--chart-primary-color)");
    svg.appendChild(rect);
    container.appendChild(svg);

    resolveCSSVariables(svg, container);

    expect(rect.getAttribute("fill")).toBe("#E69F00");
  });

  test("resolves var() in stroke presentation attribute", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "var(--chart-grid-color)");
    svg.appendChild(line);
    container.appendChild(svg);

    resolveCSSVariables(svg, container);

    expect(line.getAttribute("stroke")).toBe("#9ca3af");
  });

  test("leaves elements without var() references untouched", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("fill", "#ff0000");
    rect.setAttribute("style", "opacity: 0.5");
    svg.appendChild(rect);
    container.appendChild(svg);

    resolveCSSVariables(svg, container);

    expect(rect.getAttribute("fill")).toBe("#ff0000");
    expect(rect.getAttribute("style")).toBe("opacity: 0.5");
  });

  test("handles unknown var() gracefully without crashing", function() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("fill", "var(--unknown-var)");
    svg.appendChild(text);
    container.appendChild(svg);

    expect(function() {
      resolveCSSVariables(svg, container);
    }).not.toThrow();
    expect(text.getAttribute("fill")).toBe("var(--unknown-var)");
  });
});

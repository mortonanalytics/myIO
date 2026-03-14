import { describe, expect, test } from "vitest";
import { OKABE_ITO } from "../../inst/htmlwidgets/myIO/src/themes/palettes.js";

describe("OKABE_ITO palette", function() {
  test("has 8 colors", function() {
    expect(OKABE_ITO).toHaveLength(8);
  });

  test("all entries are valid hex color strings", function() {
    OKABE_ITO.forEach(function(color) {
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  test("first color is the canonical Okabe-Ito orange", function() {
    expect(OKABE_ITO[0]).toBe("#E69F00");
  });

  test("contains expected sky blue", function() {
    expect(OKABE_ITO).toContain("#56B4E9");
  });
});

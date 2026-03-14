import { describe, expect, test } from "vitest";
import {
  isMobile,
  responsiveValue,
  pointRadius,
  strokeWidth,
  tagName,
  isColorSchemeActive,
  resolveColor
} from "../../inst/htmlwidgets/myIO/src/utils/responsive.js";

describe("isMobile", function() {
  test("returns true when width <= 600", function() {
    expect(isMobile({ runtime: { totalWidth: 400 } })).toBe(true);
    expect(isMobile({ runtime: { totalWidth: 600 } })).toBe(true);
  });

  test("returns false when width > 600", function() {
    expect(isMobile({ runtime: { totalWidth: 601 } })).toBe(false);
    expect(isMobile({ runtime: { totalWidth: 1024 } })).toBe(false);
  });
});

describe("responsiveValue", function() {
  test("returns desktop value on wide screen", function() {
    expect(responsiveValue({ runtime: { totalWidth: 800 } }, "big", "small")).toBe("big");
  });

  test("returns mobile value on narrow screen", function() {
    expect(responsiveValue({ runtime: { totalWidth: 400 } }, "big", "small")).toBe("small");
  });
});

describe("pointRadius", function() {
  test("returns 5 for desktop", function() {
    expect(pointRadius({ runtime: { totalWidth: 800 } })).toBe(5);
  });

  test("returns 3 for mobile", function() {
    expect(pointRadius({ runtime: { totalWidth: 400 } })).toBe(3);
  });
});

describe("strokeWidth", function() {
  test("returns 3 for desktop", function() {
    expect(strokeWidth({ runtime: { totalWidth: 800 } })).toBe(3);
  });

  test("returns 1 for mobile", function() {
    expect(strokeWidth({ runtime: { totalWidth: 400 } })).toBe(1);
  });
});

describe("tagName", function() {
  test("builds correct class name", function() {
    expect(tagName("point", "chart1", "series")).toBe("tag-point-chart1-series");
  });

  test("strips whitespace from label", function() {
    expect(tagName("line", "c1", "my series")).toBe("tag-line-c1-myseries");
  });

  test("handles numeric label", function() {
    expect(tagName("bar", "c1", 42)).toBe("tag-bar-c1-42");
  });
});

describe("isColorSchemeActive", function() {
  test("returns true when enabled", function() {
    expect(isColorSchemeActive({ config: { scales: { colorScheme: { enabled: true } } } })).toBe(true);
  });

  test("returns false when disabled", function() {
    expect(isColorSchemeActive({ config: { scales: { colorScheme: { enabled: false } } } })).toBe(false);
  });
});

describe("resolveColor", function() {
  test("returns fallback when color scheme inactive", function() {
    var chart = {
      config: { scales: { colorScheme: { enabled: false } } },
      derived: {}
    };
    expect(resolveColor(chart, "key", "#FF0000")).toBe("#FF0000");
  });

  test("returns discrete color when scheme active", function() {
    var chart = {
      config: { scales: { colorScheme: { enabled: true } } },
      derived: { colorDiscrete: function(key) { return "#00FF00"; } }
    };
    expect(resolveColor(chart, "key", "#FF0000")).toBe("#00FF00");
  });
});

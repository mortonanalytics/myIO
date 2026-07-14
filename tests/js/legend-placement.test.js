import { describe, expect, test } from "vitest";
import {
  MAX_INLINE_ITEMS,
  MAX_INLINE_ROWS,
  computeInlineRows,
  estimateItemWidth,
  legendAvailableWidth,
  legendItemLabel,
  resolveLegendPlacement,
  uniqueLegendItems
} from "../../inst/htmlwidgets/myIO/src/layout/legend-placement.js";

// Callers pass deduplicated labels; the resolver does not dedupe.
function labels(n, text) {
  return Array.from({ length: n }, function(_, i) {
    return (text || "series ") + i;
  });
}

describe("resolveLegendPlacement policy rows (first match wins)", function() {
  test("suppressed hides both surfaces regardless of everything else", function() {
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(3), suppressLegend: true, availableWidth: 800
    })).toEqual({ inline: false, panel: false, reason: "suppressed" });
  });

  test("no legend type hides both surfaces", function() {
    expect(resolveLegendPlacement({
      type: null, labels: [], suppressLegend: false, availableWidth: 800
    })).toEqual({ inline: false, panel: false, reason: "no-legend" });
  });

  test("continuous is panel-only", function() {
    expect(resolveLegendPlacement({
      type: "continuous", labels: [], suppressLegend: false, availableWidth: 800
    })).toEqual({ inline: false, panel: true, reason: "continuous" });
  });

  test("fewer than 2 items is panel-only", function() {
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(1), suppressLegend: false, availableWidth: 800
    })).toEqual({ inline: false, panel: true, reason: "too-few-items" });
  });

  test("more than MAX_INLINE_ITEMS is panel-only", function() {
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(MAX_INLINE_ITEMS + 1), suppressLegend: false, availableWidth: 5000
    })).toEqual({ inline: false, panel: true, reason: "too-many-items" });
  });

  test("too-many-items wins over too-narrow (15 labels in a 300px container)", function() {
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(15), suppressLegend: false, availableWidth: 300
    })).toEqual({ inline: false, panel: true, reason: "too-many-items" });
  });

  test("2-10 items needing a third row is panel-only with reason too-narrow", function() {
    // 6 items at >= 88px each cannot fit 2 rows in 200px
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(6), suppressLegend: false, availableWidth: 200
    })).toEqual({ inline: false, panel: true, reason: "too-narrow" });
  });

  test("2-10 items that fit is inline-active with panel hidden", function() {
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(3), suppressLegend: false, availableWidth: 800
    })).toEqual({ inline: true, panel: false, reason: "inline-active" });
  });

  test("ordinal type follows the same discrete rules as layer", function() {
    expect(resolveLegendPlacement({
      type: "ordinal", labels: ["A", "B", "C"], suppressLegend: false, availableWidth: 800
    })).toEqual({ inline: true, panel: false, reason: "inline-active" });
  });
});

describe("computeInlineRows", function() {
  test("single row when everything fits", function() {
    var layout = computeInlineRows(["aa", "bb", "cc"], 800);
    expect(layout.rowCount).toBe(1);
    expect(layout.positions.map(function(p) { return p.row; })).toEqual([0, 0, 0]);
    expect(layout.positions[0].x).toBe(0);
    expect(layout.positions[1].x).toBe(estimateItemWidth("aa"));
  });

  test("wraps to a second row on width, not item count", function() {
    // 4 items of 60px each in 150px: 2 per row
    var layout = computeInlineRows(["a", "b", "c", "d"], 150);
    expect(layout.rowCount).toBe(2);
    expect(layout.positions.map(function(p) { return p.row; })).toEqual([0, 0, 1, 1]);
    expect(layout.positions[2].x).toBe(0);
  });

  test("returns null when a third row would be needed", function() {
    expect(computeInlineRows(["a", "b", "c", "d", "e"], 150)).toBe(null);
  });

  test("returns null when a single item alone overflows the width", function() {
    expect(computeInlineRows(["this label is far too long to fit"], 100)).toBe(null);
    expect(MAX_INLINE_ROWS).toBe(2);
  });

  test("returns null for empty labels or non-positive width", function() {
    expect(computeInlineRows([], 800)).toBe(null);
    expect(computeInlineRows(["a", "b"], 0)).toBe(null);
    expect(computeInlineRows(["a", "b"], undefined)).toBe(null);
  });
});

describe("estimateItemWidth / legendAvailableWidth", function() {
  test("matches the historical inline-legend estimate, capped at 190", function() {
    expect(estimateItemWidth("ab")).toBe(60);
    expect(estimateItemWidth("x".repeat(50))).toBe(190);
    expect(estimateItemWidth(123)).toBe(46 + 3 * 7);
  });

  test("available width subtracts margins from total width", function() {
    expect(legendAvailableWidth({
      totalWidth: 800, margin: { left: 40, right: 20 }
    })).toBe(740);
    expect(legendAvailableWidth({ width: 300, margin: {} })).toBe(300);
    expect(legendAvailableWidth(null)).toBe(0);
  });

  test("uniqueLegendItems keeps the first occurrence per key, in order", function() {
    expect(uniqueLegendItems([
      { key: "a", label: "first a" },
      { key: "b", label: "b" },
      { key: "a", label: "second a" },
      { label: "b" }
    ])).toEqual([
      { key: "a", label: "first a" },
      { key: "b", label: "b" }
    ]);
    expect(uniqueLegendItems(null)).toEqual([]);
  });

  test("legendItemLabel prefers label, falls back to key, always a string", function() {
    expect(legendItemLabel({ label: "L", key: "k" })).toBe("L");
    expect(legendItemLabel({ key: "k" })).toBe("k");
    expect(legendItemLabel({})).toBe("");
  });

  test("runtime.totalWidth is canonical over the legacy alias", function() {
    expect(legendAvailableWidth({
      runtime: { totalWidth: 500 }, totalWidth: 800, margin: { left: 50, right: 0 }
    })).toBe(450);
  });
});

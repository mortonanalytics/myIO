import { describe, expect, test } from "vitest";
import {
  MAX_INLINE_ITEMS,
  MAX_INLINE_ROWS,
  computeInlineRows,
  estimateItemWidth,
  estimateTitleWidth,
  legendAvailableWidth,
  legendFirstRowWidth,
  legendItemLabel,
  legendTitleText,
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

describe("legend title measurement", function() {
  test("estimateTitleWidth measures the truncated title plus the gap", function() {
    expect(estimateTitleWidth("")).toBe(0);
    expect(estimateTitleWidth(null)).toBe(0);
    expect(estimateTitleWidth("Month")).toBe(50);
    expect(legendTitleText("x".repeat(40))).toHaveLength(24);
    expect(estimateTitleWidth("x".repeat(40))).toBe(192);
  });

  test("computeInlineRows offsets only the first row by the title width", function() {
    const layout = computeInlineRows(["aa", "bb"], 800, 50);
    expect(layout.positions[0].x).toBe(50);
    expect(layout.positions[1].x).toBe(50 + estimateItemWidth("aa"));

    // 3 items of 53px in 150px with a 50px title: the title pushes row 0 down to
    // a single item and the wrapped row restarts at x = 0.
    const wrapped = computeInlineRows(["a", "b", "c"], 150, 50);
    expect(wrapped.positions.map(function(p) { return p.row; })).toEqual([0, 1, 1]);
    expect(wrapped.positions[0].x).toBe(50);
    expect(wrapped.positions[1].x).toBe(0);

    // Without the title two of the three items fit on row 0 and row 0 starts at 0.
    const untitled = computeInlineRows(["a", "b", "c"], 150, 0);
    expect(untitled.positions.map(function(p) { return p.row; })).toEqual([0, 0, 1]);
    expect(untitled.positions[0].x).toBe(0);
  });

  test("a title wider than the container yields no inline layout", function() {
    expect(computeInlineRows(["aa", "bb"], 100, 120)).toBe(null);
  });

  test("titleWidth flows through resolveLegendPlacement", function() {
    // 5 items of 102px pack onto 2 rows in 350px, so the legend is inline.
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(5), suppressLegend: false, availableWidth: 350
    })).toEqual({ inline: true, panel: false, reason: "inline-active" });
    // A 192px title costs row 0 two of its three slots, forcing a third row.
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(5), suppressLegend: false,
      availableWidth: 350, titleWidth: 192
    })).toEqual({ inline: false, panel: true, reason: "too-narrow" });
    // A title the layout can absorb leaves the legend inline.
    expect(resolveLegendPlacement({
      type: "layer", labels: labels(5), suppressLegend: false,
      availableWidth: 350, titleWidth: 50
    })).toEqual({ inline: true, panel: false, reason: "inline-active" });
  });
});

describe("legendFirstRowWidth", function() {
  function chartWith(xAxisLabel, extraOptions) {
    return {
      width: 500,
      margin: { left: 50, right: 5 },
      options: Object.assign({ xAxisLabel: xAxisLabel }, extraOptions || {})
    };
  }

  test("charts without an x-axis title keep the full plot width", function() {
    expect(legendFirstRowWidth(chartWith(null))).toBe(legendAvailableWidth(chartWith(null)));
  });

  test("a suppressed x axis frees the whole first row", function() {
    var chart = chartWith("Horsepower", { suppressAxis: { xAxis: true } });
    expect(legendFirstRowWidth(chart)).toBe(legendAvailableWidth(chart));
  });

  // The title is centred, so the legend — which starts at the plot's left edge
  // — can only run as far as the title's left edge, less a gap.
  test("stops the first row short of the centred x-axis title", function() {
    // plot width 445, "Horsepower" estimated at 75 -> 445/2 - 75/2 - 12 = 173
    expect(legendFirstRowWidth(chartWith("Horsepower"))).toBe(173);
  });

  test("a short title leaves more room than a long one", function() {
    expect(legendFirstRowWidth(chartWith("Day"))).toBeGreaterThan(
      legendFirstRowWidth(chartWith("Horsepower"))
    );
  });
});

describe("computeInlineRows with a narrowed first row", function() {
  test("wraps to the second row at the x-axis title instead of overlapping it", function() {
    var layout = computeInlineRows(["a", "b", "c"], 300, 0, 120);
    expect(layout.rowCount).toBe(2);
    // 53px items: two fit inside 120, the third wraps rather than running on.
    expect(layout.positions.map(function(p) { return p.row; })).toEqual([0, 0, 1]);
    expect(layout.positions[2].x).toBe(0);
  });

  test("wrapped rows still get the full width", function() {
    var layout = computeInlineRows(["a", "b", "c", "d"], 300, 0, 60);
    expect(layout.positions.map(function(p) { return p.row; })).toEqual([0, 1, 1, 1]);
  });

  test("a legend title and a narrowed first row compose", function() {
    var layout = computeInlineRows(["a", "b"], 300, 50, 120);
    expect(layout.positions[0]).toEqual({ row: 0, x: 50 });
    expect(layout.positions[1]).toEqual({ row: 1, x: 0 });
  });

  test("a title wider than the narrowed first row yields no inline layout", function() {
    expect(computeInlineRows(["a", "b"], 300, 130, 120)).toBe(null);
  });

  test("omitting the first-row width leaves the old behaviour unchanged", function() {
    expect(computeInlineRows(["a", "b", "c"], 300, 0)).toEqual(
      computeInlineRows(["a", "b", "c"], 300, 0, 300)
    );
  });
});

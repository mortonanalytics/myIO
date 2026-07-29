// Single source of truth for legend placement (GH #84). Exactly one legend
// surface is active per chart: the inline plot-area legend or the panel
// legend section. Consulted by the inline renderer, the panel, and the
// export injector — no consumer may add its own placement logic.
// Must not import from legend.js or bottom-sheet.js (both import this module).

export var MAX_INLINE_ITEMS = 10;
export var MAX_INLINE_ROWS = 2;

export function estimateItemWidth(label) {
  return Math.min(190, 46 + String(label).length * 7);
}

export var TITLE_GAP = 12;
export var MAX_TITLE_CHARS = 24;

// Display form of a legend title: truncated on the same 24-char budget the
// item labels use, so measurement and rendering can never disagree.
export function legendTitleText(title) {
  var text = title == null ? "" : String(title);
  if (!text) {
    return "";
  }
  return text.length > MAX_TITLE_CHARS
    ? text.substring(0, MAX_TITLE_CHARS - 3) + "..."
    : text;
}

// The title is bold 12px text with no swatch. Bold Roboto runs a little wider
// than the 7px/char used for item labels, hence 7.5, plus the gap that
// separates the title from the first item.
export function estimateTitleWidth(title) {
  var text = legendTitleText(title);
  return text ? Math.ceil(text.length * 7.5) + TITLE_GAP : 0;
}

export function uniqueLegendItems(items) {
  var seen = {};
  return (items || []).filter(function(item) {
    var key = item.key || item.label;
    if (seen[key]) {
      return false;
    }
    seen[key] = true;
    return true;
  });
}

export function legendItemLabel(item) {
  return String(item.label || item.key || "");
}

export function legendAvailableWidth(chart) {
  if (!chart) {
    return 0;
  }
  var total = (chart.runtime && chart.runtime.totalWidth) || chart.totalWidth || chart.width || 0;
  var margin = chart.margin || {};
  return total - (margin.left || 0) - (margin.right || 0);
}

export var AXIS_TITLE_GAP = 12;

// Axis titles are the same 12px face as the legend, so they measure at roughly
// the same per-character rate as an item label minus its swatch.
function estimateAxisTitleWidth(label) {
  return Math.ceil(String(label).length * 7.5);
}

// The x-axis title is centred in the plot area and sits on the same baseline
// band as the inline legend's FIRST row, so that row has to stop short of it.
// Wrapped rows sit below the title and keep the full width. Charts with no
// x-axis title are unaffected.
export function legendFirstRowWidth(chart) {
  var available = legendAvailableWidth(chart);
  var options = (chart && chart.options) || {};
  var suppress = options.suppressAxis;
  if (!options.xAxisLabel || (suppress && suppress.xAxis === true)) {
    return available;
  }
  var reserved = Math.floor(
    available / 2 - estimateAxisTitleWidth(options.xAxisLabel) / 2 - AXIS_TITLE_GAP
  );
  return Math.max(0, Math.min(available, reserved));
}

// Greedy row packing of legend items. Returns { rowCount, positions } where
// positions[i] = { row, x } for labels[i], or null when the layout cannot fit:
// a third row would be needed, or any single item alone overflows the width.
export function computeInlineRows(labels, availableWidth, titleWidth, firstRowWidth) {
  if (!Array.isArray(labels) || labels.length === 0 || !(availableWidth > 0)) {
    return null;
  }

  // The first row shares its baseline band with the centred x-axis title and so
  // may be narrower than the rest; callers that do not care pass nothing.
  var firstWidth = firstRowWidth > 0 ? Math.min(firstRowWidth, availableWidth) : availableWidth;

  // The title occupies the head of the first row only; wrapped rows start at 0.
  var lead = titleWidth > 0 ? titleWidth : 0;
  if (lead >= firstWidth) {
    return null;
  }

  var positions = [];
  var row = 0;
  var cursor = lead;

  for (var i = 0; i < labels.length; i++) {
    var width = estimateItemWidth(labels[i]);
    if (width > availableWidth) {
      return null;
    }
    var rowWidth = row === 0 ? firstWidth : availableWidth;
    if (cursor > 0 && cursor + width > rowWidth) {
      row += 1;
      cursor = 0;
      if (row >= MAX_INLINE_ROWS) {
        return null;
      }
      rowWidth = availableWidth;
      if (width > rowWidth) {
        return null;
      }
    }
    positions.push({ row: row, x: cursor });
    cursor += width;
  }

  return { rowCount: row + 1, positions: positions };
}

// Policy rules in first-match-wins order (see md/design/legend-button-ui.md).
// opts: { type, labels, suppressLegend, availableWidth, titleWidth } where labels are the
// deduplicated legend item labels.
export function resolveLegendPlacement(opts) {
  var options = opts || {};
  var labels = Array.isArray(options.labels) ? options.labels : [];

  if (options.suppressLegend === true) {
    return { inline: false, panel: false, reason: "suppressed" };
  }
  if (!options.type) {
    return { inline: false, panel: false, reason: "no-legend" };
  }
  if (options.type === "continuous") {
    return { inline: false, panel: true, reason: "continuous" };
  }
  if (labels.length < 2) {
    return { inline: false, panel: true, reason: "too-few-items" };
  }
  if (labels.length > MAX_INLINE_ITEMS) {
    return { inline: false, panel: true, reason: "too-many-items" };
  }
  if (computeInlineRows(labels, options.availableWidth, options.titleWidth || 0,
                        options.firstRowWidth) === null) {
    return { inline: false, panel: true, reason: "too-narrow" };
  }
  return { inline: true, panel: false, reason: "inline-active" };
}

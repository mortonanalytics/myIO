// WCAG 2.1 relative luminance / contrast helpers for text drawn on top of marks.
var DARK_INK = "#000000";
var LIGHT_INK = "#ffffff";

function channelLuminance(value) {
  var c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(color) {
  var parsed = d3.color(color);
  if (!parsed) {
    return 0;
  }
  var rgb = parsed.rgb();
  return 0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b);
}

export function contrastRatio(foreground, background) {
  var a = relativeLuminance(foreground);
  var b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function readableTextColor(background) {
  return contrastRatio(DARK_INK, background) >= contrastRatio(LIGHT_INK, background)
    ? DARK_INK
    : LIGHT_INK;
}

export function chartBackgroundColor(chart) {
  var element = (chart && chart.dom && chart.dom.element) || (chart && chart.element) || null;
  if (element && typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
    var value = window.getComputedStyle(element).getPropertyValue("--chart-bg");
    if (value && value.trim() && d3.color(value.trim())) {
      return value.trim();
    }
  }
  return "#ffffff";
}

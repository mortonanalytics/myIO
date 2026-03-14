export function isMobile(chart) {
  return chart.totalWidth <= 600;
}

export function responsiveValue(chart, desktop, mobile) {
  return isMobile(chart) ? mobile : desktop;
}

export function pointRadius(chart) {
  return responsiveValue(chart, 5, 3);
}

export function strokeWidth(chart) {
  return responsiveValue(chart, 3, 1);
}

export function tagName(type, elementId, label) {
  return "tag-" + type + "-" + elementId + "-" + String(label).replace(/\s+/g, "");
}

export function isColorSchemeActive(chart) {
  return chart.options.colorScheme[2] == "on";
}

export function resolveColor(chart, colorKeyValue, fallback) {
  return isColorSchemeActive(chart) ? chart.colorScheme(colorKeyValue) : fallback;
}

const CHART_CSS_VARS = [
  // Text & font
  "--chart-text-color",
  "--chart-font",
  "--chart-annotation-font-size",
  // Grid
  "--chart-grid-color",
  "--chart-grid-opacity",
  // Backgrounds
  "--chart-bg",
  // Reference lines
  "--chart-ref-line-color",
  "--chart-ref-line-width",
  // Linked cursor crosshair
  "--chart-cursor-rule-color",
  "--chart-cursor-rule-width",
  // Annotations & accents
  "--chart-annotation-ring",
  "--chart-primary-color",
  // Brush
  "--chart-brush-fill",
  "--chart-brush-stroke",
  "--chart-brush-dim-opacity",
  // Legend
  "--chart-legend-inactive-opacity",
  // Status bar
  "--chart-status-bar-color"
];

export function resolveCSSVariables(svgClone, container) {
  var computed = getComputedStyle(container);
  var resolved = {};

  for (var i = 0; i < CHART_CSS_VARS.length; i++) {
    var prop = CHART_CSS_VARS[i];
    var val = computed.getPropertyValue(prop).trim();
    if (val) resolved[prop] = val;
  }

  // Set resolved values as inline CSS custom properties on the SVG root so
  // that CSS rules embedded in the exported <style> block (which reference
  // `var(--chart-*)`) pick up the theme overrides instead of the stylesheet
  // defaults. Inline style on the root has higher specificity than :root.
  var rootStyle = svgClone.getAttribute("style") || "";
  for (var p in resolved) {
    if (rootStyle.indexOf(p + ":") === -1) {
      rootStyle += (rootStyle && !/;\s*$/.test(rootStyle) ? ";" : "") + p + ":" + resolved[p];
    }
  }
  if (rootStyle) svgClone.setAttribute("style", rootStyle);

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Build one regex per resolvable var that also eats an optional fallback:
  //   var(--name)   and   var(--name, anything)
  var replacers = [];
  for (var key in resolved) {
    replacers.push({
      re: new RegExp("var\\(\\s*" + escapeRegex(key) + "\\s*(?:,\\s*[^)]*)?\\)", "g"),
      value: resolved[key]
    });
  }

  function applyReplacers(str) {
    for (var k = 0; k < replacers.length; k++) {
      str = str.replace(replacers[k].re, replacers[k].value);
    }
    return str;
  }

  var elements = svgClone.querySelectorAll("*");
  var allEls = [svgClone].concat(Array.prototype.slice.call(elements));

  for (var j = 0; j < allEls.length; j++) {
    var el = allEls[j];
    var style = el.getAttribute("style");
    if (style && style.indexOf("var(") !== -1) {
      el.setAttribute("style", applyReplacers(style));
    }

    var attrs = ["fill", "stroke", "color", "stop-color"];
    for (var a = 0; a < attrs.length; a++) {
      var attrVal = el.getAttribute(attrs[a]);
      if (attrVal && attrVal.indexOf("var(") !== -1) {
        el.setAttribute(attrs[a], applyReplacers(attrVal));
      }
    }
  }
}

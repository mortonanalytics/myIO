const CHART_CSS_VARS = [
  "--chart-text-color", "--chart-grid-color", "--chart-grid-opacity",
  "--chart-bg", "--chart-ref-line-color", "--chart-annotation-ring",
  "--chart-font"
];

export function resolveCSSVariables(svgClone, container) {
  var computed = getComputedStyle(container);
  var resolved = {};

  for (var i = 0; i < CHART_CSS_VARS.length; i++) {
    var prop = CHART_CSS_VARS[i];
    var val = computed.getPropertyValue(prop).trim();
    if (val) resolved[prop] = val;
  }

  var elements = svgClone.querySelectorAll("*");
  var allEls = [svgClone].concat(Array.prototype.slice.call(elements));

  for (var j = 0; j < allEls.length; j++) {
    var el = allEls[j];
    var style = el.getAttribute("style");
    if (style && style.indexOf("var(") !== -1) {
      var newStyle = style;
      for (var key in resolved) {
        newStyle = newStyle.split("var(" + key + ")").join(resolved[key]);
      }
      el.setAttribute("style", newStyle);
    }

    var attrs = ["fill", "stroke", "color", "stop-color"];
    for (var a = 0; a < attrs.length; a++) {
      var attrVal = el.getAttribute(attrs[a]);
      if (attrVal && attrVal.indexOf("var(") !== -1) {
        var match = attrVal.match(/var\((--[\w-]+)\)/);
        if (match && resolved[match[1]]) {
          el.setAttribute(attrs[a], resolved[match[1]]);
        }
      }
    }
  }
}

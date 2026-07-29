// Text measurement with a jsdom-safe fallback (getComputedTextLength is browser-only).
var FALLBACK_CHAR_WIDTH = 6.5;

export function textWidth(node, fallbackText) {
  if (node && typeof node.getComputedTextLength === "function") {
    return node.getComputedTextLength();
  }
  return String(fallbackText == null ? "" : fallbackText).length * FALLBACK_CHAR_WIDTH;
}

export function measureLabelWidth(parent, strings, fontSize) {
  var probe = parent.append("text")
    .attr("class", "myIO-label-probe")
    .style("font-size", fontSize)
    .style("visibility", "hidden");
  var max = 0;
  strings.forEach(function(value) {
    probe.text(value);
    var w = textWidth(probe.node(), value);
    if (w > max) {
      max = w;
    }
  });
  probe.remove();
  return max;
}

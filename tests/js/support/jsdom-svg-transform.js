// jsdom does not implement SVGGraphicsElement.transform, which d3-interpolate
// reads to tween a "transform" attribute. Without it, any code path that
// renders an axis through a transition -- i.e. every non-initial render --
// throws on the first animation frame, long after the test body has returned.
// An empty baseVal makes the interpolator fall back to its identity start,
// which is all a layout assertion needs.
if (typeof SVGElement !== "undefined" && !("transform" in SVGElement.prototype)) {
  Object.defineProperty(SVGElement.prototype, "transform", {
    get: function() {
      return { baseVal: { consolidate: function() { return null; } } };
    }
  });
}

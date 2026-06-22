// Public-transition-API easing + stagger helpers (P4-1).
//
// `easingFor(chart, fallback)` maps the string set via R `setTransition(easing=)`
// (read defensively off `chart.options.transition.easing`) to a d3 ease function.
// An unset/unknown name returns the caller's per-renderer default (`fallback`),
// so existing charts animate exactly as before. d3 is a global in the bundled
// widget (same access pattern as renderers).

var EASING_MAP = {
  linear: function () { return d3.easeLinear; },
  quad: function () { return d3.easeQuad; },
  cubic: function () { return d3.easeCubic; },
  sin: function () { return d3.easeSin; },
  exp: function () { return d3.easeExp; },
  circle: function () { return d3.easeCircle; },
  back: function () { return d3.easeBack; },
  bounce: function () { return d3.easeBounce; },
  elastic: function () { return d3.easeElastic; }
};

// Allowlist exported for the R-side check and for tests to stay in sync.
export var EASING_NAMES = Object.keys(EASING_MAP);

export function easingFor(chart, fallback) {
  var t = chart && chart.options && chart.options.transition;
  var name = t && t.easing;
  if (name && Object.prototype.hasOwnProperty.call(EASING_MAP, name)) {
    return EASING_MAP[name]();
  }
  return fallback;
}

// `staggerDelay(chart, fallback, indexFn)` returns a d3 `.delay` accessor that
// offsets each joined element by `stagger` ms * its index.
//   - effective duration 0 (setTransition(duration=0)/setTransitionSpeed(0) or
//     prefers-reduced-motion, which Chart.js maps to transitions.speed = 0)
//     -> hard no-op (delay 0), keeping animation fully opt-out-able.
//   - `stagger` unset -> per-renderer default `fallback` ms (preserves existing
//     behavior, e.g. bars staggered 20ms before this API existed).
//   - `stagger` a number (incl. 0) -> that value, overriding the default.
// `indexFn(d, i)` extracts the stagger index (default: the join index `i`); the
// grouped-bar path keys off `d.idx` instead.
export function staggerDelay(chart, fallback, indexFn) {
  var t = chart && chart.options && chart.options.transition;
  var speed = t && typeof t.speed === "number" ? t.speed : 0;
  if (speed <= 0) {
    return function () { return 0; };
  }
  var per = t && typeof t.stagger === "number" ? t.stagger : (fallback || 0);
  var idx = indexFn || function (d, i) { return i; };
  if (per <= 0) {
    return function () { return 0; };
  }
  return function (d, i) { return idx(d, i) * per; };
}

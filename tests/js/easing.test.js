import * as d3 from "d3";
import { describe, expect, test } from "vitest";
import { easingFor, staggerDelay, EASING_NAMES } from "../../inst/htmlwidgets/myIO/src/transitions/easing.js";

globalThis.d3 = d3;

function chartWith(transition) {
  return { options: { transition: transition } };
}

describe("easingFor", () => {
  test("maps each allowlisted name to a d3 ease function", () => {
    const expected = {
      linear: d3.easeLinear, quad: d3.easeQuad, cubic: d3.easeCubic,
      sin: d3.easeSin, exp: d3.easeExp, circle: d3.easeCircle,
      back: d3.easeBack, bounce: d3.easeBounce, elastic: d3.easeElastic
    };
    for (const name of EASING_NAMES) {
      expect(easingFor(chartWith({ easing: name }), d3.easeQuadOut)).toBe(expected[name]);
    }
  });

  test("unknown name falls back to the per-renderer default", () => {
    expect(easingFor(chartWith({ easing: "wobble" }), d3.easeBack)).toBe(d3.easeBack);
  });

  test("unset easing falls back to the per-renderer default", () => {
    expect(easingFor(chartWith({ speed: 1000 }), d3.easeQuadOut)).toBe(d3.easeQuadOut);
  });

  test("missing transition object does not throw and returns fallback", () => {
    expect(easingFor({ options: {} }, d3.easeQuad)).toBe(d3.easeQuad);
    expect(easingFor({}, d3.easeQuad)).toBe(d3.easeQuad);
  });
});

describe("staggerDelay", () => {
  test("uses stagger * index when duration > 0", () => {
    const fn = staggerDelay(chartWith({ speed: 1000, stagger: 30 }), 20);
    expect(fn(null, 0)).toBe(0);
    expect(fn(null, 3)).toBe(90);
  });

  test("falls back to per-renderer default when stagger unset", () => {
    const fn = staggerDelay(chartWith({ speed: 1000 }), 20);
    expect(fn(null, 2)).toBe(40);
  });

  test("explicit stagger 0 overrides the default (no stagger)", () => {
    const fn = staggerDelay(chartWith({ speed: 1000, stagger: 0 }), 20);
    expect(fn(null, 5)).toBe(0);
  });

  test("hard no-op under opt-out (duration 0 / reduced-motion)", () => {
    const fn = staggerDelay(chartWith({ speed: 0, stagger: 30 }), 20);
    expect(fn(null, 5)).toBe(0);
  });

  test("custom index accessor (grouped path keys off d.idx)", () => {
    const fn = staggerDelay(chartWith({ speed: 1000, stagger: 10 }), 20, (d) => d.idx);
    expect(fn({ idx: 4 }, 0)).toBe(40);
  });
});

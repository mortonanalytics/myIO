import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

// setTransition(easing =, stagger =) is documented as applying to every chart
// type. It only does if each renderer actually threads easingFor()/staggerDelay()
// into its transitions -- a renderer that calls .transition().duration() alone
// honours duration and silently ignores the other two.
//
// Eleven renderers shipped fully unwired and fourteen more were wired only on
// their enter/update joins, because the transition e2e fixture only builds
// "bar" and "point". This asserts the invariant over the sources instead, so a
// renderer added later cannot reintroduce the gap without failing here.
//
// Easing is required at every transition; stagger is not. Some transitions use
// .delay() for sequencing (PointRenderer chains label fades behind the marks),
// and a stagger accessor there would overwrite the choreography.

var RENDERER_DIR = join(process.cwd(), "inst/htmlwidgets/myIO/src/renderers");

function countOccurrences(source, needle) {
  return source.split(needle).length - 1;
}

var renderers = readdirSync(RENDERER_DIR)
  .filter(function(name) { return name.endsWith(".js"); })
  .map(function(name) {
    var source = readFileSync(join(RENDERER_DIR, name), "utf8");
    return {
      name: name,
      source: source,
      transitions: countOccurrences(source, ".transition()"),
      eased: countOccurrences(source, ".ease(easingFor("),
      staggered: countOccurrences(source, ".delay(staggerDelay(")
    };
  });

describe("renderer transition wiring", function() {
  test("the renderer directory is non-empty", function() {
    expect(renderers.length).toBeGreaterThan(20);
  });

  renderers.forEach(function(renderer) {
    if (renderer.transitions === 0) {
      return;
    }

    test(renderer.name + " eases every transition", function() {
      expect(renderer.eased).toBe(renderer.transitions);
    });

    test(renderer.name + " imports the easing helper it calls", function() {
      expect(renderer.source).toContain('from "../transitions/easing.js"');
      expect(renderer.source).toContain("easingFor");
    });

    test(renderer.name + " declares staggerDelay only if it calls it", function() {
      if (renderer.staggered > 0) {
        expect(renderer.source).toContain("staggerDelay");
      }
    });
  });
});

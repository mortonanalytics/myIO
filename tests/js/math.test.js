import { describe, expect, test } from "vitest";
import { linearRegression, onlyUnique } from "../../inst/htmlwidgets/myIO/src/utils/math.js";

describe("linearRegression", function() {
  test("computes correct slope and intercept for perfect line", function() {
    var data = [{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }];
    var lr = linearRegression(data, "y", "x");
    expect(lr.slope).toBeCloseTo(2, 5);
    expect(lr.intercept).toBeCloseTo(0, 5);
    expect(lr.r2).toBeCloseTo(1, 5);
  });

  test("fn method predicts correctly", function() {
    var data = [{ x: 0, y: 5 }, { x: 10, y: 15 }];
    var lr = linearRegression(data, "y", "x");
    expect(lr.fn(5)).toBeCloseTo(10, 5);
    expect(lr.fn(0)).toBeCloseTo(5, 5);
  });

  test("handles negative slope", function() {
    var data = [{ x: 1, y: 10 }, { x: 2, y: 8 }, { x: 3, y: 6 }];
    var lr = linearRegression(data, "y", "x");
    expect(lr.slope).toBeCloseTo(-2, 5);
    expect(lr.intercept).toBeCloseTo(12, 5);
  });

  test("handles single point", function() {
    var data = [{ x: 5, y: 10 }];
    var lr = linearRegression(data, "y", "x");
    expect(Number.isFinite(lr.slope) || Number.isNaN(lr.slope)).toBe(true);
  });

  test("handles flat line (zero slope)", function() {
    var data = [{ x: 1, y: 5 }, { x: 2, y: 5 }, { x: 3, y: 5 }];
    var lr = linearRegression(data, "y", "x");
    expect(lr.slope).toBeCloseTo(0, 5);
    expect(lr.intercept).toBeCloseTo(5, 5);
  });
});

describe("onlyUnique", function() {
  test("filters duplicates", function() {
    var arr = [1, 2, 2, 3, 3, 3, 4];
    expect(arr.filter(onlyUnique)).toEqual([1, 2, 3, 4]);
  });

  test("keeps all unique values", function() {
    var arr = ["a", "b", "c"];
    expect(arr.filter(onlyUnique)).toEqual(["a", "b", "c"]);
  });

  test("handles empty array", function() {
    expect([].filter(onlyUnique)).toEqual([]);
  });

  test("handles single element", function() {
    expect([42].filter(onlyUnique)).toEqual([42]);
  });
});

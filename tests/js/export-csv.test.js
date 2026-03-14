import { describe, expect, test, vi, beforeEach } from "vitest";
import { exportToCsv } from "../../inst/htmlwidgets/myIO/src/utils/export-csv.js";

describe("exportToCsv", function() {
  beforeEach(function() {
    // Mock URL.createObjectURL and revokeObjectURL
    globalThis.URL.createObjectURL = vi.fn(function() { return "blob:test"; });
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  test("generates CSV content and triggers download", function() {
    var clickSpy = vi.fn();
    var appendSpy = vi.fn();
    var removeSpy = vi.fn();

    vi.spyOn(document, "createElement").mockReturnValue({
      download: "",
      setAttribute: vi.fn(),
      style: {},
      click: clickSpy
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(appendSpy);
    vi.spyOn(document.body, "removeChild").mockImplementation(removeSpy);

    var rows = [
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 }
    ];

    exportToCsv("test.csv", rows);

    expect(clickSpy).toHaveBeenCalledOnce();
    expect(appendSpy).toHaveBeenCalledOnce();
    expect(removeSpy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });

  test("handles single row data", function() {
    var clickSpy = vi.fn();
    vi.spyOn(document, "createElement").mockReturnValue({
      download: "",
      setAttribute: vi.fn(),
      style: {},
      click: clickSpy
    });
    vi.spyOn(document.body, "appendChild").mockImplementation(function() {});
    vi.spyOn(document.body, "removeChild").mockImplementation(function() {});

    exportToCsv("single.csv", [{ x: 1, y: 2 }]);
    expect(clickSpy).toHaveBeenCalledOnce();

    vi.restoreAllMocks();
  });
});

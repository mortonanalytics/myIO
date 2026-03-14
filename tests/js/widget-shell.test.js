import { describe, expect, test } from "vitest";

describe("widget shell", function() {
  test("registers the htmlwidget factory", async function() {
    let registered = null;
    globalThis.myIOchart = function() {};
    globalThis.HTMLWidgets = {
      shinyMode: false,
      widget(definition) {
        registered = definition;
      }
    };

    await import("../../inst/htmlwidgets/myIO.js");
    expect(registered.name).toBe("myIO");
    expect(typeof registered.factory).toBe("function");
  });
});

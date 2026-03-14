import { describe, expect, test } from "vitest";
import { getRenderer, registerBuiltInRenderers } from "../../inst/htmlwidgets/myIO/src/registry.js";

describe("registry", function() {
  test("register/get renderer round trip", function() {
    registerBuiltInRenderers();
    expect(getRenderer("line").constructor.type).toBe("line");
  });
});

import { describe, it, expect } from "vitest";
import { Coordinator, bootCoordinator } from "../../inst/htmlwidgets/myIO/src/coordinator/index.js";

describe("Coordinator", () => {
  it("composes AND-of-others predicate (self excluded)", () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    c.register({ chartId: "a", queryTemplate: "SQL", markSpec: {},
      sourceHandle: { sourceId: "s1" }, predicateFn: () => null });
    c.register({ chartId: "b", queryTemplate: "SQL", markSpec: {},
      sourceHandle: { sourceId: "s1" }, predicateFn: () => null });
    c.register({ chartId: "c", queryTemplate: "SQL", markSpec: {},
      sourceHandle: { sourceId: "s1" }, predicateFn: () => null });
    c.setSelection({ chartId: "a", predicate: "x > 1" });
    c.setSelection({ chartId: "b", predicate: "y < 5" });
    const p = c._composeOthersPredicate("c", "s1");
    expect(p).toContain("x > 1");
    expect(p).toContain("y < 5");
  });

  it("unregister clears selection and debouncers", () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    c.register({ chartId: "a", queryTemplate: "", markSpec: {},
      sourceHandle: { sourceId: "s1" }, predicateFn: () => null });
    c.setSelection({ chartId: "a", predicate: "x > 1" });
    c.unregister("a");
    const p = c._composeOthersPredicate("anything", "s1");
    expect(p).toBe("TRUE");
  });

  it("bootCoordinator is idempotent per page", () => {
    delete globalThis.__myioCoordinator;
    const a = bootCoordinator({ engine: "svg" });
    const b = bootCoordinator({ engine: "svg" });
    expect(a).toBe(b);
    delete globalThis.__myioCoordinator;
  });

  it("substituteTemplate replaces {{where}} and {{limit}}", () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    const sql = c._substituteTemplate("SELECT * WHERE {{where}} LIMIT {{limit}}",
      { where: "x > 0", limit: 100 });
    expect(sql).toBe("SELECT * WHERE x > 0 LIMIT 100");
  });

  it("hash is deterministic for same input", async () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    const h1 = await c._hash("SELECT 1");
    const h2 = await c._hash("SELECT 1");
    expect(h1).toBe(h2);
    const h3 = await c._hash("SELECT 2");
    expect(h3).not.toBe(h1);
  });
});

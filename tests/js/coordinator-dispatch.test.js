import { describe, it, expect, vi } from "vitest";
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

  it("schedules initial dispatch only with queryTemplate and onResult", async () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    c._dispatch = vi.fn();
    c.register({
      chartId: "with-result",
      queryTemplate: "SELECT * FROM s WHERE {{where}} LIMIT {{limit}}",
      markSpec: {},
      sourceHandle: { sourceId: "s1" },
      predicateFn: () => null,
      onResult: () => {}
    });
    c.register({
      chartId: "empty-template",
      queryTemplate: "",
      markSpec: {},
      sourceHandle: { sourceId: "s1" },
      predicateFn: () => null,
      onResult: () => {}
    });
    c.register({
      chartId: "no-result",
      queryTemplate: "SELECT * FROM s",
      markSpec: {},
      sourceHandle: { sourceId: "s1" },
      predicateFn: () => null
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(c._dispatch).toHaveBeenCalledTimes(1);
    expect(c._dispatch).toHaveBeenCalledWith("with-result", { preview: false });
  });

  it("dedupes parallel adapter initialization", async () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    const p1 = c.ensureAdapterFor("s1", "svg", {});
    const p2 = c.ensureAdapterFor("s1", "svg", {});
    expect(p1).toBe(p2);
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(b);
    await expect(c.ensureAdapterFor("s1", "svg", {})).resolves.toBe(a);
  });

  it("aborts in-flight dispatch on unregister", async () => {
    const c = new Coordinator({ config: { engine: "memory" } });
    let seenSignal;
    let queryStartedResolve;
    const queryStarted = new Promise((resolve) => {
      queryStartedResolve = resolve;
    });
    c.adapters.set("s1", {
      async init() {},
      async close() {},
      async *query({ signal }) {
        seenSignal = signal;
        queryStartedResolve();
        await new Promise((resolve) => setTimeout(resolve, 20));
        if (signal.aborted) return;
        yield { rows: [{ x: 1, y: 2 }] };
      }
    });
    const onResult = vi.fn();
    c.register({
      chartId: "chart",
      queryTemplate: "",
      markSpec: {},
      sourceHandle: { sourceId: "s1", engine: "memory" },
      predicateFn: () => null,
      onResult
    });
    c.charts.get("chart").queryTemplate = "SELECT x, y FROM s WHERE {{where}} LIMIT {{limit}}";

    const dispatch = c._dispatch("chart", { preview: false });
    await queryStarted;
    c.unregister("chart");
    await dispatch;
    expect(seenSignal.aborted).toBe(true);
    expect(onResult).not.toHaveBeenCalled();
    expect(c.cache.size()).toBe(0);
  });

  it("delivers query errors as trailer errors without uncaught rejection", async () => {
    const c = new Coordinator({ config: { engine: "memory" } });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c.adapters.set("s1", {
      async init() {},
      async close() {},
      async *query() {
        throw new Error("adapter exploded");
      }
    });
    const onResult = vi.fn();
    c.register({
      chartId: "chart",
      queryTemplate: "",
      markSpec: {},
      sourceHandle: { sourceId: "s1", engine: "memory" },
      predicateFn: () => null,
      onResult
    });
    c.charts.get("chart").queryTemplate = "SELECT x, y FROM s WHERE {{where}} LIMIT {{limit}}";

    await c._dispatch("chart", { preview: false });
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      batches: [],
      trailer: expect.objectContaining({ error: "adapter exploded" })
    }));
    errSpy.mockRestore();
  });

  it("delivers adapter init failures as trailer errors", async () => {
    const c = new Coordinator({ config: { engine: "svg" } });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    c.ensureAdapterFor = vi.fn(() => Promise.reject(new Error("init exploded")));
    const onResult = vi.fn();
    c.register({
      chartId: "chart",
      queryTemplate: "",
      markSpec: {},
      sourceHandle: { sourceId: "s1", engine: "svg" },
      predicateFn: () => null,
      onResult
    });
    c.charts.get("chart").queryTemplate = "SELECT x, y FROM s WHERE {{where}} LIMIT {{limit}}";

    await c._dispatch("chart", { preview: false });
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({
      batches: [],
      trailer: expect.objectContaining({ error: "init exploded" })
    }));
    errSpy.mockRestore();
  });
});

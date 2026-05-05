import { describe, it, expect } from "vitest";
import { QueryCache } from "../../inst/htmlwidgets/myIO/src/coordinator/query-cache.js";

describe("QueryCache", () => {
  it("stores and retrieves values", () => {
    const c = new QueryCache({ max: 3 });
    c.set("a", 1);
    expect(c.get("a")).toBe(1);
  });

  it("evicts oldest when max is exceeded", () => {
    const c = new QueryCache({ max: 2 });
    c.set("a", 1); c.set("b", 2); c.set("c", 3);
    expect(c.get("a")).toBeUndefined();
    expect(c.get("b")).toBe(2);
    expect(c.get("c")).toBe(3);
  });

  it("moves touched key to MRU on get", () => {
    const c = new QueryCache({ max: 2 });
    c.set("a", 1); c.set("b", 2);
    // Touch a -> MRU
    expect(c.get("a")).toBe(1);
    c.set("c", 3);  // should evict b (LRU), not a
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBeUndefined();
    expect(c.get("c")).toBe(3);
  });

  it("delete removes a key", () => {
    const c = new QueryCache();
    c.set("a", 1);
    c.delete("a");
    expect(c.get("a")).toBeUndefined();
  });

  it("clear empties the cache", () => {
    const c = new QueryCache();
    c.set("a", 1); c.set("b", 2);
    c.clear();
    expect(c.size()).toBe(0);
  });

  it("inflightOrStore dedupes concurrent queries for same key", async () => {
    const c = new QueryCache();
    let callCount = 0;
    const factory = () => {
      callCount++;
      return new Promise(resolve => setTimeout(() => resolve("result"), 10));
    };
    const p1 = c.inflightOrStore("k1", factory);
    const p2 = c.inflightOrStore("k1", factory);
    expect(p1).toBe(p2);
    expect(callCount).toBe(1);
    const v = await p1;
    c.resolveInflight("k1", v);
    expect(c.get("k1")).toBe("result");
  });

  it("rejectInflight clears in-flight without caching", async () => {
    const c = new QueryCache();
    const rejected = c.inflightOrStore("k1", () => Promise.reject(new Error("x")));
    c.rejectInflight("k1");
    await expect(rejected).rejects.toThrow("x");
    expect(c.get("k1")).toBeUndefined();
    // Should allow a fresh attempt after reject.
    let called = 0;
    c.inflightOrStore("k1", () => { called++; return Promise.resolve("v"); });
    expect(called).toBe(1);
  });
});

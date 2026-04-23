import { describe, it, expect } from "vitest";
import { lttbSQL, lttbSlots } from "../../inst/htmlwidgets/myIO/src/decimate/lttb.js";

describe("LTTB SQL template", () => {
  it("emits NTILE(bucket) in the SQL", () => {
    const sql = lttbSQL({ bucket: 500 });
    expect(sql).toContain("NTILE(500)");
  });

  it("respects the bucket parameter lower bound", () => {
    // floor(0.3) -> 0 would be invalid; impl floors to 2 minimum.
    const sql = lttbSQL({ bucket: 0.3 });
    expect(sql).toMatch(/NTILE\((\d+)\)/);
    const n = Number(sql.match(/NTILE\((\d+)\)/)[1]);
    expect(n).toBeGreaterThanOrEqual(2);
  });

  it("uses integer bucket counts (no floats in SQL)", () => {
    const sql = lttbSQL({ bucket: 750.8 });
    expect(sql).toContain("NTILE(750)");
  });

  it("has placeholders for source / xcol / ycol / where / limit", () => {
    const sql = lttbSQL({ bucket: 100 });
    expect(sql).toContain("{{source}}");
    expect(sql).toContain("{{xcol}}");
    expect(sql).toContain("{{ycol}}");
    expect(sql).toContain("{{where}}");
    expect(sql).toContain("{{limit}}");
  });

  it("slots manifest declares identifier slots, no value slots", () => {
    expect(lttbSlots.ident_slots).toEqual(["source", "xcol", "ycol"]);
    expect(lttbSlots.value_slots).toEqual([]);
  });
});

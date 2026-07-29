import { describe, expect, test } from "vitest";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { buildSchema } from "../../tools/build-myio-schema.mjs";

function sorted(values) {
  return Array.from(values).sort();
}

// Fresh generation shells out to Rscript; skip on Node-only CI runners that
// lack R. Drift is still enforced locally and on any R-capable runner.
const hasRscript = spawnSync("Rscript", ["--version"]).error === undefined;

describe("generated myIO schema", function() {
  test.skipIf(!hasRscript)("committed schema matches a fresh generation exactly", function() {
    const committed = JSON.parse(fs.readFileSync("inst/myio-schema.json", "utf8"));
    const generated = buildSchema();
    expect(committed).toEqual(generated);
  });

  test("the inst and mcp schema copies are byte-identical", function() {
    // tools/build-myio-schema.mjs writeSchemas() writes one JSON string to both
    // paths. mcp/lib/validate.mjs loads the mcp copy at runtime, so a hand-edit
    // or a partial regen would leave the MCP validator running an older
    // contract with every other test still green. The freshness test above
    // cannot catch it: it reads only inst/, and it skips whenever the runner
    // has no Rscript -- which is every CI runner we have.
    expect(fs.readFileSync("mcp/myio-schema.json", "utf8"))
      .toBe(fs.readFileSync("inst/myio-schema.json", "utf8"));
  });

  test("schema sets have no missing or orphan contract entries", function() {
    const schema = JSON.parse(fs.readFileSync("inst/myio-schema.json", "utf8"));
    const typeKeys = Object.keys(schema.types);

    expect(sorted(schema.renderer_types)).toEqual(sorted(
      typeKeys.filter(function(type) { return schema.types[type].renderer_type; })
    ));
    expect(sorted(schema.composites)).toEqual(sorted(
      typeKeys.filter(function(type) { return schema.types[type].kind === "composite"; })
    ));
    expect(sorted(Object.keys(schema.compatibility_groups))).toEqual(sorted(typeKeys));

    for (const type of typeKeys) {
      expect(schema.types[type].required_mappings).toBeDefined();
      expect(schema.types[type].numeric_fields).toBeDefined();
      expect(schema.types[type].valid_transforms).toBeDefined();
      expect(schema.types[type].group).toBe(schema.compatibility_groups[type]);
    }

    for (const type of schema.renderer_types) {
      expect(schema.types[type]).toBeDefined();
      expect(schema.types[type].renderer_type).toBe(true);
    }
    for (const type of schema.composites) {
      expect(schema.types[type]).toBeDefined();
      expect(schema.types[type].kind).toBe("composite");
    }

    expect(schema.transforms).toContain("identity");
    expect(schema.function_signatures.setAxisFormat).toEqual([
      "myIO", "xAxis", "yAxis", "toolTip", "xLabel", "yLabel"
    ]);
  });

  test("JS composition compatibility groups match generated R groups", async function() {
    const source = fs.readFileSync("inst/htmlwidgets/myIO/src/derive/validate.js", "utf8");
    const match = source.match(/const COMPAT_GROUP = (\{[\s\S]*?\n\});/);
    expect(match).not.toBeNull();
    const compatGroup = Function(`"use strict"; return (${match[1]});`)();
    const schema = JSON.parse(fs.readFileSync("inst/myio-schema.json", "utf8"));
    expect(compatGroup).toEqual(schema.compatibility_groups);
  });
});

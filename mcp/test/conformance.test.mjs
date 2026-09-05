import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  getChartSchema,
  getFunctionSignature,
  listChartTypes,
  listFunctions,
  validateCall,
  validateSpec
} from "../lib/validate.mjs";

const corpus = JSON.parse(fs.readFileSync("../tests/fixtures/validate-conformance.json", "utf8"));

function runCase(item) {
  if (item.tool === "validate_spec") return validateSpec(item.input);
  if (item.tool === "validate_call") return validateCall(item.input);
  throw new Error(`Unknown corpus tool ${item.tool}`);
}

test("shared validation conformance corpus", function() {
  for (const item of corpus) {
    const result = runCase(item);
    assert.equal(result.valid, item.valid, item.name);
    assert.deepEqual(result.errors.map(function(err) { return err.code; }), item.error_codes, item.name);
    for (const target of item.suggestion_targets || []) {
      assert.ok(
        result.errors.some(function(err) { return err.suggestion === target; }),
        `${item.name}: expected suggestion ${target}`
      );
    }
  }
});

test("tool helpers expose chart and function surfaces", function() {
  for (const name of ["toString", "constructor", "__proto__"]) {
    assert.equal(getChartSchema(name), null);
    assert.equal(getFunctionSignature(name), null);
  }
  assert.ok(listChartTypes().includes("point"));
  assert.ok(listChartTypes().includes("fan"));
  assert.equal(getChartSchema("boxplot").kind, "composite");
  assert.ok(listFunctions().includes("setAxisFormat"));
  assert.deepEqual(
    getFunctionSignature("setAxisFormat"),
    ["myIO", "xAxis", "yAxis", "toolTip", "xLabel", "yLabel"]
  );
});

#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const RENDERER_DIR = path.join(ROOT, "inst/htmlwidgets/myIO/src/renderers");
const INST_SCHEMA = path.join(ROOT, "inst/myio-schema.json");
const MCP_SCHEMA = path.join(ROOT, "mcp/myio-schema.json");

function extractStaticExpression(source, name) {
  const marker = `static ${name}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return undefined;
  const equalsIndex = source.indexOf("=", markerIndex);
  if (equalsIndex < 0) return undefined;

  let index = equalsIndex + 1;
  while (/\s/.test(source[index])) index += 1;
  const start = index;
  const stack = [];
  let quote = null;
  let escaped = false;

  for (; index < source.length; index += 1) {
    const ch = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "\"" || ch === "'" || ch === "`") {
      quote = ch;
      continue;
    }
    if (ch === "{" || ch === "[" || ch === "(") {
      stack.push(ch);
      continue;
    }
    if (ch === "}" || ch === "]" || ch === ")") {
      stack.pop();
      continue;
    }
    if (ch === ";" && stack.length === 0) {
      return source.slice(start, index).trim();
    }
  }
  return source.slice(start).trim();
}

function evaluateLiteral(expression) {
  if (expression === undefined) return undefined;
  return Function(`"use strict"; return (${expression});`)();
}

// dump-r-contracts.R serializes with jsonlite auto_unbox=TRUE, which renders a
// length-1 vector (e.g. c("value")) as a scalar string. Downstream validators
// iterate these fields and treat a string as iterable — splitting "value" into
// v,a,l,u,e. Force every list-typed field back to an array here so the schema
// is canonical and consumers never see a scalar.
function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function readRendererContracts() {
  const files = fs.readdirSync(RENDERER_DIR)
    .filter((file) => file.endsWith("Renderer.js"))
    .sort();
  const renderers = {};
  for (const file of files) {
    const source = fs.readFileSync(path.join(RENDERER_DIR, file), "utf8");
    const type = evaluateLiteral(extractStaticExpression(source, "type"));
    if (!type) continue;
    renderers[type] = {
      file,
      data_contract: evaluateLiteral(extractStaticExpression(source, "dataContract")) ?? {},
      scale_hints: evaluateLiteral(extractStaticExpression(source, "scaleHints")) ?? null
    };
  }
  return renderers;
}

export function buildSchema() {
  const rContracts = JSON.parse(execFileSync(
    "Rscript",
    ["tools/dump-r-contracts.R"],
    { cwd: ROOT, encoding: "utf8" }
  ));
  const renderers = readRendererContracts();
  const composites = asArray(rContracts.composites);
  const types = {};

  for (const type of rContracts.allowed_types) {
    const renderer = renderers[type] || null;
    const validTransforms = asArray(rContracts.valid_combinations[type]);
    types[type] = {
      kind: composites.includes(type) ? "composite" : "primitive",
      renderer_type: Boolean(renderer),
      required_mappings: asArray(rContracts.required_mappings[type]),
      numeric_fields: asArray(rContracts.numeric_fields[type]),
      valid_transforms: validTransforms.length ? validTransforms : ["identity"],
      group: rContracts.compatibility_groups[type] || "unknown",
      data_contract: renderer ? renderer.data_contract : null,
      scale_hints: renderer ? renderer.scale_hints : null
    };
  }

  return {
    schema_version: 1,
    generated_from: {
      renderers: "inst/htmlwidgets/myIO/src/renderers",
      r_contracts: "tools/dump-r-contracts.R"
    },
    error_codes: [
      "UNKNOWN_TYPE",
      "MISSING_MAPPING",
      "UNKNOWN_MAPPING_KEY",
      "INVALID_TRANSFORM",
      "MISSING_COLUMN",
      "NON_NUMERIC_COLUMN",
      "UNKNOWN_FUNCTION",
      "UNKNOWN_ARGUMENT"
    ],
    types,
    renderer_types: Object.keys(renderers).sort(),
    composites,
    transforms: asArray(rContracts.transforms),
    compatibility_groups: rContracts.compatibility_groups,
    transform_input_contracts: rContracts.transform_input_contracts,
    function_signatures: Object.fromEntries(
      Object.entries(rContracts.function_signatures)
        .map(([fn, args]) => [fn, asArray(args)])
    )
  };
}

export function writeSchemas(schema = buildSchema()) {
  const json = `${JSON.stringify(schema, null, 2)}\n`;
  fs.mkdirSync(path.dirname(INST_SCHEMA), { recursive: true });
  fs.mkdirSync(path.dirname(MCP_SCHEMA), { recursive: true });
  fs.writeFileSync(INST_SCHEMA, json);
  fs.writeFileSync(MCP_SCHEMA, json);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeSchemas();
}

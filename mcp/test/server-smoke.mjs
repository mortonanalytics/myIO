import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { TOOL_NAMES } from "../server.mjs";

assert.equal(TOOL_NAMES.length, 6);
assert.deepEqual(TOOL_NAMES, [
  "list_chart_types",
  "get_chart_schema",
  "validate_spec",
  "list_functions",
  "get_function_signature",
  "validate_call"
]);

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["server.mjs"],
  cwd: new URL("..", import.meta.url).pathname,
  stderr: "pipe"
});
const client = new Client({ name: "myio-smoke", version: "0.1.0" });
await client.connect(transport);
const listed = await client.listTools();
assert.deepEqual(
  listed.tools.map(function(tool) { return tool.name; }).sort(),
  TOOL_NAMES.slice().sort()
);
await client.close();

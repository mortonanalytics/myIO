// Live final-gate test: Ollama tool-calling driven through the SHIPPED mcp/server.mjs.
// Bridges MCP tools -> Ollama /api/chat tools. Not committed; run ad hoc.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";
const OLLAMA = process.env.OLLAMA_HOST || "http://localhost:11434";

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["server.mjs"],
  cwd: new URL("..", import.meta.url).pathname,
  stderr: "pipe"
});
const mcp = new Client({ name: "ollama-bridge", version: "0.1.0" });
await mcp.connect(transport);
const { tools } = await mcp.listTools();

// MCP inputSchema (JSON Schema) -> Ollama tool defs
const ollamaTools = tools.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.inputSchema || { type: "object", properties: {} }
  }
}));

async function callMcp(name, args) {
  const res = await mcp.callTool({ name, arguments: args || {} });
  const text = (res.content || []).map((c) => c.text).join("\n");
  return text;
}

async function chat(messages) {
  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages, tools: ollamaTools, stream: false })
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}: ${await r.text()}`);
  return (await r.json()).message;
}

async function runTask(label, system, user, maxRounds = 6) {
  console.log(`\n===== ${label} (${MODEL}) =====`);
  const messages = [
    { role: "system", content: system },
    { role: "user", content: user }
  ];
  for (let round = 0; round < maxRounds; round += 1) {
    const msg = await chat(messages);
    messages.push(msg);
    if (msg.tool_calls && msg.tool_calls.length) {
      for (const tc of msg.tool_calls) {
        const name = tc.function.name;
        let args = tc.function.arguments;
        if (typeof args === "string") { try { args = JSON.parse(args); } catch { args = {}; } }
        const out = await callMcp(name, args);
        console.log(`  round ${round}: ${name}(${JSON.stringify(args)}) -> ${out.replace(/\s+/g, " ").slice(0, 160)}`);
        messages.push({ role: "tool", content: out });
      }
    } else {
      console.log(`  FINAL: ${(msg.content || "").trim().slice(0, 300)}`);
      return msg.content || "";
    }
  }
  console.log("  (max rounds reached)");
  return "";
}

await runTask(
  "TASK 1: known-failing boxplot -> valid spec",
  "You build myIO chart specs. Before finalizing, ALWAYS call validate_spec. If it returns valid=false, read the error codes and suggestions, fix the spec, and validate again. Only finalize when valid=true. Reply with the final JSON spec.",
  "Make a box plot of Sepal.Width grouped by Species. Naively you might call the mapping keys column_var and value_var."
);

await runTask(
  "TASK 2: wrong setAxisFormat arg -> corrected via validate_call",
  "You write myIO R function calls. Before finalizing, ALWAYS call validate_call to check the function name and argument names. If it returns valid=false, use the suggestions to fix argument names and validate again. Finalize only when valid=true.",
  "Format the x axis of a myIO widget as an integer. You think the argument might be called axis_x with value '.0f'."
);

await mcp.close();
console.log("\nbridge done");

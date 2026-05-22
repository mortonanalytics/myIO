#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  getChartSchema,
  getFunctionSignature,
  listChartTypes,
  listFunctions,
  validateCall,
  validateSpec
} from "./lib/validate.mjs";

function jsonResult(value) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2)
      }
    ]
  };
}

const MappingSchema = z.any().optional();
const ColumnsSchema = z.any().optional();

export const TOOL_NAMES = [
  "list_chart_types",
  "get_chart_schema",
  "validate_spec",
  "list_functions",
  "get_function_signature",
  "validate_call"
];

export function createServer() {
  const server = new McpServer({
    name: "myio-mcp",
    version: "0.1.0"
  });

  server.registerTool(
    "list_chart_types",
    {
      title: "List myIO chart types",
      description: "Return the chart type names supported by the generated myIO schema."
    },
    async function() {
      return jsonResult({ types: listChartTypes() });
    }
  );

  server.registerTool(
    "get_chart_schema",
    {
      title: "Get myIO chart schema",
      description: "Return the schema for one chart type, or all chart schemas when type is omitted.",
      inputSchema: {
        type: z.string().optional()
      }
    },
    async function(args) {
      return jsonResult(getChartSchema(args.type));
    }
  );

  server.registerTool(
    "validate_spec",
    {
      title: "Validate a myIO chart spec",
      description: "Validate chart type, mapping keys, transform, and optional column contracts.",
      inputSchema: {
        type: z.string(),
        mapping: MappingSchema,
        transform: z.string().optional(),
        columns: ColumnsSchema
      }
    },
    async function(args) {
      return jsonResult(validateSpec(args));
    }
  );

  server.registerTool(
    "list_functions",
    {
      title: "List myIO functions",
      description: "Return exported myIO function names from the generated schema."
    },
    async function() {
      return jsonResult({ functions: listFunctions() });
    }
  );

  server.registerTool(
    "get_function_signature",
    {
      title: "Get myIO function signature",
      description: "Return argument names for an exported myIO function, or all signatures when fn is omitted.",
      inputSchema: {
        fn: z.string().optional()
      }
    },
    async function(args) {
      return jsonResult(getFunctionSignature(args.fn));
    }
  );

  server.registerTool(
    "validate_call",
    {
      title: "Validate a myIO function call",
      description: "Validate an exported myIO function name and argument names.",
      inputSchema: {
        fn: z.string(),
        args: z.any().optional()
      }
    },
    async function(args) {
      return jsonResult(validateCall(args));
    }
  );

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

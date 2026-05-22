# myIO MCP Tools

This package exposes the generated myIO schema as MCP tools for agents that can call tools while building chart specs.

## Install

From the myIO repo:

```sh
cd mcp
npm install
```

The schema is bundled as `mcp/myio-schema.json`. Regenerate it from the repo root after contract changes:

```sh
npm run schema
```

## Run

```sh
cd mcp
node server.mjs
```

The server uses stdio transport and registers six tools:

- `list_chart_types`
- `get_chart_schema`
- `validate_spec`
- `list_functions`
- `get_function_signature`
- `validate_call`

## Client Config

Claude Desktop / Claude Code style config:

```json
{
  "mcpServers": {
    "myio": {
      "command": "node",
      "args": ["/absolute/path/to/myIO/mcp/server.mjs"]
    }
  }
}
```

Cursor uses the same command and args shape in its MCP server settings.

## Validation Shape

`validate_spec` input:

```json
{
  "type": "point",
  "mapping": { "x_var": "wt", "y_var": "mpg" },
  "transform": "identity",
  "columns": { "wt": "numeric", "mpg": "numeric" }
}
```

`columns` is optional. When present, mapped columns are checked for existence and numeric fields are checked against numeric column types.

`validate_call` input:

```json
{
  "fn": "setAxisFormat",
  "args": { "axis_x": ".0f" }
}
```

Domain errors are returned in tool results rather than as MCP protocol errors. Error codes are stable:

- `UNKNOWN_TYPE`
- `MISSING_MAPPING`
- `UNKNOWN_MAPPING_KEY`
- `INVALID_TRANSFORM`
- `MISSING_COLUMN`
- `NON_NUMERIC_COLUMN`
- `UNKNOWN_FUNCTION`
- `UNKNOWN_ARGUMENT`

## Test

```sh
npm test
npm run smoke
```

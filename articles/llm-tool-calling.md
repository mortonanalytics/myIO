# LLM Tool Calling

## The problem this solves

Ask an AI assistant to “make a box plot of Sepal.Width by Species with
myIO” and it will confidently write something. Often it is subtly wrong:
a chart type that doesn’t exist (`scatterplot` instead of `point`), a
mapping key it invented (`value_var` instead of `y_var`), or a function
argument with the wrong name (`setAxisFormat(axis_x = ...)`). The code
looks plausible and fails at runtime — or worse, runs and renders
nothing.

myIO ships the pieces that let an AI **check its work before it
commits**: a machine-readable description of every chart it can draw,
and a validator that flags structural mistakes and suggests the fix. The
result is that an assistant can generate a myIO chart, discover it got a
name wrong, correct it, and only then hand you working code.

## New to “tool calling”?

A short orientation; skip to [What you can rely
on](#what-you-can-rely-on) if this is familiar.

Modern LLMs can be given **tools** — functions you describe to the model
that it may call mid-conversation. Instead of answering in one shot, the
model can call a tool, read the result, and revise. **Tool calling** is
that loop. **MCP** (the Model Context Protocol) is a standard way to
expose such tools to assistants like Claude Desktop, Claude Code, or
Cursor, so you configure them once and any MCP-aware client can use
them.

myIO exposes six tools. The two that do the work are `validate_spec` (is
this chart description valid?) and `validate_call` (is this function
call valid?); the other four let the model discover what’s available.
They’re usable two ways: as plain **R functions** (shown throughout this
article, so every example below is real output) and as an **MCP server**
(covered at the end) for assistants.

## A first example

List the chart types myIO knows about — this is the model’s menu:

``` r

myio_list_chart_types()
#>  [1] "line"            "point"           "bar"             "hexbin"         
#>  [5] "treemap"         "gauge"           "donut"           "area"           
#>  [9] "groupedBar"      "histogram"       "heatmap"         "candlestick"    
#> [13] "waterfall"       "sankey"          "boxplot"         "violin"         
#> [17] "ridgeline"       "rangeBar"        "text"            "regression"     
#> [21] "bracket"         "comparison"      "qq"              "lollipop"       
#> [25] "dumbbell"        "waffle"          "beeswarm"        "bump"           
#> [29] "radar"           "funnel"          "parallel"        "survfit"        
#> [33] "histogram_fit"   "calendarHeatmap" "quantile_dots"   "fan"
```

Now suppose the assistant proposes a box plot but guesses the mapping
keys:

``` r

attempt <- list(
  type = "boxplot",
  mapping = list(column_var = "Species", value_var = "Sepal.Width")
)
as_json(myio_validate_spec(attempt))
#> {
#>   "valid": false,
#>   "errors": [
#>     {
#>       "code": "MISSING_MAPPING",
#>       "field": "x_var",
#>       "message": "Missing required mapping 'x_var' for chart type 'boxplot'."
#>     },
#>     {
#>       "code": "MISSING_MAPPING",
#>       "field": "y_var",
#>       "message": "Missing required mapping 'y_var' for chart type 'boxplot'."
#>     },
#>     {
#>       "code": "UNKNOWN_MAPPING_KEY",
#>       "field": "column_var",
#>       "message": "Unknown mapping key 'column_var' for chart type 'boxplot'.",
#>       "suggestion": "x_var"
#>     },
#>     {
#>       "code": "UNKNOWN_MAPPING_KEY",
#>       "field": "value_var",
#>       "message": "Unknown mapping key 'value_var' for chart type 'boxplot'.",
#>       "suggestion": "y_var"
#>     }
#>   ]
#> }
```

`valid` is `false`. The errors say `boxplot` actually needs `x_var` and
`y_var`, and — crucially — each unknown key carries a `suggestion`.
Applying them (`column_var` → `x_var`, `value_var` → `y_var`) gives a
spec that passes:

``` r

fixed <- list(
  type = "boxplot",
  mapping = list(x_var = "Species", y_var = "Sepal.Width")
)
as_json(myio_validate_spec(fixed))
#> {
#>   "valid": true,
#>   "errors": []
#> }
```

That is the whole idea: the model doesn’t have to know myIO’s API by
heart, and it doesn’t have to guess. It checks, and the validator tells
it what to do.

## What you can rely on

For anyone evaluating this as a real solution, the properties that
matter:

- **Complete and current by construction.** The schema is *generated
  from the engine’s own contracts* — the same definitions the renderer
  uses — so it can’t drift out of sync with what myIO actually draws,
  and it covers the full surface, not a hand-picked subset:

  ``` r

  length(myio_list_chart_types())   # chart types
  #> [1] 36
  length(myio_list_functions())     # exported function signatures
  #> [1] 41
  ```

- **Stable, machine-readable errors.** Every result is
  `{ valid, errors }`, and each error has a fixed `code` your code can
  branch on — never prose to parse: `UNKNOWN_TYPE`, `MISSING_MAPPING`,
  `UNKNOWN_MAPPING_KEY`, `INVALID_TRANSFORM`, `MISSING_COLUMN`,
  `NON_NUMERIC_COLUMN`, `UNKNOWN_FUNCTION`, `UNKNOWN_ARGUMENT`.

- **Identical across languages.** The R functions here and the MCP
  server share one generated schema and are held to the same conformance
  test corpus, so an agent gets the same answer whichever surface it
  calls.

Each chart type carries its own contract — required mappings, numeric
fields, valid transforms — which the model can fetch on demand:

``` r

as_json(myio_chart_schema("boxplot"))
#> {
#>   "kind": "composite",
#>   "renderer_type": false,
#>   "required_mappings": [
#>     "x_var",
#>     "y_var"
#>   ],
#>   "numeric_fields": "y_var",
#>   "valid_transforms": "identity",
#>   "group": "axes-categorical",
#>   "data_contract": null,
#>   "scale_hints": null
#> }
```

## Checking specs against real data

By default validation is structural. Pass a column type map and it also
checks the spec against your actual data: mapped columns must exist, and
numeric fields must map to numeric columns.

``` r

as_json(myio_validate_spec(
  list(type = "point", mapping = list(x_var = "wt", y_var = "mpg")),
  columns = list(wt = "numeric", mpg = "character")
))
#> {
#>   "valid": false,
#>   "errors": [
#>     {
#>       "code": "NON_NUMERIC_COLUMN",
#>       "field": "y_var",
#>       "message": "Mapped column 'mpg' for 'y_var' must be numeric."
#>     }
#>   ]
#> }
```

## Checking function calls

The same applies to the `set*()` styling functions — wrong argument
names are a common LLM mistake. `validate_call` checks the name and
arguments against the real signature and suggests corrections:

``` r

as_json(myio_validate_call("setAxisFormat", list(axis_x = ".0f")))
#> {
#>   "valid": false,
#>   "errors": [
#>     {
#>       "code": "UNKNOWN_ARGUMENT",
#>       "field": "axis_x",
#>       "message": "Unknown argument 'axis_x' for function 'setAxisFormat'.",
#>       "suggestion": "xAxis"
#>     }
#>   ]
#> }
```

``` r

myio_function_signature("setAxisFormat")
#> [1] "myIO"    "xAxis"   "yAxis"   "toolTip" "xLabel"  "yLabel"
```

## The six tools

| Tool | R function | Purpose |
|----|----|----|
| `list_chart_types` | [`myio_list_chart_types()`](https://mortonanalytics.github.io/myIO/reference/myio_list_chart_types.md) | Every chart type in the schema |
| `get_chart_schema` | `myio_chart_schema(type)` | One type’s contract (or all) |
| `validate_spec` | `myio_validate_spec(spec, columns)` | Validate a chart spec, with optional data-contract checks |
| `list_functions` | [`myio_list_functions()`](https://mortonanalytics.github.io/myIO/reference/myio_list_functions.md) | Every exported function name |
| `get_function_signature` | `myio_function_signature(fn)` | A function’s argument names |
| `validate_call` | `myio_validate_call(fn, args)` | Validate a function name + arguments |

## The repair loop

Putting it together — the pattern an agent follows whether it calls the
R functions or the MCP tools:

1.  Propose a chart spec.
2.  Call `validate_spec`.
3.  If `valid` is `false`, apply the `suggestion` for each error and go
    to 2.
4.  Once valid, validate any accompanying `set*()` call with
    `validate_call`.

This loop, run against the actual validator, converges the broken
attempt above to a working spec without any hard-coded knowledge of
myIO’s API:

``` r

spec <- list(type = "boxplot",
             mapping = list(column_var = "Species", value_var = "Sepal.Width"))
res  <- myio_validate_spec(spec)

while (!res$valid) {
  for (err in res$errors) {
    if (identical(err$code, "UNKNOWN_MAPPING_KEY") && !is.null(err$suggestion)) {
      spec$mapping[[err$suggestion]] <- spec$mapping[[err$field]]
      spec$mapping[[err$field]] <- NULL
    }
  }
  res <- myio_validate_spec(spec)
}
as_json(spec)
#> {
#>   "type": "boxplot",
#>   "mapping": {
#>     "x_var": "Species",
#>     "y_var": "Sepal.Width"
#>   }
#> }
```

## Wiring it into an assistant (MCP)

To give the six tools to an MCP-aware assistant (Claude Desktop, Claude
Code, Cursor), run the bundled Node server. It is deliberately separate
from the R package so installing myIO never pulls in Node dependencies.

``` sh
cd mcp
npm install
node server.mjs
```

Add it to the client’s MCP configuration (the shape is the same across
Claude Desktop, Claude Code, and Cursor):

``` json
{
  "mcpServers": {
    "myio": {
      "command": "node",
      "args": ["/absolute/path/to/myIO/mcp/server.mjs"]
    }
  }
}
```

For a local, fully open-source loop you can drive the same tools from an
Ollama model’s tool-calling API; the steps are identical to the repair
loop above. Because the server reads the same generated schema, its
results match the R functions in this article exactly.

## What validation guarantees — and what it does not

`validate_spec` and `validate_call` guarantee **contract correctness**:
a known chart type, an allowed transform, the expected mapping keys,
optional data-column compatibility, and known function arguments. They
do **not** guarantee the chosen chart is the *right* chart for the
question — asking for a box plot when a histogram was wanted produces a
perfectly valid spec. Semantic and aesthetic judgement stays with the
model; these tools close the structural-error class, which is the part
an LLM most reliably gets wrong. \`\`\`

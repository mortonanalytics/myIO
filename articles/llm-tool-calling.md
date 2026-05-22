# LLM Tool Calling

myIO ships a generated schema that agents can use to produce
contract-correct chart specs. The schema is generated from the R and
JavaScript contracts and is available to both R helpers and a standalone
MCP server.

## R helpers

List chart types:

``` r

head(myio_list_chart_types())
#> [1] "line"    "point"   "bar"     "hexbin"  "treemap" "gauge"
```

Validate a chart spec:

``` r

spec <- list(
  type = "boxplot",
  mapping = list(column_var = "Species", value_var = "Sepal.Width")
)
myio_validate_spec(spec)
#> $valid
#> [1] FALSE
#> 
#> $errors
#> $errors[[1]]
#> $errors[[1]]$code
#> [1] "MISSING_MAPPING"
#> 
#> $errors[[1]]$field
#> [1] "x_var"
#> 
#> $errors[[1]]$message
#> [1] "Missing required mapping 'x_var' for chart type 'boxplot'."
#> 
#> 
#> $errors[[2]]
#> $errors[[2]]$code
#> [1] "MISSING_MAPPING"
#> 
#> $errors[[2]]$field
#> [1] "y_var"
#> 
#> $errors[[2]]$message
#> [1] "Missing required mapping 'y_var' for chart type 'boxplot'."
#> 
#> 
#> $errors[[3]]
#> $errors[[3]]$code
#> [1] "UNKNOWN_MAPPING_KEY"
#> 
#> $errors[[3]]$field
#> [1] "column_var"
#> 
#> $errors[[3]]$message
#> [1] "Unknown mapping key 'column_var' for chart type 'boxplot'."
#> 
#> $errors[[3]]$suggestion
#> [1] "x_var"
#> 
#> 
#> $errors[[4]]
#> $errors[[4]]$code
#> [1] "UNKNOWN_MAPPING_KEY"
#> 
#> $errors[[4]]$field
#> [1] "value_var"
#> 
#> $errors[[4]]$message
#> [1] "Unknown mapping key 'value_var' for chart type 'boxplot'."
#> 
#> $errors[[4]]$suggestion
#> [1] "y_var"
```

Pass a column type map to catch data-contract issues:

``` r

myio_validate_spec(
  list(type = "point", mapping = list(x_var = "wt", y_var = "mpg")),
  columns = list(wt = "numeric", mpg = "character")
)
#> $valid
#> [1] FALSE
#> 
#> $errors
#> $errors[[1]]
#> $errors[[1]]$code
#> [1] "NON_NUMERIC_COLUMN"
#> 
#> $errors[[1]]$field
#> [1] "y_var"
#> 
#> $errors[[1]]$message
#> [1] "Mapped column 'mpg' for 'y_var' must be numeric."
```

Validate function-call argument names:

``` r

myio_validate_call("setAxisFormat", list(axis_x = ".0f"))
#> $valid
#> [1] FALSE
#> 
#> $errors
#> $errors[[1]]
#> $errors[[1]]$code
#> [1] "UNKNOWN_ARGUMENT"
#> 
#> $errors[[1]]$field
#> [1] "axis_x"
#> 
#> $errors[[1]]$message
#> [1] "Unknown argument 'axis_x' for function 'setAxisFormat'."
#> 
#> $errors[[1]]$suggestion
#> [1] "xAxis"
myio_function_signature("setAxisFormat")
#> [1] "myIO"    "xAxis"   "yAxis"   "toolTip" "xLabel"  "yLabel"
```

## MCP server

The MCP package is intentionally separate from the R package so CRAN
does not need Node dependencies.

``` sh
cd mcp
npm install
node server.mjs
```

Claude Desktop / Claude Code style configuration:

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

Cursor uses the same command and args in its MCP configuration.

The server exposes six tools:

- `list_chart_types`
- `get_chart_schema`
- `validate_spec`
- `list_functions`
- `get_function_signature`
- `validate_call`

## Ollama loop

For local tool-calling loops, expose the same six tools with JSON
inputs. A minimal repair flow is:

1.  Ask the model for a chart spec.
2.  Call `validate_spec`.
3.  If `valid` is `FALSE`, feed the error codes and suggestions back to
    the model.
4.  Repeat until the tool returns `valid = TRUE`.
5.  Validate any proposed R call with `validate_call`.

Example repair:

``` json
{
  "type": "boxplot",
  "mapping": {
    "column_var": "Species",
    "value_var": "Sepal.Width"
  }
}
```

`validate_spec` returns `MISSING_MAPPING` for `x_var` and `y_var`, plus
`UNKNOWN_MAPPING_KEY` suggestions for the hallucinated keys. The
repaired spec is:

``` json
{
  "type": "boxplot",
  "mapping": {
    "x_var": "Species",
    "y_var": "Sepal.Width"
  }
}
```

Validation guarantees contract correctness: known chart type, allowed
transform, expected mapping keys, optional data-column compatibility,
and known function arguments. It does not guarantee the semantic or
aesthetic quality of the selected chart.

# Set Color Scheme

Sets color scheme for a chart and the category names (optional)

## Usage

``` r
setColorScheme(myIO, colorScheme = NULL, setCategories = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- colorScheme:

  a vector of colors in the order you want them used

- setCategories:

  an optional vector of names that will be mapped to the corresponding
  color in the colorScheme

## Value

A modified `myIO` htmlwidget object with updated color scheme.

## Examples

``` r
# Set a custom color scheme
myIO() |> setColorScheme(colorScheme = list("red", "blue", "green"))

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["red","blue","green"],"domain":"none","enabled":true}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"193bf50d04e672cb","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Set colors with category labels
myIO() |> setColorScheme(
  colorScheme = list("steelblue", "orange"),
  setCategories = c("Group A", "Group B")
)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["steelblue","orange"],"domain":["Group A","Group B"],"enabled":true}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"f064100ce560a04c","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

# Set Axis Format

Sets axis for x axis, y axis, and/or tool tip

## Usage

``` r
setAxisFormat(
  myIO,
  xAxis = NULL,
  yAxis = NULL,
  toolTip = NULL,
  xLabel = NULL,
  yLabel = NULL
)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xAxis:

  Optional string indicating a d3.js format for the x axis. When `NULL`,
  leaves the existing setting unchanged.

- yAxis:

  Optional string indicating a d3.js format for the y axis. When `NULL`,
  leaves the existing setting unchanged.

- toolTip:

  Optional string indicating a d3.js format for tooltips. When `NULL`,
  leaves the existing setting unchanged.

- xLabel:

  Optional string label for the x axis. When `NULL`, leaves the existing
  setting unchanged.

- yLabel:

  Optional string label for the y axis. When `NULL`, leaves the existing
  setting unchanged.

## Value

A modified `myIO` htmlwidget object with updated axis format
configuration. with options set for the tooltip formats

## Examples

``` r
# Set axis formats using d3.js format strings
myIO() |> setAxisFormat(xAxis = ".0f", yAxis = ".1f")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":".0f","yAxisFormat":".1f","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"45a1b2ad4018eef1","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Set axis labels
myIO() |> setAxisFormat(xLabel = "Weight (lbs)", yLabel = "MPG")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":"Weight (lbs)","yAxisLabel":"MPG","toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"a407a0df6b525b1b","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Label-only calls preserve previously configured formats
myIO() |> setAxisFormat(yAxis = ".2f") |> setAxisFormat(yLabel = "Rate")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":".2f","xAxisLabel":null,"yAxisLabel":"Rate","toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"2f4ad92281566982","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

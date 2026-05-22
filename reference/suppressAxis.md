# Suppress Axis Display

Suppresses axes from printing

## Usage

``` r
suppressAxis(myIO, xAxis = NULL, yAxis = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xAxis:

  a logical operator defining whether the x axis should be printed or
  not

- yAxis:

  a logical operator defining whether the y axis should be printed or
  not

## Value

A modified `myIO` htmlwidget object with axis display suppressed.

## Examples

``` r
# Suppress both axes
myIO() |> suppressAxis(xAxis = TRUE, yAxis = TRUE)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":true,"yAxis":true}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"ff580948d258b2ee","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Suppress only the x axis
myIO() |> suppressAxis(xAxis = TRUE)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":true,"yAxis":null}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"1c304ebe1664b8f3","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

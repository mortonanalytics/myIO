# Set Chart Margins

Sets margins for the top, bottom, left, and right sides of the chart

## Usage

``` r
setMargin(myIO, top = 20, bottom = 40, left = 50, right = 50)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- top:

  a numeric value representing in pixels the top margin

- bottom:

  a numeric value representing in pixels the bottom margin

- left:

  a numeric value representing in pixels the left margin

- right:

  a numeric value representing in pixels the right margin

## Value

A modified `myIO` htmlwidget object with updated margin configuration.

## Examples

``` r
# Set custom margins
myIO() |> setMargin(top = 50, bottom = 80, left = 60, right = 20)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":50,"bottom":80,"left":60,"right":20},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"fca56cec1834a22c","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

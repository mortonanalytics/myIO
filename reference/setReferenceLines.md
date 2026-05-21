# Set Reference Lines

Sets x and y reference lines

## Usage

``` r
setReferenceLines(myIO, xRef = 0, yRef = 0)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- xRef:

  a list of the reference line value of x

- yRef:

  a list of the reference line value of y

## Value

A modified `myIO` htmlwidget object with reference lines added.

## Examples

``` r
# Add reference lines at x=5 and y=20
myIO() |> setReferenceLines(xRef = 5, yRef = 20)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":5,"y":20},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"d196f3aa03a12851","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

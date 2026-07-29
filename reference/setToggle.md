# Set Toggle Interaction

Sets toggle options for y_var and adds a toggle button for chart

## Usage

``` r
setToggle(myIO, variable, format = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- variable:

  a string indicating the variable name in data for toggle

- format:

  a string indicating the format for the toggled variable

## Value

A modified `myIO` htmlwidget object with toggle interaction configured.

## Examples

``` r
# Add a toggle button to switch y variable
myIO() |> setToggle(variable = "Percent", format = ".0%")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null,"yTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":"Percent","format":".0%"},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"4211ee8e5b9f7bea","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

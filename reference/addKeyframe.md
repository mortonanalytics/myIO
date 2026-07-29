# Add a Named Data Keyframe

Registers a named data state for sequential chart storytelling. A chart
with one serialized layer accepts a data frame directly. Multi-layer
charts use a named list of data frames keyed by existing layer labels;
omitted layers retain their data from the previous keyframe.

## Usage

``` r
addKeyframe(myIO, data, label)
```

## Arguments

- myIO:

  A widget created by
  [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
  with at least one layer.

- data:

  A data frame for a single-layer chart, or a named list of data frames
  keyed by layer label for a multi-layer chart.

- label:

  A unique, non-empty keyframe label.

## Value

A modified `myIO` widget with the keyframe appended.

## Examples

``` r
start <- data.frame(x = 1:3, y = c(2, 4, 3))
finish <- data.frame(x = 1:3, y = c(5, 3, 7))
myIO(start) |>
  addIoLayer("line", label = "series",
    mapping = list(x_var = "x", y_var = "y")) |>
  addKeyframe(start, "Start") |>
  addKeyframe(finish, "Finish")

{"x":{"data":{"x":[1,2,3],"y":[2,4,3]},"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[{"id":"layer_001","type":"line","color":"#E69F00","label":"series","data":[{"x":1,"y":2,"_source_key":"row_1"},{"x":2,"y":4,"_source_key":"row_2"},{"x":3,"y":3,"_source_key":"row_3"}],"mapping":{"x_var":"x","y_var":"y"},"options":{"barSize":"large","toolTipOptions":{"suppressY":false}},"transform":"identity","transformMeta":{"name":"identity","sourceKeys":null,"derivedFrom":null},"encoding":[],"sourceKey":"_source_key","derivedFrom":null,"order":1,"visibility":true}],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null,"yTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null},"keyframes":[{"label":"Start","layers":[{"label":"series","data":[{"x":1,"y":2,"_source_key":"row_1"},{"x":2,"y":4,"_source_key":"row_2"},{"x":3,"y":3,"_source_key":"row_3"}]}]},{"label":"Finish","layers":[{"label":"series","data":[{"x":1,"y":5,"_source_key":"row_1"},{"x":2,"y":3,"_source_key":"row_2"},{"x":3,"y":7,"_source_key":"row_3"}]}]}]},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"9ec3e5c8c404fe17","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

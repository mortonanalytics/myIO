# Set the Legend Title

Adds a title to the chart legend naming the variable its entries come
from. The title renders on whichever legend surface is active – the
compact in-plot legend or the panel opened from the chart's legend
button – and on exported SVG, PNG and PDF output.

## Usage

``` r
setLegendTitle(myIO, title = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the
  [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
  function

- title:

  a single character string used as the legend title, or `TRUE` to
  derive it from the name of the grouping column supplied as
  `addIoLayer(mapping = list(group = ...))`. `NULL` or `FALSE` clears
  the title, which is the default for every chart.

## Value

A modified `myIO` htmlwidget object carrying the legend title.

## Details

The title is omitted when
[`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md)
is set. The derived form (`title = TRUE`) is omitted unless the legend
has at least two entries and every entry comes from the same grouping
column, so a chart that mixes grouped series with a standalone fitted
line stays untitled unless a literal string is supplied.

## Examples

``` r
df <- data.frame(x = rep(1:5, 2), y = runif(10),
                 Month = rep(c("May", "June"), each = 5))

myIO() |>
  addIoLayer(type = "line", label = "Temp", data = df,
             mapping = list(x_var = "x", y_var = "y", group = "Month")) |>
  setLegendTitle("Month")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[{"id":"layer_001","type":"line","color":"#E69F00","label":"May","data":[{"x":1,"y":0.7151861342135817,"Month":"May","_source_key":"row_1"},{"x":2,"y":0.8726303048897535,"Month":"May","_source_key":"row_2"},{"x":3,"y":0.9832837469875813,"Month":"May","_source_key":"row_3"},{"x":4,"y":0.2185629929881543,"Month":"May","_source_key":"row_4"},{"x":5,"y":0.6645300642121583,"Month":"May","_source_key":"row_5"}],"mapping":{"x_var":"x","y_var":"y","group":"Month"},"options":{"barSize":"large","toolTipOptions":{"suppressY":false}},"transform":"identity","transformMeta":{"name":"identity","sourceKeys":null,"derivedFrom":null},"encoding":[],"sourceKey":"_source_key","derivedFrom":"layer_001","order":1,"visibility":true,"groupVar":"Month"},{"id":"layer_001_sub_02","type":"line","color":"#56B4E9","label":"June","data":[{"x":1,"y":0.38956403802149,"Month":"June","_source_key":"row_6"},{"x":2,"y":0.04606363899074495,"Month":"June","_source_key":"row_7"},{"x":3,"y":0.61691455822438,"Month":"June","_source_key":"row_8"},{"x":4,"y":0.598474994301796,"Month":"June","_source_key":"row_9"},{"x":5,"y":0.4068536299746484,"Month":"June","_source_key":"row_10"}],"mapping":{"x_var":"x","y_var":"y","group":"Month"},"options":{"barSize":"large","toolTipOptions":{"suppressY":false}},"transform":"identity","transformMeta":{"name":"identity","sourceKeys":null,"derivedFrom":null},"encoding":[],"sourceKey":"_source_key","derivedFrom":"layer_001","order":2,"visibility":true,"groupVar":"Month"}],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false},"legendTitle":"Month"},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null,"yTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"bb86b25b670b028f","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Derive the title from the grouping column name
myIO() |>
  addIoLayer(type = "line", label = "Temp", data = df,
             mapping = list(x_var = "x", y_var = "y", group = "Month")) |>
  setLegendTitle(TRUE)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[{"id":"layer_001","type":"line","color":"#E69F00","label":"May","data":[{"x":1,"y":0.7151861342135817,"Month":"May","_source_key":"row_1"},{"x":2,"y":0.8726303048897535,"Month":"May","_source_key":"row_2"},{"x":3,"y":0.9832837469875813,"Month":"May","_source_key":"row_3"},{"x":4,"y":0.2185629929881543,"Month":"May","_source_key":"row_4"},{"x":5,"y":0.6645300642121583,"Month":"May","_source_key":"row_5"}],"mapping":{"x_var":"x","y_var":"y","group":"Month"},"options":{"barSize":"large","toolTipOptions":{"suppressY":false}},"transform":"identity","transformMeta":{"name":"identity","sourceKeys":null,"derivedFrom":null},"encoding":[],"sourceKey":"_source_key","derivedFrom":"layer_001","order":1,"visibility":true,"groupVar":"Month"},{"id":"layer_001_sub_02","type":"line","color":"#56B4E9","label":"June","data":[{"x":1,"y":0.38956403802149,"Month":"June","_source_key":"row_6"},{"x":2,"y":0.04606363899074495,"Month":"June","_source_key":"row_7"},{"x":3,"y":0.61691455822438,"Month":"June","_source_key":"row_8"},{"x":4,"y":0.598474994301796,"Month":"June","_source_key":"row_9"},{"x":5,"y":0.4068536299746484,"Month":"June","_source_key":"row_10"}],"mapping":{"x_var":"x","y_var":"y","group":"Month"},"options":{"barSize":"large","toolTipOptions":{"suppressY":false}},"transform":"identity","transformMeta":{"name":"identity","sourceKeys":null,"derivedFrom":null},"encoding":[],"sourceKey":"_source_key","derivedFrom":"layer_001","order":2,"visibility":true,"groupVar":"Month"}],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false},"legendTitle":true},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null,"yTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"478bf74146d1193f","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

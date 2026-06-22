# Configure Chart Transitions

Sets the duration, easing, and per-element stagger for the
enter/update/exit animations used across chart layers. All arguments are
optional; any left `NULL` keeps the chart's current behavior, so this
setter is fully additive and backward compatible.

## Usage

``` r
setTransition(myIO, duration = NULL, easing = NULL, stagger = NULL)
```

## Arguments

- myIO:

  an htmlwidget object created by the
  [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
  function

- duration:

  transition duration in milliseconds (`>= 0`). Set to 0 to disable
  animation.

- easing:

  easing function name, one of `"linear"`, `"quad"`, `"cubic"`, `"sin"`,
  `"exp"`, `"circle"`, `"back"`, `"bounce"`, or `"elastic"` (mapped to
  the corresponding 'd3.js' easing). When `NULL`, each renderer keeps
  its built-in default easing.

- stagger:

  per-element delay in milliseconds (`>= 0`) applied across a layer's
  joined elements, creating a cascade. `0` disables stagger.

## Value

A modified `myIO` htmlwidget object with updated transition settings.

## Details

Animation remains fully opt-out-able: `duration = 0` (or
[`setTransitionSpeed`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)`(0)`)
disables animation, and easing and stagger automatically no-op whenever
the effective duration is 0 — including when the viewer's system
requests `prefers-reduced-motion: reduce`.

## See also

[`setTransitionSpeed`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)
for the duration-only shorthand.

## Examples

``` r
# Slower transitions with a bouncing ease and a 25ms cascade
myIO() |> setTransition(duration = 1200, easing = "bounce", stagger = 25)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1200,"easing":"bounce","stagger":25},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"31a41253ddcd61f4","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Change only the easing
myIO() |> setTransition(easing = "cubic")

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":1000,"easing":"cubic"},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"64853270d7a7ddd5","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
# Disable animation entirely
myIO() |> setTransition(duration = 0)

{"x":{"data":null,"config":{"specVersion":2,"title":null,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"","yAxisFormat":"","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"","xTickLabels":null},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":[],"transitions":{"speed":0},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"c78dff4211ee8e5b","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

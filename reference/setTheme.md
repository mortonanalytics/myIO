# Set Chart Theme

Sets chart theme tokens using CSS custom properties

## Usage

``` r
setTheme(
  myIO,
  text_color = NULL,
  grid_color = NULL,
  bg = NULL,
  font = NULL,
  mode = NULL,
  preset = NULL,
  overrides = list(),
  ...
)
```

## Arguments

- myIO:

  an htmlwidget object created by the myIO() function

- text_color:

  text and label color

- grid_color:

  grid line color

- bg:

  background color

- font:

  font family

- mode:

  Character or NULL. Theme mode: "light", "dark", or "auto". Default
  NULL (no mode, manual CSS vars only).

- preset:

  Character or NULL. Named preset (reserved for future use). Default
  NULL.

- overrides:

  Named list of CSS custom property overrides (e.g.,
  `list("--chart-tooltip-bg" = "#222")`).

- ...:

  additional CSS custom property overrides with \`–\` prefix

## Value

A modified `myIO` htmlwidget object with updated theme configuration.

## Examples

``` r
myIO() |>
  setTheme(text_color = "#222222", grid_color = "#d9d9d9")

{"x":{"data":null,"config":{"specVersion":2,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":{"mode":null,"preset":null,"values":{"--chart-text-color":"#222222","--chart-grid-color":"#d9d9d9"}},"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"5d92cb327f90c9eb","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
myIO() |>
  setTheme(mode = "dark", bg = "#1a1a2e")

{"x":{"data":null,"config":{"specVersion":2,"sparkline":null,"layers":[],"layout":{"margin":{"top":30,"bottom":60,"left":50,"right":5},"suppressLegend":false,"suppressAxis":{"xAxis":false,"yAxis":false}},"scales":{"xlim":{"min":null,"max":null},"ylim":{"min":null,"max":null},"categoricalScale":{"xAxis":false,"yAxis":false},"flipAxis":false,"colorScheme":{"colors":["#E69F00","#56B4E9","#009E73","#F0E442","#0072B2","#D55E00","#CC79A7","#999999"],"domain":"none","enabled":false}},"axes":{"xAxisFormat":"s","yAxisFormat":"s","xAxisLabel":null,"yAxisLabel":null,"toolTipFormat":"s"},"interactions":{"dragPoints":false,"toggleY":{"variable":null,"format":null},"toolTipOptions":{"suppressY":false}},"theme":{"mode":"dark","preset":null,"values":{"--chart-bg":"#1a1a2e"}},"transitions":{"speed":1000},"referenceLines":{"x":null,"y":null},"engine":"auto","coordinator_enabled":false,"crosstalk_threshold":100000,"webgl_threshold":50000,"unify_data_path":false,"duckdb_wasm":{"cache_url":null,"worker_url":null}},"bigdata":{"mode":"none","source_id":null,"ipc_b64":null,"url":null,"schema":null,"row_count":null,"rowkey_col":null},"coordinator":{"chart_id":"0caf26d4e3c00206","mark_spec":null,"query_template":""}},"evals":[],"jsHooks":[]}
```

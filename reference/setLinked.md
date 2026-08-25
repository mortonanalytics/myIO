# Enable Linked Brushing via Crosstalk

Connects the chart to a Crosstalk SharedData object so that brush
selections propagate to other linked widgets.

## Usage

``` r
setLinked(
  myIO,
  shared_data,
  mode = "both",
  filter = FALSE,
  key = NULL,
  group = NULL,
  cursor = FALSE,
  cursorAxis = "x"
)
```

## Arguments

- myIO:

  an htmlwidget object created by the
  [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
  function

- shared_data:

  a
  [`crosstalk::SharedData`](https://rdrr.io/pkg/crosstalk/man/SharedData.html)
  object

- mode:

  `"source"`, `"target"`, or `"both"` (default)

- filter:

  if `TRUE`, Crosstalk filter operations hide non-matching points.
  Default `FALSE` (dim only).

- key:

  Optional character vector of row keys. When supplied, overrides the
  keys extracted from `shared_data`. Useful when the SharedData keys do
  not match the column used for cross-chart matching.

- group:

  Optional character string. When supplied, overrides the Crosstalk
  group name from `shared_data`, allowing manual control over which
  widgets share selections.

- cursor:

  Logical. When `TRUE`, a hover in any linked chart draws a synchronized
  crosshair on every sibling chart in the same group. Default `FALSE`.

- cursorAxis:

  Character. Which axis to sync: `"x"` (default) draws a vertical rule
  at the hovered x value, `"y"` draws a horizontal rule at the hovered y
  value, and `"xy"` draws both. A rule is only drawn when the sibling
  chart can map the incoming value through its own scale.

## Value

A modified `myIO` htmlwidget with Crosstalk linking.

## Details

Selections travel on the Crosstalk key space, so a myIO chart matches
rows against sibling widgets (DT, plotly, leaflet) by the same keys they
use. The keys are matched to the chart's rows by position, which
requires the data passed to
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
to be `shared_data$data()` in its original row order. If a layer's row
count does not match the number of keys – for example after re-filtering
the frame, or after
[`updateMyIOData()`](https://mortonanalytics.github.io/myIO/reference/myIOProxy.md)
replaced the rows – the chart falls back to matching within its own
widget only, rather than pairing keys with the wrong rows.

## See also

[`linkCharts`](https://mortonanalytics.github.io/myIO/reference/linkCharts.md)
for group-identifier linking that does not require Crosstalk (e.g.
static R Markdown / Quarto HTML).

## Examples

``` r
if (interactive() && requireNamespace("crosstalk", quietly = TRUE)) {
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  myIO() |>
    addIoLayer(
      type = "point", label = "scatter",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")
    ) |>
    setLinked(shared)
}
```

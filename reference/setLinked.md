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

  Character. Which axis to sync: `"x"` (default), `"y"`, or `"xy"`. Only
  `"x"` is active in v1.2.

## Value

A modified `myIO` htmlwidget with Crosstalk linking.

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

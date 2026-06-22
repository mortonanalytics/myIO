# Link Charts for Cross-Selection

A convenience wrapper that sets matching link config on multiple widgets
so that brush selections propagate between them. Unlike
[`setLinked`](https://mortonanalytics.github.io/myIO/reference/setLinked.md),
this does not require Crosstalk — it uses a shared group identifier and
key column to coordinate selections across charts rendered in the same
page.

## Usage

``` r
linkCharts(..., on, group = NULL, cursor = FALSE, cursorAxis = "x")
```

## Arguments

- ...:

  myIO widget objects to link.

- on:

  Character. Column name to match rows across charts.

- group:

  Character. Group identifier. Default auto-generated.

- cursor:

  Logical. When `TRUE`, a hover in any linked chart draws a synchronized
  crosshair (and optional tooltip) on every sibling chart in the same
  group. Default `FALSE`.

- cursorAxis:

  Character. Which axis to sync: `"x"` (default), `"y"`, or `"xy"`. Only
  `"x"` is active in v1.2; other values are accepted but not yet
  rendered.

## Value

A list of modified myIO widgets with matching link config.

## See also

[`setLinked`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
for Crosstalk `SharedData`-based linking (use that path inside Shiny or
with reactive filters).

## Examples

``` r
# \donttest{
w1 <- myIO() |>
  addIoLayer(type = "point", label = "scatter",
    data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
w2 <- myIO() |>
  addIoLayer(type = "bar", label = "bars",
    data = mtcars, mapping = list(x_var = "cyl", y_var = "mpg"))
linked <- linkCharts(w1, w2, on = "cyl")
# }
```

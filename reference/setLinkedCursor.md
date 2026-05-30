# Toggle Linked Cursor Sync on a myIO Widget

Enables or disables synchronized hover crosshair across linked charts.
Composable with
[`linkCharts`](https://mortonanalytics.github.io/myIO/reference/linkCharts.md)
and
[`setLinked`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
via the pipe: call after linking to opt into cursor sync without
re-linking. Preserves any existing `interactions$linked` configuration.

## Usage

``` r
setLinkedCursor(myIO, enabled = TRUE, axis = "x")
```

## Arguments

- myIO:

  A myIO htmlwidget.

- enabled:

  Logical. `TRUE` to turn cursor sync on, `FALSE` to turn it off.
  Default `TRUE`.

- axis:

  Character. Which axis to sync: `"x"` (default), `"y"`, or `"xy"`. Only
  `"x"` is active in v1.2; other values are accepted and persisted but
  not yet rendered.

## Value

A modified `myIO` htmlwidget.

## Examples

``` r
# \donttest{
w1 <- myIO() |>
  addIoLayer(type = "point", label = "a",
    data = mtcars, mapping = list(x_var = "wt", y_var = "mpg"))
w2 <- myIO() |>
  addIoLayer(type = "point", label = "b",
    data = mtcars, mapping = list(x_var = "hp", y_var = "mpg"))
linked <- linkCharts(w1, w2, on = "cyl")
linked[[1]] <- setLinkedCursor(linked[[1]])
linked[[2]] <- setLinkedCursor(linked[[2]])
# }
```

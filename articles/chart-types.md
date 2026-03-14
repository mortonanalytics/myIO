# Chart Types

## Overview

myIO supports 10 chart types via the `type` argument in
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md).
This vignette shows an example of each.

All examples use built-in R datasets so you can copy and run them
directly.

## Layer Compatibility

Chart types are organized into compatibility groups. You can freely
combine types within compatible groups (e.g. point + line + area), but
standalone types like treemap or gauge cannot be mixed with other types.

| Group            | Types                                 |
|------------------|---------------------------------------|
| Continuous axes  | `line`, `point`, `area`               |
| Categorical axes | `bar`, `groupedBar`                   |
| Binned axes      | `histogram`                           |
| Standalone       | `hexbin`, `treemap`, `donut`, `gauge` |

Continuous, categorical, and binned groups can be combined with each
other. Standalone groups cannot be mixed.

## Line Chart

``` r
myIO() |>
  addIoLayer(
    type = "line",
    color = "steelblue",
    label = "temperature",
    data = airquality,
    mapping = list(x_var = "Day", y_var = "Temp")
  )
```

## Point (Scatter) Chart

``` r
myIO() |>
  addIoLayer(
    type = "point",
    color = "coral",
    label = "scatter",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

## Bar Chart

``` r
myIO() |>
  addIoLayer(
    type = "bar",
    color = "steelblue",
    label = "bars",
    data = mtcars,
    mapping = list(x_var = "cyl", y_var = "mpg")
  ) |>
  defineCategoricalAxis(xAxis = TRUE)
```

## Area Chart

Area charts require `x_var`, `low_y`, and `high_y` in the mapping:

``` r
aq <- airquality[complete.cases(airquality), ]
aq$TempLow <- aq$Temp - 5
aq$TempHigh <- aq$Temp + 5

myIO() |>
  addIoLayer(
    type = "area",
    color = "lightsteelblue",
    label = "area",
    data = aq,
    mapping = list(x_var = "Day", low_y = "TempLow", high_y = "TempHigh")
  )
```

## Grouped Bar Chart

``` r
myIO() |>
  addIoLayer(
    type = "groupedBar",
    color = "steelblue",
    label = "grouped",
    data = mtcars,
    mapping = list(x_var = "cyl", y_var = "mpg")
  ) |>
  defineCategoricalAxis(xAxis = TRUE)
```

## Histogram

Histograms use a `value` mapping instead of `x_var`/`y_var`:

``` r
myIO() |>
  addIoLayer(
    type = "histogram",
    color = "steelblue",
    label = "hist",
    data = mtcars,
    mapping = list(value = "mpg")
  )
```

## Donut Chart

``` r
myIO() |>
  addIoLayer(
    type = "donut",
    color = "steelblue",
    label = "donut",
    data = mtcars,
    mapping = list(x_var = "cyl", y_var = "mpg")
  )
```

## Gauge Chart

Gauges use a `value` mapping:

``` r
myIO() |>
  addIoLayer(
    type = "gauge",
    color = "steelblue",
    label = "gauge",
    data = data.frame(value = 0.75),
    mapping = list(value = "value")
  )
```

## Hexbin Chart

``` r
myIO() |>
  addIoLayer(
    type = "hexbin",
    color = "steelblue",
    label = "hexbin",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

## Treemap

Treemaps use a different mapping with `level_1` and `level_2` instead of
`x_var` and `y_var`:

``` r
myIO() |>
  addIoLayer(
    type = "treemap",
    label = "cars",
    data = mtcars,
    mapping = list(level_1 = "vs", level_2 = "cyl")
  )
```

## Combining Chart Types

You can overlay compatible chart types on a single widget. Here we layer
points, a connecting line, and a linear model trend line:

``` r
myIO() |>
  addIoLayer(
    type = "point",
    color = "steelblue",
    label = "points",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  addIoLayer(
    type = "line",
    color = "orange",
    label = "line",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  addIoLayer(
    type = "line",
    transform = "lm",
    color = "red",
    label = "trend",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

# Chart Types

## Overview

myIO supports 17 chart types via the `type` argument in
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md).
This vignette shows an example of each.

All examples use built-in R datasets so you can copy and run them
directly.

## Layer Compatibility

Chart types are organized into compatibility groups. You can freely
combine types within compatible groups (e.g. point + line + area), but
standalone types like treemap or gauge cannot be mixed with other types.

| Group            | Types                                                 |
|------------------|-------------------------------------------------------|
| Continuous axes  | `line`, `point`, `area`, `candlestick`                |
| Categorical axes | `bar`, `groupedBar`, `waterfall`, `boxplot`, `violin` |
| Binned axes      | `histogram`, `ridgeline`                              |
| Matrix axes      | `heatmap`                                             |
| Standalone       | `hexbin`, `treemap`, `donut`, `gauge`, `sankey`       |

Continuous, categorical, and binned groups can be combined with each
other. Matrix and standalone groups cannot be mixed with other groups.

------------------------------------------------------------------------

## Basic Charts

### Line Chart

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

### Point (Scatter) Chart

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

### Bar Chart

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

### Area Chart

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

### Grouped Bar Chart

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

### Histogram

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

### Donut Chart

``` r
myIO() |>
  addIoLayer(
    type = "donut",
    color = c("#E69F00", "#56B4E9", "#009E73"),
    label = "donut",
    data = aggregate(mpg ~ cyl, data = mtcars, FUN = mean),
    mapping = list(x_var = "cyl", y_var = "mpg")
  )
```

### Gauge Chart

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

### Hexbin Chart

``` r
myIO() |>
  addIoLayer(
    type = "hexbin",
    color = "steelblue",
    label = "hexbin",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg", radius = 20)
  )
```

### Treemap

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

------------------------------------------------------------------------

## Phase 2 Charts

### Heatmap

Heatmaps display a matrix of values with a continuous color scale. Both
axes are categorical. Mapping requires `x_var`, `y_var`, and `value`:

``` r
df <- expand.grid(
  quarter = c("Q1", "Q2", "Q3", "Q4"),
  segment = c("Low", "Mid", "High"),
  stringsAsFactors = FALSE
)
df$value <- c(2, 4, 6, 5, 7, 9, 4, 6, 8, 3, 5, 7)

myIO() |>
  addIoLayer(
    type = "heatmap",
    color = "#4E79A7",
    label = "Revenue",
    data = df,
    mapping = list(x_var = "quarter", y_var = "segment", value = "value")
  ) |>
  defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE) |>
  setAxisFormat(xLabel = "Quarter", yLabel = "Segment")
```

### Candlestick (OHLC)

Candlestick charts show open-high-low-close data. Green bars indicate
close \>= open, red bars indicate close \< open. Mapping requires
`x_var`, `open`, `high`, `low`, and `close`:

``` r
df <- data.frame(
  day = 1:10,
  open  = c(10, 12, 11, 14, 13, 15, 14, 16, 15, 17),
  high  = c(14, 15, 14, 17, 16, 18, 17, 19, 18, 20),
  low   = c(9,  11, 10, 13, 12, 14, 13, 15, 14, 16),
  close = c(12, 11, 14, 13, 15, 14, 16, 15, 17, 19)
)

myIO() |>
  addIoLayer(
    type = "candlestick",
    label = "Price",
    data = df,
    mapping = list(
      x_var = "day", open = "open",
      high = "high", low = "low", close = "close"
    )
  ) |>
  setAxisFormat(xAxis = ".0f", yAxis = "$,.0f",
                xLabel = "Day", yLabel = "Price")
```

### Waterfall

Waterfall charts show how an initial value is affected by sequential
positive and negative changes. The `cumulative` transform is
auto-applied. Mark summary rows with a `total` mapping:

``` r
df <- data.frame(
  step  = c("Revenue", "COGS", "Gross Profit", "OpEx", "Net Income"),
  value = c(500, -200, NA, -150, NA),
  is_total = c(FALSE, FALSE, TRUE, FALSE, TRUE)
)

myIO() |>
  addIoLayer(
    type = "waterfall",
    label = "P&L",
    data = df,
    mapping = list(x_var = "step", y_var = "value", total = "is_total")
  ) |>
  defineCategoricalAxis(xAxis = TRUE) |>
  setAxisFormat(yAxis = "$,.0f", xLabel = "Step", yLabel = "Amount")
```

### Sankey

Sankey diagrams show flows between nodes. Mapping requires `source`,
`target`, and `value`. This is a standalone type and cannot be mixed
with other charts:

``` r
df <- data.frame(
  source = c("Budget", "Budget", "Sales", "Sales", "Marketing"),
  target = c("Sales", "Marketing", "Revenue", "Leads", "Leads"),
  value  = c(40, 20, 30, 10, 15)
)

myIO() |>
  addIoLayer(
    type = "sankey",
    color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
    label = "Flow",
    data = df,
    mapping = list(source = "source", target = "target", value = "value")
  )
```

### Boxplot (Composite)

Boxplots are composite charts that automatically expand into area (IQR
box), point (whiskers, median), and optional outlier layers. Mapping
requires `x_var` (categorical) and `y_var` (numeric):

``` r
myIO() |>
  addIoLayer(
    type = "boxplot",
    color = "#4E79A7",
    label = "Sepal Length",
    data = iris,
    mapping = list(x_var = "Species", y_var = "Sepal.Length"),
    options = list(showOutliers = TRUE)
  ) |>
  setAxisFormat(xLabel = "Species", yLabel = "Sepal Length (cm)")
```

Options: `showOutliers` (default TRUE), `whiskerType` (“tukey” or
“minmax”).

### Violin (Composite)

Violin plots show the distribution shape via a mirrored kernel density
estimate. They expand into area (density), optional box (IQR), and
optional median point layers:

``` r
myIO() |>
  addIoLayer(
    type = "violin",
    color = "#59A14F",
    label = "Distribution",
    data = iris,
    mapping = list(x_var = "Species", y_var = "Sepal.Length"),
    options = list(showBox = TRUE, showMedian = TRUE)
  ) |>
  setAxisFormat(xLabel = "Species", yLabel = "Sepal Length (cm)")
```

Options: `showBox` (TRUE), `showMedian` (TRUE), `showPoints` (FALSE),
`bandwidth` (KDE bandwidth, default “nrd0”).

### Ridgeline (Composite)

Ridgeline plots stack multiple density curves vertically for comparing
distributions across groups. They expand into one area sub-layer per
group value. Mapping requires `x_var` (numeric values), `y_var`
(numeric), and `group` (categorical):

``` r
df <- mtcars
df$cyl <- as.character(df$cyl)

myIO() |>
  addIoLayer(
    type = "ridgeline",
    color = c("#4E79A7", "#F28E2B", "#E15759"),
    label = "MPG by Cylinders",
    data = df,
    mapping = list(x_var = "hp", y_var = "mpg", group = "cyl"),
    options = list(overlap = 0.5)
  ) |>
  setAxisFormat(xLabel = "Horsepower", yLabel = "Density")
```

Options: `overlap` (0-1, default 0.6), `bandwidth` (KDE bandwidth).

------------------------------------------------------------------------

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

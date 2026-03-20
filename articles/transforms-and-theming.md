# Transforms & Theming

## Transforms

Transforms derive new data from an existing layer before rendering. You
specify a transform with the `transform` argument in
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md).

### Available Transforms

| Transform      | Description                                                                               | Used by                          |
|----------------|-------------------------------------------------------------------------------------------|----------------------------------|
| `"identity"`   | Default. Passes data through unchanged.                                                   | All types                        |
| `"lm"`         | Fits a linear model and returns fitted values.                                            | `line`                           |
| `"cumulative"` | Computes running totals with base/cumulative columns.                                     | `waterfall` (auto-applied)       |
| `"quantiles"`  | Computes Q1, median, Q3, whisker bounds per group.                                        | `boxplot` (internal)             |
| `"median"`     | Computes group medians.                                                                   | `boxplot`, `violin` (internal)   |
| `"outliers"`   | Returns rows beyond 1.5x IQR fences.                                                      | `boxplot` (internal)             |
| `"density"`    | Kernel density estimation via [`stats::density()`](https://rdrr.io/r/stats/density.html). | `violin`, `ridgeline` (internal) |

Transforms marked “internal” are applied automatically by composite
chart types. You typically use `"identity"` (default) or `"lm"`
directly.

### Linear Model Trend Line

Add a trend line to a scatter plot by combining a `"point"` layer with a
`"line"` layer that uses `transform = "lm"`:

``` r
myIO() |>
  addIoLayer(
    type = "point",
    color = "#E69F00",
    label = "points",
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

The `lm` transform fits `y ~ x` using
[`stats::lm()`](https://rdrr.io/r/stats/lm.html) and replaces the y
values with the fitted values. The resulting line is sorted by x so it
renders as a smooth trend.

### Cumulative Transform (Waterfall)

The `"cumulative"` transform is auto-applied when you use
`type = "waterfall"`. It computes running totals and produces `_base_y`
and `_cumulative_y` columns that the waterfall renderer uses for
floating bars:

``` r
df <- data.frame(
  step  = c("Start", "Sales", "Returns", "Total"),
  value = c(100, 50, -20, NA),
  is_total = c(FALSE, FALSE, FALSE, TRUE)
)

myIO() |>
  addIoLayer(
    type = "waterfall",
    label = "bridge",
    data = df,
    mapping = list(x_var = "step", y_var = "value", total = "is_total")
  ) |>
  defineCategoricalAxis(xAxis = TRUE)
```

### Transform + Type Compatibility

Not every transform works with every chart type. The table below shows
valid combinations:

| Type            | Supported Transforms         |
|-----------------|------------------------------|
| `"line"`        | `"identity"`, `"lm"`         |
| `"point"`       | `"identity"`                 |
| `"bar"`         | `"identity"`                 |
| `"area"`        | `"identity"`                 |
| `"groupedBar"`  | `"identity"`                 |
| `"histogram"`   | `"identity"`                 |
| `"hexbin"`      | `"identity"`                 |
| `"treemap"`     | `"identity"`                 |
| `"donut"`       | `"identity"`                 |
| `"gauge"`       | `"identity"`                 |
| `"heatmap"`     | `"identity"`                 |
| `"candlestick"` | `"identity"`                 |
| `"waterfall"`   | `"identity"`, `"cumulative"` |
| `"sankey"`      | `"identity"`                 |
| `"boxplot"`     | `"identity"`                 |
| `"violin"`      | `"identity"`                 |
| `"ridgeline"`   | `"identity"`                 |

If you pass an incompatible combination,
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
will error with a clear message.

## Theming

Use
[`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md)
to customize chart appearance with CSS custom properties.

### Basic Theming

``` r
myIO() |>
  addIoLayer(
    type = "point",
    color = "#56B4E9",
    label = "scatter",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  setTheme(
    text_color = "#e0e0e0",
    grid_color = "#333333",
    bg = "#1a1a2e",
    font = "Fira Code, monospace"
  )
```

### Theme Parameters

| Parameter    | CSS Property         | Description               |
|--------------|----------------------|---------------------------|
| `text_color` | `--chart-text-color` | Axis labels and tick text |
| `grid_color` | `--chart-grid-color` | Grid and axis lines       |
| `bg`         | `--chart-bg`         | Chart background color    |
| `font`       | `--chart-font`       | Font family               |

### Custom Properties

Pass additional CSS custom properties via `...` (the `chart-` prefix is
added automatically):

``` r
myIO() |>
  addIoLayer(
    type = "bar",
    color = "coral",
    label = "bars",
    data = mtcars,
    mapping = list(x_var = "cyl", y_var = "mpg")
  ) |>
  defineCategoricalAxis(xAxis = TRUE) |>
  setTheme(
    bg = "#fafafa",
    text_color = "#333",
    "border-radius" = "8px"
  )
```

### Dark Mode Example

Combine theming with color choices for a dark-mode chart:

``` r
aq <- airquality
aq$Month <- paste0("M", aq$Month)

myIO() |>
  addIoLayer(
    type = "line",
    color = c("#00d2ff", "#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3"),
    label = "Month",
    data = aq,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  ) |>
  setTheme(
    text_color = "#b0b0b0",
    grid_color = "#2d2d2d",
    bg = "#0d1117",
    font = "Inter, system-ui, sans-serif"
  )
```

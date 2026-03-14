<img src="man/figures/myIOsticker.png" width = "200px" height = "200px">

[![R-CMD-check](https://github.com/mortonanalytics/myIO/actions/workflows/R-CMD-check.yaml/badge.svg)](https://github.com/mortonanalytics/myIO/actions/workflows/R-CMD-check.yaml)
[![codecov](https://codecov.io/gh/mortonanalytics/myIO/branch/main/graph/badge.svg)](https://codecov.io/gh/mortonanalytics/myIO)
[![Lifecycle: stable](https://img.shields.io/badge/lifecycle-stable-brightgreen.svg)](https://lifecycle.r-lib.org/articles/stages.html#stable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub R package version](https://img.shields.io/github/r-package/v/mortonanalytics/myIO)](https://github.com/mortonanalytics/myIO)

# myIO

An R package for creating interactive `d3.js` visualizations using `htmlwidgets`. Supports 12 chart types including scatter plots, line charts, bar charts, treemaps, and more — all composable through a piped API.

[Live Demo](http://www.morton-analytics.com/shiny/myio_demo/)

## Installation

```r
# install.packages("devtools")
devtools::install_github("mortonanalytics/myIO")
```

## Usage

Build plots by piping layers together with `myIO()`, `addIoLayer()`, and optionally `addIoStatLayer()`:

```r
library(myIO)

myIO() |>
  addIoLayer(
    type = "point",
    color = "steelblue",
    label = "points",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  ) |>
  addIoStatLayer(
    type = "lm",
    color = "red",
    label = "trend",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

## Supported Chart Types

| Type | `type` value |
|------|-------------|
| Scatter plot | `"point"` |
| Line chart | `"line"` |
| Bar chart | `"bar"` |
| Grouped bar chart | `"groupedBar"` |
| Area chart | `"area"` |
| Histogram | `"histogram"` |
| Density plot | `"density"` |
| Ridgeline plot | `"ridgeline"` |
| Donut chart | `"donut"` |
| Gauge chart | `"gauge"` |
| Hexbin plot | `"hexbin"` |
| Treemap | `"treemap"` |

## `addIoLayer()`

| Argument | Description |
|----------|-------------|
| `type` | Chart type (see table above) |
| `color` | Any CSS color string |
| `label` | Unique identifier for the layer |
| `data` | A data frame |
| `mapping` | List mapping variables, e.g. `list(x_var = "wt", y_var = "mpg")` |

## `addIoStatLayer()`

Adds a statistical layer on top of existing layers. Currently supports `type = "lm"` for linear trend lines.

## Customization

Customize plots by chaining additional functions:

- `setAxisFormat()` — Set d3.js axis formats and labels
- `setAxisLimits()` — Set axis ranges
- `setMargin()` — Adjust chart margins
- `setColorScheme()` — Apply a custom color palette
- `setTransitionSpeed()` — Control animation duration
- `flipAxis()` — Swap x and y axes
- `suppressAxis()` — Hide axes
- `suppressLegend()` — Hide the legend
- `dragPoints()` — Enable draggable points
- `setReferenceLines()` — Add reference lines

See the [Getting Started](https://github.com/mortonanalytics/myIO/blob/main/vignettes/getting-started.Rmd) and [Chart Types](https://github.com/mortonanalytics/myIO/blob/main/vignettes/chart-types.Rmd) vignettes for full examples.


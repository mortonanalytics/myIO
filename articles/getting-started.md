# Getting Started with myIO

## Overview

myIO is an R package that combines R and D3.js to create interactive
data visualizations using the `htmlwidgets` framework. Charts built with
myIO work in RStudio, Shiny apps, and R Markdown documents.

The core workflow is simple:

1.  Create a widget with
    [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md)
2.  Add layers with
    [`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
3.  Customize with option functions

## Installation

``` r
# install.packages("devtools")
devtools::install_github("mortonanalytics/myIO")
```

## Your First Chart

Create a scatter plot of `mtcars` data:

``` r
myIO() |>
  addIoLayer(
    type = "point",
    color = "#E69F00",
    label = "mpg_vs_wt",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

## Adding Multiple Layers

You can stack layers on a single chart. Here we add points and a linear
model trend line using the `lm` transform:

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
    transform = "lm",
    color = "red",
    label = "trend",
    data = mtcars,
    mapping = list(x_var = "wt", y_var = "mpg")
  )
```

See the [Transforms &
Theming](https://mortonanalytics.github.io/myIO/articles/transforms-and-theming.md)
vignette for details on available transforms.

## Customizing the Chart

Option functions let you control axes, margins, legends, theming, and
more. They all follow the same pipe-friendly pattern:

``` r
myIO() |>
  addIoLayer(
    type = "bar",
    color = "orange",
    label = "bars",
    data = mtcars,
    mapping = list(x_var = "cyl", y_var = "mpg")
  ) |>
  defineCategoricalAxis(xAxis = TRUE) |>
  setAxisFormat(xAxis = ".0f", yAxis = ".0f") |>
  setAxisFormat(xLabel = "Cylinders", yLabel = "Miles per Gallon") |>
  setMargin(top = 40, bottom = 70, left = 60, right = 10) |>
  setTransitionSpeed(speed = 500)
```

## Grouped Data

When your data has a grouping variable, pass it in the `mapping` to
automatically create one layer per group:

``` r
aq <- airquality
aq$Month <- paste0("M", aq$Month)

myIO() |>
  addIoLayer(
    type = "line",
    color = c("#E69F00", "#56B4E9", "#009E73", "#D55E00", "#0072B2"),
    label = "Month",
    data = aq,
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
  )
```

## Theming

Apply visual themes to change colors, fonts, and backgrounds:

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

See [Transforms &
Theming](https://mortonanalytics.github.io/myIO/articles/transforms-and-theming.md)
for the full theming API.

## Using in Shiny

myIO provides standard Shiny bindings: -
[`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
for the UI -
[`renderMyIO()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
for the server

``` r
library(shiny)

ui <- fluidPage(
  myIOOutput("my_chart", width = "100%", height = "400px")
)

server <- function(input, output) {
  output$my_chart <- renderMyIO({
    myIO() |>
      addIoLayer(
        type = "point",
        color = "steelblue",
        label = "scatter",
        data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")
      )
  })
}

shinyApp(ui, server)
```

## Chart Types

myIO supports 17 chart types. See the [Chart
Types](https://mortonanalytics.github.io/myIO/articles/chart-types.md)
vignette for examples of each.

| Category    | Types                                        |
|-------------|----------------------------------------------|
| Basic       | `line`, `point`, `bar`, `area`, `groupedBar` |
| Statistical | `histogram`, `hexbin`                        |
| Standalone  | `donut`, `gauge`, `treemap`, `sankey`        |
| Financial   | `candlestick`, `waterfall`, `heatmap`        |
| Composite   | `boxplot`, `violin`, `ridgeline`             |

Composite types automatically expand into multiple sub-layers using the
appropriate transforms (density, quantiles, etc.).

## Available Option Functions

| Function                                                                                               | Purpose                                         |
|--------------------------------------------------------------------------------------------------------|-------------------------------------------------|
| [`setAxisFormat()`](https://mortonanalytics.github.io/myIO/reference/setAxisFormat.md)                 | Set d3.js axis and tooltip formats, axis labels |
| [`setAxisLimits()`](https://mortonanalytics.github.io/myIO/reference/setAxisLimits.md)                 | Set min/max for x and y axes                    |
| [`setMargin()`](https://mortonanalytics.github.io/myIO/reference/setMargin.md)                         | Set chart margins (top, bottom, left, right)    |
| [`setColorScheme()`](https://mortonanalytics.github.io/myIO/reference/setColorScheme.md)               | Set color palette and category labels           |
| [`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md)                           | Set theme tokens (colors, font, background)     |
| [`setTransitionSpeed()`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)       | Set animation speed (0 to disable)              |
| [`setReferenceLines()`](https://mortonanalytics.github.io/myIO/reference/setReferenceLines.md)         | Add x and y reference lines                     |
| [`setToggle()`](https://mortonanalytics.github.io/myIO/reference/setToggle.md)                         | Add a toggle button to switch y variable        |
| [`setToolTipOptions()`](https://mortonanalytics.github.io/myIO/reference/setToolTipOptions.md)         | Configure tooltip behavior                      |
| [`defineCategoricalAxis()`](https://mortonanalytics.github.io/myIO/reference/defineCategoricalAxis.md) | Treat axes as categorical                       |
| [`flipAxis()`](https://mortonanalytics.github.io/myIO/reference/flipAxis.md)                           | Swap x and y axes                               |
| [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md)                       | Make points draggable                           |
| [`suppressAxis()`](https://mortonanalytics.github.io/myIO/reference/suppressAxis.md)                   | Hide x and/or y axes                            |
| [`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md)               | Hide the legend                                 |

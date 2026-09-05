# myIO

An R package for creating interactive `d3.js` visualizations using
`htmlwidgets`. Supports 36 chart types including scatter plots, line
charts, uncertainty views, statistical composites, and more — all
composable through a piped API.

[Live Demo](https://www.morton-analytics.com/myio/)

## Installation

``` r

# install.packages("devtools")
devtools::install_github("mortonanalytics/myIO")
```

## Usage

Build plots by piping layers together with
[`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md) and
[`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md):

``` r

library(myIO)

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

## Chart Type Examples

The table below covers common chart types. See the [Chart
Types](https://mortonanalytics.github.io/myIO/articles/chart-types.html)
article for more examples, or run
[`myio_list_chart_types()`](https://mortonanalytics.github.io/myIO/reference/myio_list_chart_types.md)
for the complete list.

| Type              | `type` value    |
|-------------------|-----------------|
| Scatter plot      | `"point"`       |
| Line chart        | `"line"`        |
| Bar chart         | `"bar"`         |
| Grouped bar chart | `"groupedBar"`  |
| Area chart        | `"area"`        |
| Histogram         | `"histogram"`   |
| Heatmap           | `"heatmap"`     |
| Candlestick       | `"candlestick"` |
| Waterfall         | `"waterfall"`   |
| Sankey            | `"sankey"`      |
| Boxplot           | `"boxplot"`     |
| Violin            | `"violin"`      |
| Ridgeline         | `"ridgeline"`   |
| Donut chart       | `"donut"`       |
| Gauge chart       | `"gauge"`       |
| Hexbin plot       | `"hexbin"`      |
| Treemap           | `"treemap"`     |

## `addIoLayer()`

| Argument | Description |
|----|----|
| `type` | Chart type (see table above) |
| `color` | Any CSS color string |
| `label` | Unique identifier for the layer |
| `data` | A data frame |
| `mapping` | List mapping variables, e.g. `list(x_var = "wt", y_var = "mpg")` |
| `transform` | Optional derived-data transform, e.g. `"identity"` or `"lm"` |

## Interactions

myIO charts are bidirectional — user actions flow back as structured
data:

- [`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md)
  — Rectangle select returns selected rows as data
- [`setAnnotation()`](https://mortonanalytics.github.io/myIO/reference/setAnnotation.md)
  — Click to label data points; export annotations as CSV
- [`setLinked()`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
  — Crosstalk linked brushing across multiple charts
- [`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md)
  — Parameter sliders that trigger Shiny recomputation
- [`addKeyframe()`](https://mortonanalytics.github.io/myIO/reference/addKeyframe.md)
  — Register complete data snapshots for sequential storytelling
- [`setKeyframe()`](https://mortonanalytics.github.io/myIO/reference/setKeyframe.md)
  /
  [`stepKeyframe()`](https://mortonanalytics.github.io/myIO/reference/setKeyframe.md)
  — Select or step keyframes through a Shiny proxy

## Runtime Compatibility

| Runtime | Supported path |
|----|----|
| RStudio, R Markdown, and Quarto | Standard `htmlwidgets` rendering |
| Shiny | Widget rendering, reactive inputs, proxy data updates, and keyframe control |
| WebR 0.6.0 | Precompiled Wasm package, R payload creation, and production-bundle rendering in Chromium |

The WebR claim is intentionally bounded to the pinned end-to-end CI
path; it does not imply that DuckDB-WASM or every browser host has been
validated.

## Customization

Customize plots by chaining additional functions:

- [`setAxisFormat()`](https://mortonanalytics.github.io/myIO/reference/setAxisFormat.md)
  — Set d3.js axis formats and labels
- [`setAxisLimits()`](https://mortonanalytics.github.io/myIO/reference/setAxisLimits.md)
  — Set axis ranges
- [`defineCategoricalAxis()`](https://mortonanalytics.github.io/myIO/reference/defineCategoricalAxis.md)
  — Define a categorical axis
- [`setMargin()`](https://mortonanalytics.github.io/myIO/reference/setMargin.md)
  — Adjust chart margins
- [`setColorScheme()`](https://mortonanalytics.github.io/myIO/reference/setColorScheme.md)
  — Apply a custom color palette
- [`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md)
  — Set theme tokens (colors, font, background)
- [`setTransitionSpeed()`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)
  — Control animation duration
- [`setTransition()`](https://mortonanalytics.github.io/myIO/reference/setTransition.md)
  — Configure duration, easing, and stagger
- [`setToolTipOptions()`](https://mortonanalytics.github.io/myIO/reference/setToolTipOptions.md)
  — Configure tooltip behavior
- [`setToggle()`](https://mortonanalytics.github.io/myIO/reference/setToggle.md)
  — Enable layer toggle controls
- [`flipAxis()`](https://mortonanalytics.github.io/myIO/reference/flipAxis.md)
  — Swap x and y axes
- [`suppressAxis()`](https://mortonanalytics.github.io/myIO/reference/suppressAxis.md)
  — Hide axes
- [`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md)
  — Hide the legend
- [`setLegendTitle()`](https://mortonanalytics.github.io/myIO/reference/setLegendTitle.md)
  — Title the legend with the grouping variable
- [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md)
  — Enable draggable points
- [`setReferenceLines()`](https://mortonanalytics.github.io/myIO/reference/setReferenceLines.md)
  — Add reference lines

See the [Getting
Started](https://mortonanalytics.github.io/myIO/articles/getting-started.html),
[Chart
Types](https://mortonanalytics.github.io/myIO/articles/chart-types.html),
[Sequential
Storytelling](https://mortonanalytics.github.io/myIO/articles/sequential-storytelling.html),
[Shiny
Integration](https://mortonanalytics.github.io/myIO/articles/shiny-integration.html),
and [Transforms &
Theming](https://mortonanalytics.github.io/myIO/articles/transforms-and-theming.html)
articles for full examples.

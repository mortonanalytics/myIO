[![R-CMD-check](https://github.com/mortonanalytics/myIO/actions/workflows/R-CMD-check.yaml/badge.svg)](https://github.com/mortonanalytics/myIO/actions/workflows/R-CMD-check.yaml)
[![WebR compatibility](https://github.com/mortonanalytics/myIO/actions/workflows/webr.yaml/badge.svg)](https://github.com/mortonanalytics/myIO/actions/workflows/webr.yaml)
![R coverage](man/figures/coverage-badge.svg)
![JS coverage](man/figures/js-coverage-badge.svg)
[![Lifecycle: stable](https://img.shields.io/badge/lifecycle-stable-brightgreen.svg)](https://lifecycle.r-lib.org/articles/stages.html#stable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![version](https://img.shields.io/badge/version-1.3.0-blue)

# myIO

An R package for creating interactive `d3.js` visualizations using `htmlwidgets`. Supports 36 chart types including scatter plots, line charts, uncertainty views, statistical composites, and more — all composable through a piped API.

[Live Demo](https://mortonanalytics.github.io/myIO/)

## Installation

```r
# install.packages("devtools")
devtools::install_github("mortonanalytics/myIO")
```

## Usage

Build plots by piping layers together with `myIO()` and `addIoLayer()`:

```r
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

## Supported Chart Types

| Type | `type` value |
|------|-------------|
| Scatter plot | `"point"` |
| Line chart | `"line"` |
| Bar chart | `"bar"` |
| Grouped bar chart | `"groupedBar"` |
| Area chart | `"area"` |
| Histogram | `"histogram"` |
| Heatmap | `"heatmap"` |
| Candlestick | `"candlestick"` |
| Waterfall | `"waterfall"` |
| Sankey | `"sankey"` |
| Boxplot | `"boxplot"` |
| Violin | `"violin"` |
| Ridgeline | `"ridgeline"` |
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
| `transform` | Optional derived-data transform, e.g. `"identity"` or `"lm"` |

## Interactions

myIO charts are bidirectional — user actions flow back as structured data:

- `setBrush()` — Rectangle select returns selected rows as data
- `setAnnotation()` — Click to label data points; export annotations as CSV
- `setLinked()` — Crosstalk linked brushing across multiple charts
- `setSlider()` — Parameter sliders that trigger Shiny recomputation
- `addKeyframe()` — Register complete data snapshots for sequential storytelling
- `setKeyframe()` / `stepKeyframe()` — Select or step keyframes through a Shiny proxy

## Runtime Compatibility

| Runtime | Supported path |
|---------|----------------|
| RStudio, R Markdown, and Quarto | Standard `htmlwidgets` rendering |
| Shiny | Widget rendering, reactive inputs, proxy data updates, and keyframe control |
| WebR 0.6.0 | Precompiled Wasm package, R payload creation, and production-bundle rendering in Chromium |

The WebR claim is intentionally bounded to the pinned end-to-end CI path; it
does not imply that DuckDB-WASM or every browser host has been validated.

## Customization

Customize plots by chaining additional functions:

- `setAxisFormat()` — Set d3.js axis formats and labels
- `setAxisLimits()` — Set axis ranges
- `defineCategoricalAxis()` — Define a categorical axis
- `setMargin()` — Adjust chart margins
- `setColorScheme()` — Apply a custom color palette
- `setTheme()` — Set theme tokens (colors, font, background)
- `setTransitionSpeed()` — Control animation duration
- `setTransition()` — Configure duration, easing, and stagger
- `setToolTipOptions()` — Configure tooltip behavior
- `setToggle()` — Enable layer toggle controls
- `flipAxis()` — Swap x and y axes
- `suppressAxis()` — Hide axes
- `suppressLegend()` — Hide the legend
- `dragPoints()` — Enable draggable points
- `setReferenceLines()` — Add reference lines

See the [Getting Started](https://mortonanalytics.github.io/myIO/articles/getting-started.html), [Chart Types](https://mortonanalytics.github.io/myIO/articles/chart-types.html), [Sequential Storytelling](https://mortonanalytics.github.io/myIO/articles/sequential-storytelling.html), [Shiny Integration](https://mortonanalytics.github.io/myIO/articles/shiny-integration.html), and [Transforms & Theming](https://mortonanalytics.github.io/myIO/articles/transforms-and-theming.html) articles for full examples.

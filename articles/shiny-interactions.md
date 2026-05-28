# Interactive I/O in Shiny

myIO is not just a charting library — it is a bidirectional data
interface. User interactions (brush, click, annotate, slider) flow back
to R as structured data. This article walks through each pattern with a
live demo and the code behind it.

**Try each interaction in the live app below**, then read the code that
powers it.

## Live Demo App

The full gallery app runs all 20 chart types plus the four I/O
interaction demos. Navigate to **Interactions** in the top menu to try
each one.

![](logo.png) myIO

- [ Home](#tab-4744-1)
- [ Basic Charts ](#)
  - [Bar](#tab-9581-1)
  - [Grouped Bar](#tab-9581-2)
  - [Horizontal Bar](#tab-9581-3)
  - [Line](#tab-9581-4)
  - [Area](#tab-9581-5)
- [ Statistical ](#)
  - [Scatter + Trend](#tab-8278-1)
  - [Regression + CI](#tab-8278-2)
  - [LOESS Smoothing](#tab-8278-3)
  - [Mean ± CI](#tab-8278-4)
  - [Moving Average](#tab-8278-5)
  - [Residuals](#tab-8278-6)
  - [Histogram](#tab-8278-7)
  - [Hexbin Density](#tab-8278-8)
  - [Q-Q Plot](#tab-8278-9)
- [ Specialized ](#)
  - [Donut](#tab-3652-1)
  - [Gauge](#tab-3652-2)
  - [Treemap](#tab-3652-3)
- [ Financial](#tab-4744-5)
- [ Distribution ](#)
  - [Boxplot](#tab-5078-1)
  - [Violin](#tab-5078-2)
  - [Ridgeline](#tab-5078-3)
  - [Comparison](#tab-5078-4)
- [ Relational](#tab-4744-7)
- [ Interactions ](#)
  - [Brush Selection](#tab-6265-1)
  - [Click-to-Annotate](#tab-6265-2)
  - [Linked Brushing](#tab-6265-3)
  - [Parameter Slider](#tab-6265-4)
- [ New Charts ](#)
  - [Lollipop](#tab-9384-1)
  - [Dumbbell](#tab-9384-2)
  - [Waffle](#tab-9384-3)
  - [Beeswarm](#tab-9384-4)
  - [Bump](#tab-9384-5)
  - [Radar](#tab-9384-6)
  - [Funnel](#tab-9384-7)
  - [Calendar Heatmap](#tab-9384-8)
- [ Advanced ](#)
  - [Survival Curve](#tab-1097-1)
  - [Distribution Fit](#tab-1097-2)
  - [Sparklines](#tab-1097-3)
  - [Small Multiples](#tab-1097-4)
- [ Theme Demo](#tab-4744-11)
- [ Export Demo](#tab-4744-12)

![](logo.png)

# myIO Chart Gallery

Interactive D3.js visualizations, built entirely in R.

#### 30 Chart Types

Scatter, line, bar, grouped bar, area, histogram, donut, gauge, treemap,
hexbin, heatmap, candlestick, waterfall, sankey, boxplot, violin,
ridgeline, regression, Q-Q plots, group comparisons, lollipop, dumbbell,
waffle, beeswarm, bump, radar, funnel, survival curves, distribution
fit, sparklines, and small multiples.

#### Statistical Transforms

Built-in CI bands, LOESS smoothing, moving averages, mean ± CI error
bars, and regression diagnostics. Composable and chainable.

#### Bidirectional I/O

Brush to select, click to annotate, link charts with Crosstalk, and add
parameter sliders. User actions flow back as structured data.

#### Dark Mode + Themes

12 built-in theme presets including dark, midnight, ocean, forest,
sunset, neon, corporate, and academic. One-line theming with setTheme().

Use the tabs above to explore each chart type.

[ Documentation](https://mortonanalytics.github.io/myIO/) [ Source
Code](https://github.com/mortonanalytics/myIO)

Temperature jitter (F)

Airquality months

5

6

7

8

9

Temperature jitter (F)

Method

Linear LOESS Polynomial

Confidence Level

Interval Type

Confidence Prediction

Span

Method

Simple MA Exponential MA

Window

Alpha

Sample size

Variable

Sepal.Length Sepal.Width Petal.Length Petal.Width

Show CI Envelope

Group by Species

Noise

Value

- [Candlestick](#tab-3708-1)
- [Waterfall](#tab-3708-2)

Test Method

t-test Wilcoxon

P-value Adjustment

None Bonferroni Holm BH

- [Heatmap](#tab-6600-1)
- [Sankey](#tab-6600-2)

#### Selected Points

``` shiny-text-output
```

Brush Direction

Both axes X only Y only

#### Annotations

Click any point to add a label. Click an annotated point to edit or
remove.

Brush points in the left chart to highlight them in the right chart.

Distribution Family

Normal Log-Normal Exponential

#### Inline Sparklines

##### Revenue Trend

##### User Growth

##### Error Rate

Theme Preset

light dark midnight ocean forest sunset monochrome neon corporate
academic

##### Export Options

Toggle which export buttons appear in the chart toolbar.

PNG download

SVG download

PDF download

CSV download

Clipboard copy

------------------------------------------------------------------------

Theme

light dark midnight ocean

Try exporting in dark mode to verify CSS variable resolution.

------------------------------------------------------------------------

## Brush Selection

Drag a rectangle on the chart to select data points. The selected rows
are returned as a Shiny reactive input — no JavaScript required.

### Try it

Open **Interactions \> Brush Selection** in the app above. Drag on the
scatter plot, then watch the sidebar update with the selected count and
data range. Use the direction dropdown to switch between 2D, X-only, and
Y-only brushing.

### Code

``` r

# UI
fluidRow(
  column(8, myIOOutput("brushPlot", height = "450px")),
  column(4,
    h4("Selected Points"),
    verbatimTextOutput("brushInfo"),
    selectInput("brush_dir", "Brush Direction",
      choices = c("Both axes" = "xy", "X only" = "x", "Y only" = "y"))
  )
)

# Server
output$brushPlot <- renderMyIO({
  myIO() |>
    addIoLayer(type = "point", color = "#4E79A7", label = "Cars",
      data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) |>
    setBrush(direction = input$brush_dir) |>
    setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon")
})

output$brushInfo <- renderPrint({
  brushed <- input$`myIO-brushPlot-brushed`
  if (is.null(brushed)) return("Drag on the chart to select points.")
  sel <- jsonlite::fromJSON(brushed)
  if (length(sel$keys) == 0) return("No points selected.")
  cat(length(sel$keys), "of", nrow(mtcars), "points selected\n")
  if (!is.null(sel$extent$x)) {
    cat("X range:", round(sel$extent$x[1], 2), "-", round(sel$extent$x[2], 2), "\n")
  }
  if (!is.null(sel$extent$y)) {
    cat("Y range:", round(sel$extent$y[1], 2), "-", round(sel$extent$y[2], 2), "\n")
  }
})
```

### How it works

1.  [`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md)
    adds a D3 brush overlay to the chart
2.  On brush end, the selected data points are emitted as a `"brushed"`
    event
3.  In Shiny, the event arrives as `input$myIO-{id}-brushed` — a JSON
    payload with:
    - `data` — the selected row objects
    - `keys` — `_source_key` values for linking
    - `extent` — brush bounds in data coordinates
4.  In static HTML (no Shiny), a status bar shows the selection count
    and a \[Clear\] button. The CSV export scopes to selected points
    when `on_select = "export"`.

### Supported chart types

Brush works on element-based types: `point`, `bar`, `histogram`,
`hexbin`, `groupedBar`. Line and area charts are excluded — they don’t
have discrete selectable elements.

------------------------------------------------------------------------

## Click-to-Annotate

Click any data point to attach a label. Annotations are stored as
structured data — not cosmetic SVG — and can be exported as a CSV or
read as a Shiny reactive.

### Try it

Open **Interactions \> Click-to-Annotate** in the app above. Click any
point in the iris scatter plot. Choose a label from the dropdown and
optionally pick a category color. The annotation appears as a ring +
label on the chart, and the table in the sidebar updates.

### Code

``` r

# UI
fluidRow(
  column(8, myIOOutput("annotatePlot", height = "450px")),
  column(4,
    h4("Annotations"),
    tableOutput("annotationTable")
  )
)

# Server
output$annotatePlot <- renderMyIO({
  myIO() |>
    addIoLayer(type = "point", color = "#4E79A7", label = "Iris",
      data = iris, mapping = list(x_var = "Sepal.Length", y_var = "Petal.Length")) |>
    setAnnotation(
      labels = c("outlier", "cluster edge", "typical"),
      colors = c(outlier = "#E63946", `cluster edge` = "#F4A261", typical = "#2A9D8F")
    ) |>
    setAxisFormat(xLabel = "Sepal Length", yLabel = "Petal Length")
})

output$annotationTable <- renderTable({
  ann <- input$`myIO-annotatePlot-annotated`
  if (is.null(ann)) return(data.frame())
  parsed <- jsonlite::fromJSON(ann)
  if (length(parsed$annotations) == 0) return(data.frame())
  df <- parsed$annotations
  data.frame(Label = df$label, X = round(as.numeric(df$x), 2), Y = round(as.numeric(df$y), 2))
})
```

### Annotation data structure

Each annotation is a structured object with these fields:

| Field            | Type   | Description                              |
|------------------|--------|------------------------------------------|
| `_source_key`    | string | Links back to the original data row      |
| `x`, `y`         | number | Data coordinates (not pixels)            |
| `x_var`, `y_var` | string | Column names for context                 |
| `label`          | string | User-provided label (max 30 chars)       |
| `category`       | string | CSS color from category picker (or null) |
| `layerLabel`     | string | Which chart layer the point belongs to   |
| `timestamp`      | string | ISO 8601 when the annotation was created |

In static HTML, annotations are exportable via the bottom-sheet CSV
button or the status bar \[Export\] button.

------------------------------------------------------------------------

## Linked Brushing

Connect two or more myIO charts via Crosstalk. Brush points in one chart
and watch them highlight in the other — with shared `_source_key` values
linking the rows across views.

### Try it

Open **Interactions \> Linked Brushing** in the app above. The left
chart shows `wt vs mpg`, the right shows `hp vs mpg`. Drag a brush on
the left chart — the same cars light up on the right.

### Code

``` r

library(crosstalk)

# Server
shared <- SharedData$new(mtcars, key = ~rownames(mtcars))

output$linkedA <- renderMyIO({
  myIO() |>
    addIoLayer(type = "point", color = "#4E79A7", label = "wt vs mpg",
      data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")) |>
    setBrush() |>
    setLinked(shared, mode = "source") |>
    setAxisFormat(xLabel = "Weight", yLabel = "MPG")
})

output$linkedB <- renderMyIO({
  myIO() |>
    addIoLayer(type = "point", color = "#E15759", label = "hp vs mpg",
      data = shared$data(), mapping = list(x_var = "hp", y_var = "mpg")) |>
    setLinked(shared, mode = "target") |>
    setAxisFormat(xLabel = "Horsepower", yLabel = "MPG")
})
```

### How linking works

1.  Both charts share the same
    [`crosstalk::SharedData`](https://rdrr.io/pkg/crosstalk/man/SharedData.html)
    object
2.  The source chart calls
    [`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md) +
    `setLinked(shared, mode = "source")`
3.  The target chart calls `setLinked(shared, mode = "target")`
4.  When the source brushes, it sends selected `_source_key` values via
    Crosstalk’s `SelectionHandle`
5.  The target receives the keys and dims non-matching elements

Use `mode = "both"` for bidirectional linking. Set `filter = TRUE` to
hide non-matching points instead of dimming them.

Crosstalk is a Suggests dependency — it’s only loaded when
[`setLinked()`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
is called. Your core myIO code stays dependency-free.

### Linked brushing + recomputation

For deeper analysis, combine Crosstalk (instant visual feedback) with
Shiny reactivity (recomputed statistics):

``` r

# When chart A brushes, also trigger an R recomputation in chart B
observeEvent(input$`myIO-chartA-brushed`, {
  sel <- jsonlite::fromJSON(input$`myIO-chartA-brushed`)
  subset <- mtcars[rownames(mtcars) %in% sel$keys, ]
  output$chartB <- renderMyIO({
    myIO(data = subset) |>
      addIoLayer(type = "regression", label = "refitted",
        mapping = list(x_var = "wt", y_var = "mpg"))
  })
})
```

This gives two-speed feedback: instant highlight via Crosstalk, then a
smooth transition to a refitted model via Shiny.

------------------------------------------------------------------------

## Parameter Sliders

Add sliders below the chart that control transform parameters. Moving a
slider triggers Shiny re-rendering — the chart recomputes and animates
to the new state.

### Try it

Open **Interactions \> Parameter Slider** in the app above. Drag the
confidence level slider and watch the CI band narrow or widen in
real-time as the regression recomputes.

### Code

``` r

output$sliderPlot <- renderMyIO({
  ci <- input$`myIO-sliderPlot-slider-ci_level`
  if (is.null(ci)) ci <- 0.95

  myIO(data = df) |>
    addIoLayer(type = "regression", label = "Yield Model",
      mapping = list(x_var = "day", y_var = "yield"),
      options = list(method = "lm", showCI = TRUE, level = ci, showStats = TRUE)) |>
    setSlider("ci_level", "Confidence Level", 0.80, 0.99, ci, 0.01) |>
    setAxisFormat(xLabel = "Day of Experiment", yLabel = "Yield (mg)")
})
```

### How it works

1.  [`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md)
    renders an HTML range input below the chart
2.  On drag, the slider sends its value to
    `input$myIO-{id}-slider-{param}`
3.  This invalidates the `renderMyIO` reactive, which recomputes the
    chart with the new parameter value
4.  D3 transitions animate the change smoothly

The slider is **Shiny-only**. In static HTML it renders disabled with a
tooltip explaining the limitation.

### Multiple sliders

[`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md)
is additive — call it multiple times:

``` r

myIO(data = df) |>
  addIoLayer(type = "regression", label = "fit",
    mapping = list(x_var = "x", y_var = "y"),
    options = list(method = "polynomial", degree = deg, level = ci)) |>
  setSlider("ci_level", "Confidence Level", 0.80, 0.99, 0.95, 0.01) |>
  setSlider("degree", "Polynomial Degree", 1, 5, 2, 1)
```

### Debounce

For heavy transforms, increase the debounce to avoid excessive
re-renders:

``` r

setSlider("span", "LOESS Span", 0.1, 1.0, 0.5, 0.05, debounce = 500)
```

------------------------------------------------------------------------

## Shiny Input Reference

All myIO Shiny inputs follow the pattern `myIO-{outputId}-{event}`:

| Input key | Trigger | Payload |
|----|----|----|
| `myIO-{id}-brushed` | Brush end or clear | `{ data, extent, keys, layerLabel }` |
| `myIO-{id}-annotated` | Annotation add/remove/clear | `{ annotations, action, latest }` |
| `myIO-{id}-slider-{param}` | Slider drag (debounced) | Numeric value |
| `myIO-{id}-rollover` | Hover on element | JSON data point |
| `myIO-{id}-dragEnd` | Point drag completed | `{ point, layerLabel }` |
| `myIO-{id}-error` | Render error | Error message string |

------------------------------------------------------------------------

## Static HTML vs Shiny

Not every feature requires a running Shiny server:

| Feature | Static HTML | Shiny |
|----|----|----|
| Brush selection | Visual highlight + scoped CSV export | \+ reactive `input$brushed` |
| Annotations | Click to label + CSV export | \+ reactive `input$annotated` |
| Linked brushing | Crosstalk client-side linking | \+ server-side recomputation |
| Parameter sliders | Disabled (renders with default) | Full reactive recomputation |
| Drag points | Live regression refit | \+ reactive `input$dragEnd` |
| Tooltips | Always work | \+ reactive `input$rollover` |
| CSV/PNG export | Always work | Always work |

The I/O system is designed so that static HTML gets the best experience
possible — brushing and annotation work without Shiny. The Shiny layer
adds reactive data flow on top.

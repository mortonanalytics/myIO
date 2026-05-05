# Why myIO

## The problem

R has excellent interactive visualization packages. So why build another
one?

myIO addresses a specific gap in the ecosystem:

1.  **Translation layers lose statistical annotations.** Converting
    `ggplot2` objects to interactive formats can drop confidence
    interval ribbons, regression equations, and label geoms. This is an
    inherent limitation of translating between grammars.

2.  **Statistical overlays require manual assembly.** With most
    interactive packages, users must pre-compute confidence intervals,
    regression diagnostics, and error bars in R, then manually layer
    them onto charts. This is tedious and error-prone.

3.  **Native R-side computation enables composability.** By computing
    transforms in R and rendering in D3.js, myIO avoids translation
    artifacts entirely. The statistical layer and the rendering layer
    connect through a clean data contract.

myIO solves this with a **composable transform pipeline**: statistical
computation happens in R (where it belongs), rendering happens in D3.js
(where it’s beautiful), and the two connect through a clean data
contract.

## What myIO does differently

### 1. Confidence intervals as first-class layers

Confidence interval bands are notoriously difficult to render correctly
in interactive charts built through translation layers. myIO computes CI
bands natively in R and renders them as a first-class area layer:

``` r

myIO(data = mtcars) |>
  addIoLayer(type = "point", color = "#4E79A7", label = "Data",
    mapping = list(x_var = "wt", y_var = "mpg")) |>
  addIoLayer(type = "line", color = "#E15759", label = "Trend",
    transform = "lm",
    mapping = list(x_var = "wt", y_var = "mpg")) |>
  addIoLayer(type = "area", color = "#E15759", label = "95% CI",
    transform = "ci",
    mapping = list(x_var = "wt", y_var = "mpg"),
    options = list(level = 0.95))
```

The `ci` transform uses
[`stats::predict()`](https://rdrr.io/r/stats/predict.html) with
`interval = "confidence"` and outputs a grid of `low_y` / `high_y`
bounds. The area renderer displays them as a smooth band. Prediction
intervals work the same way with
`options = list(interval = "prediction")`.

### 2. One-line regression with R² annotation

Displaying a regression equation alongside an interactive chart
typically requires multiple packages and manual assembly. myIO’s
`regression` composite handles the entire workflow in one call:

``` r

myIO(data = mtcars) |>
  addIoLayer(type = "regression", label = "MPG vs Weight",
    mapping = list(x_var = "wt", y_var = "mpg"),
    options = list(method = "lm", showCI = TRUE, showStats = TRUE))
```

This auto-expands into four sub-layers: scatter points, trend line, CI
band, and an R² annotation — all styled consistently. Change `method` to
`"loess"` or `"polynomial"` to switch the model.

### 3. Composable transforms

Every myIO chart uses the same pattern: **type + transform = layer**.
Transforms are R functions that compute statistical summaries and return
a data frame. The renderer doesn’t know or care what the numbers mean —
it just plots fields.

This means you can compose transforms freely:

``` r

# Scatter + LOESS smooth + CI band + residual plot
myIO(data = mtcars) |>
  addIoLayer(type = "point", label = "Data",
    mapping = list(x_var = "wt", y_var = "mpg")) |>
  addIoLayer(type = "line", label = "LOESS", transform = "loess",
    mapping = list(x_var = "wt", y_var = "mpg"),
    options = list(span = 0.5))
```

Available transforms:

| Transform | What it computes | Output |
|----|----|----|
| `"lm"` | Linear regression fitted values | Line |
| `"loess"` | LOESS non-linear smoothing | Line |
| `"polynomial"` | Polynomial regression (degree N) | Line |
| `"ci"` | Confidence or prediction interval | Area band |
| `"smooth"` | Simple or exponential moving average | Line |
| `"mean"` | Group mean | Points or bars |
| `"mean_ci"` | Group mean ± confidence interval | Range bars (error bars) |
| `"residuals"` | Regression residuals vs. fitted | Points |
| `"summary"` | Aggregation (count, sum, sd, var, min, max) | Points or bars |

All transforms use base R’s `stats` package — no additional
dependencies.

### 4. Composite charts expand into primitives

Complex statistical charts like boxplots and violins are defined as
**composites** that auto-expand into simpler layers:

    boxplot → rangeBar (IQR) + point (whisker caps) + point (median) + point (outliers)
    violin  → area (density) + rangeBar (IQR box) + point (median)
    regression → point (scatter) + line (trend) + area (CI band) + text (R²)

Each sub-layer renders independently, which means:

- The IQR box can have a different color than the whiskers
- Outliers can be toggled on/off via
  `options = list(showOutliers = TRUE)`
- Tooltips work on every sub-component
- Animations are layered (whiskers grow from box edges, then caps
  appear)

You don’t need to know about this decomposition — just call
`addIoLayer(type = "boxplot", ...)` and it works. But if you need custom
control, you can compose the sub-layers manually.

### 5. Error bars with one line

Mean ± confidence interval bars are a standard in scientific
publications. In most interactive viz packages, you must compute the CI
yourself and manually assemble the layers.

myIO does it in one call:

``` r

myIO(data = iris) |>
  addIoLayer(type = "rangeBar", label = "Mean ± 95% CI",
    transform = "mean_ci",
    mapping = list(x_var = "Species", y_var = "Sepal.Length"),
    options = list(level = 0.95)) |>
  defineCategoricalAxis(xAxis = TRUE) |>
  setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
```

The `mean_ci` transform computes the group mean, standard error, and
t-distribution CI bounds — matching
[`stats::t.test()`](https://rdrr.io/r/stats/t.test.html) output exactly.

## Design philosophy

myIO follows three principles:

1.  **R computes, D3 renders.** Statistical computation stays in R where
    the ecosystem is strongest. JavaScript handles rendering and
    interaction. There is no translation layer that can break.

2.  **Type + transform = layer.** Every chart is built from the same two
    concepts. This makes the API small and predictable — 15 transforms
    and 18 chart types compose into hundreds of visualizations.

3.  **Composites expand into primitives.** Complex charts decompose into
    simpler ones. This means new statistical overlays don’t require new
    renderers — they reuse existing ones.

### 6. Bidirectional I/O

Most charting libraries are output-only: data goes in, a picture comes
out. myIO is an **information system** — user interactions flow back as
structured data:

- [`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md):
  rectangle select returns selected rows
- [`setAnnotation()`](https://mortonanalytics.github.io/myIO/reference/setAnnotation.md):
  click to label points; export annotations as a data frame
- [`setLinked()`](https://mortonanalytics.github.io/myIO/reference/setLinked.md):
  Crosstalk cross-widget brushing
- [`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md):
  parameter sliders that trigger R recomputation

This means the visualization is not just a display — it is an input
device.

## When to use myIO

myIO is a good fit when you need:

- Interactive statistical charts in Shiny apps or R Markdown
- Confidence intervals, regression lines, or error bars that render
  correctly
- Composable overlays (scatter + trend + CI band + annotation)
- Brush selection that returns data, not just visual feedback
- Click-to-annotate for flagging outliers, events, or regions of
  interest
- Linked views across multiple charts via Crosstalk
- Moving average or smoothing overlays on time-series data
- Regression diagnostics (residual plots)
- Publication-quality D3.js rendering with minimal code

## When to use something else

- **ggplot2 + ggiraph**: If you need the full ggplot2 grammar and just
  want hover/click interactivity added on top. ggiraph faithfully
  preserves ggplot2 output.
- **echarts4r**: If you need 30+ chart types and don’t mind learning a
  non-ggplot2 API. echarts4r has broader chart coverage.
- **plotly**: If you have existing ggplotly() code that works and don’t
  need CI bands or statistical annotations.

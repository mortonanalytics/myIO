# myIO 1.2.0 (development)

## Crosstalk: expanded chart-type coverage

* `setLinked()` now links `waffle`, `beeswarm`, `lollipop`, and `dumbbell`
  layers in addition to the previously supported `point`, `bar`, `groupedBar`,
  `histogram`, and `hexbin`. Selection dims non-matching elements; filter
  hides them. Aggregate chart types (`boxplot`, `violin`, `qq`, `regression`,
  `density`, `ridgeline`, `survfit`, `comparison`) remain outside crosstalk
  in v1.2.
* New vignette `crosstalk-linking` demonstrates linking myIO with
  `DT::datatable()` and `reactable::reactable()`, with code listings for
  plotly and leaflet.

## bslib and Quarto Dashboards integration

* `myIO()` widgets now declare a sizing policy with `browser.fill = TRUE`
  and are tagged as `html-fill-item` via `htmltools::bindFillRole()`, so
  they fill container height inside `bslib::card()`, Quarto Dashboard
  `{.fill}` cards, and flexdashboard layouts. Rendering in plain RMarkdown
  and Shiny at the default 400px height is unchanged.
* Widget resize is now guarded against zero-dimension containers that can
  appear briefly during fill-layout transitions.

## Calendar heatmap

* New `calendarHeatmap` chart type — GitHub-contributions-style grid of daily
  cells over a single calendar year. Usage:
  `addIoLayer(type = "calendarHeatmap", data, mapping = list(date = "day", value = "x"))`.
  Supports Sunday or Monday week starts via `options$weekStart`, continuous
  color legend, and linked-cursor sync across two linked calendars. Multi-year
  data is rejected in v1.2; multi-year layouts are planned for v1.3. New CSS
  variables: `--chart-calendar-cell-gap`, `--chart-calendar-cell-stroke`,
  `--chart-calendar-empty-fill`.

## Theme gallery

* 12 named theme presets: `setTheme(preset = "midnight")`. Available presets:
  midnight, ocean, forest, sunset, monochrome, neon, corporate, academic,
  nature, minimal, retro, warm. Plus light/dark via mode parameter.

## Linked brushing

* `linkCharts(chart1, chart2, on = "column")` enables cross-chart selection.
  Brush in one chart highlights matching rows in linked charts. Works in Shiny
  and static HTML. Aggregation-to-source-row key resolution for summary views.

## Linked cursor

* `linkCharts()` and `setLinked()` gain a `cursor = TRUE` argument that draws a
  synchronized vertical crosshair on every linked chart when the user hovers
  any chart in the group. Supports point, bar, line, area, groupedBar, hexbin,
  and histogram layers (donut and treemap are excluded — no x-axis to sync on).
  Off by default; enable per-link or retrofit with `setLinkedCursor()` on a
  pre-linked widget. New `--chart-cursor-rule-color`/`-width`/`-dasharray` CSS
  variables theme the crosshair.

## Group-by auto-series

* Pass a `dplyr::group_by()` tibble to `addIoLayer()` and it auto-creates one
  layer per group with colors from the Okabe-Ito palette. Soft dplyr dependency.

## Survival curves (Kaplan-Meier)

* `addIoLayer(type = "survfit", mapping = list(time = "time", status = "status"))`
  computes Kaplan-Meier estimator with Greenwood CI using base R only (no
  `survival` package dependency). Composite expands to step-curve line, CI band,
  and censored-observation markers. Group stratification supported.

## Distribution fitting overlay

* `addIoLayer(type = "histogram_fit", mapping = list(value = "x"), options = list(family = "normal"))`
  fits normal, lognormal, or exponential distributions via MLE. Composite
  renders histogram + fitted density curve + optional parameter annotation.

## Layer opacity control

* `setLayerOpacity(label, opacity)` sets per-layer opacity (0-1). Critical for
  CI bands overlaying scatter data.

## SVG accessibility

* ARIA roles (`graphics-document`, `graphics-object`, `graphics-symbol`) applied
  to SVG chart structure for screen reader navigation.
* Keyboard navigation: arrow keys traverse layers and data points, with live
  region announcements (150ms debounce).
* Hidden data table fallback for screen reader access to raw data (capped at
  500 rows).
* Focus ring styling and screen-reader-only utility class.

## New chart types

* `lollipop` — vertical stem with circle head, supports `mean` and `summary`
  transforms. Compatible with categorical x-axis charts.
* `dumbbell` — connected dots showing a range between `low_y` and `high_y`.
* `waffle` — 10x10 grid of colored squares representing proportions. Standalone.
* `beeswarm` — dodge-positioned points to avoid overlap. Inline dodge algorithm.
* `bump` — smooth S-curves showing rank/value changes over time with grouped lines.
* `radar` — spider/radar chart with radial axes and polygon data fill.
* `funnel` — narrowing horizontal bars for conversion pipeline data.
* `parallel` — parallel coordinates for multivariate exploration.
  All new types support themed colors and standard tooltip formatting.

## Small multiples / faceting

* `setFacet(var, ncol, scales)` splits charts into a CSS grid of panels, one per
  unique value of the faceting variable. Supports fixed and free scale modes,
  auto-layout with configurable minimum panel width, and responsive breakpoints.

## Export enhancements

* `setExportOptions()` controls which export buttons appear in the toolbar
  (PNG, SVG, clipboard, CSV). New SVG download button and clipboard copy
  (SVG + PNG) via the Clipboard API.
* CSS custom properties resolved in exported SVGs for correct dark-mode colors.

## Dark mode / theme system

* `setTheme(mode = "dark")` applies a WCAG AA-verified dark palette across all
  chart elements. Also supports `"light"` and `"auto"` (detects OS preference
  and Quarto/Bootstrap `data-bs-theme`).
* Backward compatible: existing `setTheme(bg = "#fff")` calls still work.
* New `overrides` parameter for fine-grained CSS custom property control.
* High-contrast and reduced-motion CSS media query support.

## Sparkline mode

* `myIO(sparkline = TRUE)` renders a compact, axes-free chart suitable for
  embedding in table cells (reactable, DT, gt). Strips legend, axes, reference
  lines, and all interactions. Default height 20px. Supports line, bar, and
  area layer types.

# myIO 1.1.0

## I/O interaction system

myIO now supports bidirectional data flow — user interactions return
structured data, not just visual feedback.

* `setBrush()`: rectangle brush selection on point, bar, histogram, hexbin,
  and grouped bar charts. Selected points available as Shiny reactive input
  or scoped CSV export in static HTML.
* `setAnnotation()`: click any data point to attach a label. Annotations
  stored as structured data (source key, coordinates, label, category color,
  timestamp) and exportable as CSV. Supports preset label dropdowns and
  color category pickers.
* `setLinked()`: Crosstalk `SharedData` integration for cross-widget linked
  brushing. Selection dims non-matching points; optional filter mode hides
  them. Supports source, target, or bidirectional modes.
* `setSlider()`: parameter sliders below the chart that trigger Shiny
  re-rendering with configurable debounce. Renders disabled with tooltip
  in static HTML.

## Bug fixes

* `dragPoints()` now correctly emits the `dragEnd` event to Shiny
  (`input$myIO-{id}-dragEnd`), which was previously registered but never
  fired.

# myIO 1.0.0

## Statistical transforms

* New composable transform pipeline: `type + transform = layer`. Transforms
  compute statistics in R; renderers display them in D3.js.
* Transforms: `lm`, `loess`, `polynomial`, `ci`, `smooth`, `mean`, `mean_ci`,
  `residuals`, `summary`, `pairwise_test`, `qq`.
* Composite chart expansion: complex charts decompose into primitive layers.

## Chart types (20)

* Basic: `line`, `point`, `bar`, `area`, `groupedBar`.
* Statistical: `histogram`, `hexbin`, `regression`, `qq`.
* Distribution: `boxplot`, `violin`, `ridgeline`, `comparison`.
* Financial: `candlestick`, `waterfall`, `heatmap`.
* Standalone: `donut`, `gauge`, `treemap`, `sankey`.

## Composites

* `boxplot`: expands into IQR box + whisker caps + median + outliers.
* `violin`: expands into density area + IQR box + median point.
* `ridgeline`: density curves stacked vertically by group.
* `regression`: scatter + trend line + CI band + R-squared annotation.
* `qq`: Q-Q scatter + reference line + confidence envelope.
* `comparison`: boxplots + pairwise significance brackets.

## Interactions

* Tooltips with automatic formatting via `setToolTipOptions()`.
* Drag interaction via `dragPoints()`.
* CSV, SVG, and PNG export buttons.
* Reference lines via `setReferenceLines()`.
* Y-variable toggle via `setToggle()`.

## Infrastructure

* Responsive sizing that adapts to container dimensions.
* Shiny integration with `myIOOutput()` and `renderMyIO()`.
* Pipe-friendly API using native `|>`.
* Theming via CSS custom properties with `setTheme()`.
* Okabe-Ito colorblind-safe default palette.

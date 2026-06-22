# myIO (development version)

## New features

* New `setTransition(duration, easing, stagger)` configures chart animations:
  `duration` in milliseconds, `easing` (one of `"linear"`, `"quad"`, `"cubic"`,
  `"sin"`, `"exp"`, `"circle"`, `"back"`, `"bounce"`, `"elastic"`, mapped to the
  corresponding d3 easing), and `stagger` (per-element cascade delay in ms).
  All arguments are optional and additive; unset values keep each renderer's
  existing defaults, so the change is fully backward compatible.
  `setTransitionSpeed()` is now a thin wrapper over `setTransition(duration = )`.
  Animation stays fully opt-out-able: `duration = 0` disables it, and easing and
  stagger automatically no-op when the effective duration is 0, including under
  the viewer's `prefers-reduced-motion: reduce` system setting. A Playwright e2e
  spec verifies animate-when-on, still-when-off, and still-under-reduced-motion.

## Performance and tooling

* The production JavaScript bundle is now minified. The shipped
  `inst/htmlwidgets/myIO/myIOapi.js` drops from 2.32 MB to 1.20 MB raw
  (398,650 to 298,757 bytes gzipped, -25%) with no behavior change; the
  development `watch` build stays unminified for debugging.
* End-to-end tests now run from a committed `playwright.config.ts` and a new
  `e2e` CI workflow. The suite builds and loads the minified `myIOapi.js`,
  guarding the production bundle that source-importing unit tests cannot catch.
* Touch interaction is now verified end-to-end: a touch-emulation Playwright spec
  on iOS- and Android-class viewports confirms a `touchstart` on a bar surfaces
  the tooltip with the datum's content and `touchend` dismisses it, guarding the
  mobile hover path against the production bundle.

## Improved error messages and API ergonomics

* `setFacet()`, `setLayerOpacity()`, and `setTheme(mode = )` now report invalid
  arguments with consistent, actionable messages (e.g.
  `setFacet(): \`scales\` must be "fixed", "free_x", "free_y", "free", not "x".`)
  instead of bare `stopifnot()` failures. `setColorScheme()` errors are likewise
  function-prefixed. No change to which inputs are accepted.
* `setTheme()` now warns when passed an unknown argument that lacks the required
  `--` prefix (e.g. a misspelled `text_colour`) and suggests the intended
  argument, instead of silently dropping it. Valid `--`-prefixed CSS overrides
  are unaffected.
* `setTheme()` documents the named `preset` values (`"midnight"`, `"ocean"`,
  `"forest"`, `"sunset"`, `"monochrome"`, `"neon"`, `"corporate"`, `"academic"`,
  `"nature"`, `"minimal"`, `"retro"`, `"warm"`, plus `"light"`/`"dark"`); the
  `preset` argument was already functional.
* `setLinked()` and `linkCharts()` now cross-reference each other in their
  documentation to clarify when to use the Crosstalk path versus the
  group-identifier path.
## Documentation

* New "Theme Gallery" article renders the same chart under all named presets
  (`midnight`, `ocean`, `forest`, `sunset`, `monochrome`, `neon`, `corporate`,
  `academic`, `nature`, `minimal`, `retro`, `warm`, plus `light`/`dark`) as
  live, side-by-side previews, and shows how to layer custom CSS overrides on
  top of a preset.
## Performance and reliability

* Inline Arrow IPC payloads now decode via the native `Uint8Array.fromBase64`
  when the browser provides it (falling back to the previous `atob` loop),
  avoiding a per-character JavaScript callback over large payloads in the
  in-memory and DuckDB-WASM engines.
* Added a regression test confirming charts that already render an inline
  legend are not given a duplicated legend on image/SVG export (GH #64).

# myIO 1.2.0

## LLM tool-calling schema

* New machine-readable chart specification schema (`inst/myio-schema.json`)
  describing all chart types, required mappings, valid transforms, and function
  signatures, generated from the package's own contracts.
* Six exported R tools let large language model agents author and verify charts
  against that schema: `myio_list_chart_types()`, `myio_chart_schema()`,
  `myio_validate_spec()`, `myio_list_functions()`, `myio_function_signature()`,
  and `myio_validate_call()`. A Model Context Protocol server in the package's
  source repository exposes the same six tools to MCP-compatible clients.
* New vignette `llm-tool-calling` demonstrates a generate-validate-repair loop.

## Uncertainty visualizations

* New `quantile_dots` chart type and `quantile_dots` transform render a
  Wilkinson dot plot of predictive quantiles for communicating uncertainty.
* New `fan` composite renders a fan chart of nested prediction intervals around
  a central estimate.

## Gallery and chart context

* `myIO(title = ...)` and `setTitle()` add a backward-compatible chart title
  surface rendered inside the SVG. Existing charts that omit a title are
  unchanged.
* Axis titles from `setAxisFormat(xLabel = ..., yLabel = ...)` now render in
  the chart SVG, and multi-series charts get a compact visible legend while
  preserving the existing action-sheet legend.
* The gallery now carries chart titles across examples, repairs horizontal
  bars, mean-CI, heatmap margins, gauge thresholds, treemap labels, date-based
  finance examples, and shows themes across a small grid of representative
  charts.

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

## Bug fixes

* `myio_validate_spec()` and the chart specification schema no longer reject
  valid specs for chart types with a single required mapping (for example
  `histogram`, `gauge`, and `qq`). The schema now always represents list-typed
  fields as arrays.

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

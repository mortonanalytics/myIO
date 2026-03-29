# myIO 1.2.0 (development)

## New chart types

* `lollipop` — vertical stem with circle head, supports `mean` and `summary`
  transforms. Compatible with categorical x-axis charts.
* `dumbbell` — connected dots showing a range between `low_y` and `high_y`.
* `waffle` — 10x10 grid of colored squares representing proportions. Standalone.
* `beeswarm` — dodge-positioned points to avoid overlap. Inline dodge algorithm.
* `bump` — smooth S-curves showing rank/value changes over time with grouped lines.
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

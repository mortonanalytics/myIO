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

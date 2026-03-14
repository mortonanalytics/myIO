# myIO 1.0.0

## Features

* Layered grammar for composing visualizations with transform-aware
  `addIoLayer()`, including `transform = "lm"` for derived line layers.
* Chart types: bar, grouped bar, line, area, scatter, histogram, hexbin,
  treemap, gauge, and donut charts.
* Versioned widget spec with per-layer ids, transform metadata, and source-key provenance.
* Interactive tooltips with automatic formatting via `setToolTipOptions()`.
* Responsive sizing that adapts to container dimensions.
* CSV and SVG export buttons.
* Reference lines support via `setReferenceLines()`.
* Drag interaction support via `dragPoints()`.
* Shiny integration with `myIOOutput()` and `renderMyIO()`.
* Pipe-friendly API using native `|>`.
* Option setters: `setAxisFormat()`, `setAxisLimits()`, `setMargin()`,
  `setColorScheme()`, `setTheme()`, `setTransitionSpeed()`,
  `defineCategoricalAxis()`, `setToggle()`, `flipAxis()`,
  `suppressAxis()`, `suppressLegend()`.

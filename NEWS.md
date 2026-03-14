# myIO 2.0.0

## Features

* Layered grammar for composing visualizations with transform-aware
  `addIoLayer()`, including `transform = "lm"` for derived line layers.
* Chart types: bar, grouped bar, line, area, scatter, histogram, hexbin,
  treemap, gauge, and donut charts.
* Versioned widget spec with per-layer ids, transform metadata, and source-key provenance.
* Interactive tooltips with automatic formatting.
* Responsive sizing that adapts to container dimensions.
* CSV and SVG export buttons.
* Reference lines support via `ioReferenceLine()`.
* Drag interaction support.
* Shiny integration with `myIOOutput()` and `renderMyIO()`.
* Pipe-friendly API supporting both `%>%` and native `|>`.
* Comprehensive option setters: `ioTitle()`, `ioXlab()`, `ioYlab()`,
  `ioWidth()`, `ioHeight()`, `ioMargin()`, `ioColorPalette()`,
  `ioLegend()`, `ioAnimationDuration()`.

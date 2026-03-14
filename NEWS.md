# myIO 1.0.0

## Features

* Layered grammar for composing visualizations: add multiple geometry and
  statistical layers to a single chart via `addIoLayer()` and
  `addIoStatLayer()`.
* Chart types: bar, grouped bar, line, area, scatter, histogram, hexbin,
  treemap, gauge, and donut charts.
* Built-in statistical layers including linear regression lines.
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

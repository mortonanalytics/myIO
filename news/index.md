# Changelog

## myIO 1.0.0

### Features

- Layered grammar for composing visualizations with transform-aware
  [`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md),
  including `transform = "lm"` for derived line layers.
- Chart types: bar, grouped bar, line, area, scatter, histogram, hexbin,
  treemap, gauge, and donut charts.
- Versioned widget spec with per-layer ids, transform metadata, and
  source-key provenance.
- Interactive tooltips with automatic formatting via
  [`setToolTipOptions()`](https://mortonanalytics.github.io/myIO/reference/setToolTipOptions.md).
- Responsive sizing that adapts to container dimensions.
- CSV and SVG export buttons.
- Reference lines support via
  [`setReferenceLines()`](https://mortonanalytics.github.io/myIO/reference/setReferenceLines.md).
- Drag interaction support via
  [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md).
- Shiny integration with
  [`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
  and
  [`renderMyIO()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md).
- Pipe-friendly API using native `|>`.
- Option setters:
  [`setAxisFormat()`](https://mortonanalytics.github.io/myIO/reference/setAxisFormat.md),
  [`setAxisLimits()`](https://mortonanalytics.github.io/myIO/reference/setAxisLimits.md),
  [`setMargin()`](https://mortonanalytics.github.io/myIO/reference/setMargin.md),
  [`setColorScheme()`](https://mortonanalytics.github.io/myIO/reference/setColorScheme.md),
  [`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md),
  [`setTransitionSpeed()`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md),
  [`defineCategoricalAxis()`](https://mortonanalytics.github.io/myIO/reference/defineCategoricalAxis.md),
  [`setToggle()`](https://mortonanalytics.github.io/myIO/reference/setToggle.md),
  [`flipAxis()`](https://mortonanalytics.github.io/myIO/reference/flipAxis.md),
  [`suppressAxis()`](https://mortonanalytics.github.io/myIO/reference/suppressAxis.md),
  [`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md).

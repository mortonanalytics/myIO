# Package index

## Core

Create widgets and add visualization layers

- [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md) :
  Create a myIO Chart Widget
- [`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
  : Add a Layer to a myIO Chart

## Axes & Scales

Control axis formatting, limits, and orientation

- [`setAxisFormat()`](https://mortonanalytics.github.io/myIO/reference/setAxisFormat.md)
  : Set Axis Format
- [`setAxisLimits()`](https://mortonanalytics.github.io/myIO/reference/setAxisLimits.md)
  : Set Axis Limits
- [`defineCategoricalAxis()`](https://mortonanalytics.github.io/myIO/reference/defineCategoricalAxis.md)
  : Define Categorical Axis
- [`flipAxis()`](https://mortonanalytics.github.io/myIO/reference/flipAxis.md)
  : Flip Chart Axes
- [`suppressAxis()`](https://mortonanalytics.github.io/myIO/reference/suppressAxis.md)
  : Suppress Axis Display

## Appearance

Customize colors, margins, themes, and visual elements

- [`setMargin()`](https://mortonanalytics.github.io/myIO/reference/setMargin.md)
  : Set Chart Margins
- [`setColorScheme()`](https://mortonanalytics.github.io/myIO/reference/setColorScheme.md)
  : Set Color Scheme
- [`setTheme()`](https://mortonanalytics.github.io/myIO/reference/setTheme.md)
  : Set Chart Theme
- [`setTitle()`](https://mortonanalytics.github.io/myIO/reference/setTitle.md)
  : Set Chart Title
- [`setTransitionSpeed()`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)
  : Set Transition Speed
- [`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md)
  : Suppress Legend Display

## Interactions

Add interactive behaviors like brushing, annotation, and linked views

- [`setBrush()`](https://mortonanalytics.github.io/myIO/reference/setBrush.md)
  : Enable Brush Selection
- [`setAnnotation()`](https://mortonanalytics.github.io/myIO/reference/setAnnotation.md)
  : Enable Click-to-Annotate
- [`setLinked()`](https://mortonanalytics.github.io/myIO/reference/setLinked.md)
  : Enable Linked Brushing via Crosstalk
- [`setLinkedCursor()`](https://mortonanalytics.github.io/myIO/reference/setLinkedCursor.md)
  : Toggle Linked Cursor Sync on a myIO Widget
- [`setSlider()`](https://mortonanalytics.github.io/myIO/reference/setSlider.md)
  : Add a Parameter Slider (Shiny Only)
- [`dragPoints()`](https://mortonanalytics.github.io/myIO/reference/dragPoints.md)
  : Enable Draggable Points
- [`setReferenceLines()`](https://mortonanalytics.github.io/myIO/reference/setReferenceLines.md)
  : Set Reference Lines
- [`setToggle()`](https://mortonanalytics.github.io/myIO/reference/setToggle.md)
  : Set Toggle Interaction
- [`setToolTipOptions()`](https://mortonanalytics.github.io/myIO/reference/setToolTipOptions.md)
  : Set Tooltip Options
- [`linkCharts()`](https://mortonanalytics.github.io/myIO/reference/linkCharts.md)
  : Link Charts for Cross-Selection

## Layout & Composition

Multi-panel composition, opacity, and export configuration

- [`setFacet()`](https://mortonanalytics.github.io/myIO/reference/setFacet.md)
  : Set Faceting (Small Multiples)
- [`setLayerOpacity()`](https://mortonanalytics.github.io/myIO/reference/setLayerOpacity.md)
  : Set Layer Opacity
- [`setExportOptions()`](https://mortonanalytics.github.io/myIO/reference/setExportOptions.md)
  : Configure Export Options

## Big-data

Large-dataset virtualization, WebGL rendering, and DuckDB-WASM cache

- [`setBigData()`](https://mortonanalytics.github.io/myIO/reference/setBigData.md)
  : Attach a big-data source to a myIO widget
- [`install_duckdb_wasm()`](https://mortonanalytics.github.io/myIO/reference/install_duckdb_wasm.md)
  : Install the DuckDB-WASM binary for large-dataset virtualization
- [`duckdb_wasm_status()`](https://mortonanalytics.github.io/myIO/reference/duckdb_wasm_status.md)
  : DuckDB-WASM cache status
- [`clear_duckdb_wasm_cache()`](https://mortonanalytics.github.io/myIO/reference/clear_duckdb_wasm_cache.md)
  : Remove DuckDB-WASM cache entries

## Shiny

Use myIO widgets in Shiny applications

- [`myIOOutput()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
  [`renderMyIO()`](https://mortonanalytics.github.io/myIO/reference/myIO-shiny.md)
  : Shiny Bindings for myIO

## Diagnostics

Debugging and error reporting

- [`myIO_last_error()`](https://mortonanalytics.github.io/myIO/reference/myIO_last_error.md)
  : Diagnose myIO Rendering Errors

# Package index

## Core

Create widgets and add visualization layers

- [`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md) :
  Create a myIO Chart Widget
- [`addIoLayer()`](https://mortonanalytics.github.io/myIO/reference/addIoLayer.md)
  : Add a Layer to a myIO Chart
- [`addKeyframe()`](https://mortonanalytics.github.io/myIO/reference/addKeyframe.md)
  : Add a Named Data Keyframe

## Axes & Scales

Control axis formatting, limits, and orientation

- [`setAxisFormat()`](https://mortonanalytics.github.io/myIO/reference/setAxisFormat.md)
  : Set Axis Format
- [`setAxisLimits()`](https://mortonanalytics.github.io/myIO/reference/setAxisLimits.md)
  : Set Axis Limits
- [`setEqualAspect()`](https://mortonanalytics.github.io/myIO/reference/setEqualAspect.md)
  : Equal Units per Pixel on x and y
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
- [`setTransition()`](https://mortonanalytics.github.io/myIO/reference/setTransition.md)
  : Configure Chart Transitions
- [`setTransitionSpeed()`](https://mortonanalytics.github.io/myIO/reference/setTransitionSpeed.md)
  : Set Transition Speed
- [`suppressLegend()`](https://mortonanalytics.github.io/myIO/reference/suppressLegend.md)
  : Suppress Legend Display
- [`setLegendTitle()`](https://mortonanalytics.github.io/myIO/reference/setLegendTitle.md)
  : Set the Legend Title

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

## myDAR walks

Read myDAR walk outputs and plot them

- [`read_mydar_mesh()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_walk()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_points()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_terrain()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_orthophoto()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_gpkg()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  [`read_mydar_trajectory()`](https://mortonanalytics.github.io/myIO/reference/read_mydar_walk.md)
  : Read a myDAR walk
- [`mydar_cloud_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_cloud_view.md)
  : Map view of a myDAR walk, in 2D and 3D
- [`mydar_plan_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_orthophoto_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_terrain_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_profile()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_profile_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_trajectory_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_sigma_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_accuracy_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  [`mydar_gps_view()`](https://mortonanalytics.github.io/myIO/reference/mydar_views.md)
  : Plot a myDAR walk
- [`mydar_dashboard()`](https://mortonanalytics.github.io/myIO/reference/mydar_dashboard.md)
  : myDAR walk dashboard
- [`mydar_iphone_walk`](https://mortonanalytics.github.io/myIO/reference/mydar_iphone_walk.md)
  : A real myDAR iPhone walk, in local coordinates
- [`mydar_iphone_cloud()`](https://mortonanalytics.github.io/myIO/reference/mydar_iphone_cloud.md)
  : The bundled myDAR walk's point cloud

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
- [`myIOProxy()`](https://mortonanalytics.github.io/myIO/reference/myIOProxy.md)
  [`updateMyIOData()`](https://mortonanalytics.github.io/myIO/reference/myIOProxy.md)
  : Update a myIO chart in place from the Shiny server
- [`updateMyIOOptions()`](https://mortonanalytics.github.io/myIO/reference/updateMyIOOptions.md)
  : Update layer options of a myIO chart in place from the Shiny server
- [`setKeyframe()`](https://mortonanalytics.github.io/myIO/reference/setKeyframe.md)
  [`stepKeyframe()`](https://mortonanalytics.github.io/myIO/reference/setKeyframe.md)
  : Control Keyframes in Shiny

## LLM Tool Calling

Machine-readable schema and validators for agent-built chart specs

- [`myio_list_chart_types()`](https://mortonanalytics.github.io/myIO/reference/myio_list_chart_types.md)
  : List myIO Chart Types for LLM Tool Calling
- [`myio_chart_schema()`](https://mortonanalytics.github.io/myIO/reference/myio_chart_schema.md)
  : Get myIO Chart Schema for LLM Tool Calling
- [`myio_validate_spec()`](https://mortonanalytics.github.io/myIO/reference/myio_validate_spec.md)
  : Validate a myIO Chart Specification
- [`myio_list_functions()`](https://mortonanalytics.github.io/myIO/reference/myio_list_functions.md)
  : List myIO Functions for LLM Tool Calling
- [`myio_function_signature()`](https://mortonanalytics.github.io/myIO/reference/myio_function_signature.md)
  : Get a myIO Function Signature for LLM Tool Calling
- [`myio_validate_call()`](https://mortonanalytics.github.io/myIO/reference/myio_validate_call.md)
  : Validate a myIO Function Call

## Diagnostics

Debugging and error reporting

- [`myIO_last_error()`](https://mortonanalytics.github.io/myIO/reference/myIO_last_error.md)
  : Diagnose myIO Rendering Errors

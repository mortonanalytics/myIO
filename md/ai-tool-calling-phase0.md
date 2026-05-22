# AI Tool Calling Phase 0

Date: 2026-05-21

## Decisions

The schema is generated from live contracts and written to `inst/myio-schema.json` and `mcp/myio-schema.json`. The R package reads the `inst/` copy with `system.file()`. The MCP package reads its local copy so it can be published or run independently from the R package layout.

`mcp/` and `tools/` are excluded from the R source package via `.Rbuildignore`; they are development and Node distribution assets, not CRAN payload.

The tool surface is six tools in both languages:

- `list_chart_types`
- `get_chart_schema`
- `validate_spec`
- `list_functions`
- `get_function_signature`
- `validate_call`

Stable error codes are:

- `UNKNOWN_TYPE`
- `MISSING_MAPPING`
- `UNKNOWN_MAPPING_KEY`
- `INVALID_TRANSFORM`
- `MISSING_COLUMN`
- `NON_NUMERIC_COLUMN`
- `UNKNOWN_FUNCTION`
- `UNKNOWN_ARGUMENT`

## Pinned Contract Surface

Types: `line`, `point`, `bar`, `hexbin`, `treemap`, `gauge`, `donut`, `area`, `groupedBar`, `histogram`, `heatmap`, `candlestick`, `waterfall`, `sankey`, `boxplot`, `violin`, `ridgeline`, `rangeBar`, `text`, `regression`, `bracket`, `comparison`, `qq`, `lollipop`, `dumbbell`, `waffle`, `beeswarm`, `bump`, `radar`, `funnel`, `parallel`, `survfit`, `histogram_fit`, `calendarHeatmap`, `quantile_dots`, `fan`.

Renderer-backed types: `area`, `bar`, `beeswarm`, `bracket`, `bump`, `calendarHeatmap`, `candlestick`, `donut`, `dumbbell`, `funnel`, `gauge`, `groupedBar`, `heatmap`, `hexbin`, `histogram`, `line`, `lollipop`, `parallel`, `point`, `quantile_dots`, `radar`, `rangeBar`, `sankey`, `text`, `treemap`, `waffle`, `waterfall`.

Composite types: `boxplot`, `violin`, `ridgeline`, `regression`, `comparison`, `qq`, `survfit`, `histogram_fit`, `fan`.

Transforms: `identity`, `lm`, `cumulative`, `quantiles`, `median`, `outliers`, `density`, `mean`, `summary`, `loess`, `polynomial`, `smooth`, `residuals`, `ci`, `mean_ci`, `pairwise_test`, `qq`, `survfit`, `fit_distribution`, `quantile_dots`.

Exported function signatures are generated into `function_signatures` and currently cover `addIoLayer`, `clear_duckdb_wasm_cache`, `defineCategoricalAxis`, `dragPoints`, `duckdb_wasm_status`, `flipAxis`, `install_duckdb_wasm`, `linkCharts`, `myIO`, `myIO_last_error`, `myIOOutput`, `print.myIO_duckdb_wasm_status`, `renderMyIO`, `setAnnotation`, `setAxisFormat`, `setAxisLimits`, `setBigData`, `setBrush`, `setColorScheme`, `setExportOptions`, `setFacet`, `setLayerOpacity`, `setLinked`, `setLinkedCursor`, `setMargin`, `setReferenceLines`, `setSlider`, `setTheme`, `setTitle`, `setToggle`, `setToolTipOptions`, `setTransitionSpeed`, `stop_duckdb_wasm_missing`, `suppressAxis`, and `suppressLegend`.

The freshness gate must assert exact set equality across type keys, renderer-backed types, composites, transforms, compatibility groups, and function signatures. A count threshold is not sufficient.

## pymyIO Drift Inventory

The local `../pymyIO` builder is behind the current R contract:

- Missing chart types: `quantile_dots`, `fan`.
- Missing transform: `quantile_dots`.
- Missing composite: `fan`.
- Emits `specVersion: 1`; myIO R emits `specVersion: 2`.
- Compatibility groups are not byte-for-byte aligned with R; pymyIO collapses several standalone groups and marks `comparison`, `beeswarm`, and `calendarHeatmap` differently.

The paired pymyIO work should close this drift before adding the six tool helpers on the Python side.

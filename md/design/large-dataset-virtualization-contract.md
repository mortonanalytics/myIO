# Large-dataset virtualization — Layer Contract

Adapted from the standard DB/Rust/TS contract template for myIO's R + JS htmlwidget stack.
This is the single source of truth for names. All implementation agents conform to this file.

## Symbols (R + JS)

| Concept | R symbol | JS symbol (inst/htmlwidgets) | Notes |
|---|---|---|---|
| Install helper | `install_duckdb_wasm` | — | R-only |
| Cache status | `duckdb_wasm_status` | — | R-only, returns named list |
| Cache clear | `clear_duckdb_wasm_cache` | — | R-only |
| Big-data entry point | `setBigData` | — | operates on widget object |
| Engine argument | `engine` | `config.engine` | values: `"auto"`, `"server"`, `"wasm"`, `"svg"` |
| Resolved engine | — | `config.engine` (post-resolution, never `"auto"`) | R resolves `"auto"` before print |
| File-protocol override | — | `config.engine = "svg"` after post-mount detect | JS-only decision |
| Coordinator | — | `Coordinator` (class) | one per htmlwidget page |
| Engine adapter (WASM) | — | `WasmEngineAdapter` | |
| Engine adapter (Shiny) | — | `ShinyEngineAdapter` | |
| Engine adapter (SVG fallback) | — | `SvgNullAdapter` | no-op, for small-data path |
| Memory engine (test double) | — | `MemoryEngine` | apache-arrow + alasql |
| Query cache | — | `QueryCache` (LRU) | |
| Crosstalk adapter | — | `CrosstalkAdapter` | |
| Decimation module | — | `decimate/` namespace | |
| Source registry | — | `SourceRegistry` | coordinator-owned |

## R-exported functions

| Function | Signature | Purpose |
|---|---|---|
| `install_duckdb_wasm` | `install_duckdb_wasm(version = NULL, from = NULL, force = FALSE, quiet = !interactive())` | download WASM binary into `R_user_dir("myIO", "cache")` |
| `duckdb_wasm_status` | `duckdb_wasm_status()` | returns `list(installed, version, cache_dir, size_bytes)` |
| `clear_duckdb_wasm_cache` | `clear_duckdb_wasm_cache(version = NULL)` | remove cached binary |
| `setBigData` | `setBigData(widget, source, rowkey_col = NULL, ...)` | attach a big-data source; `rowkey_col` declares the row-identity column per row-key contract |
| `myIO` | existing + new trailing `engine = "auto"` arg | widget constructor |
| `setLinked` | existing (unchanged R-side) | crosstalk linking entry point |

## R-internal helpers

| Function | Signature | Purpose |
|---|---|---|
| `resolve_engine` | `resolve_engine(engine)` | per-chart arg > `getOption("myIO.engine")` > auto-detect |
| `shiny_query_handler` | `function(message)` registered with `shiny::registerInputHandler` | server-engine dispatcher |
| `duckdb_wasm_cache_dir` | `duckdb_wasm_cache_dir()` | returns path (respects `R_USER_CACHE_DIR`) |
| `duckdb_wasm_manifest` | `duckdb_wasm_manifest()` | parses `inst/duckdb-wasm-manifest.csv` |
| `arrow_ipc_encode` | `arrow_ipc_encode(df_or_table)` | returns base64 string for inline payload |

## Widget payload shape

R writes this structure to the htmlwidget JSON; JS reads it at `renderValue`.

| Field | Type | Source | Purpose |
|---|---|---|---|
| `x.config.specVersion` | int (2) | R constant | payload schema version |
| `x.config.engine` | string | resolved in R | `"server"` or `"wasm"`; never `"auto"` |
| `x.config.duckdb_wasm.cache_url` | string or null | R, via `htmlwidgets` asset path | WASM binary URL for `wasm` engine |
| `x.config.duckdb_wasm.worker_url` | string or null | R | Worker JS URL |
| `x.config.crosstalk_threshold` | int (default 100000) | `getOption("myIO.crosstalk_threshold")` | row-count cutoff |
| `x.config.webgl_threshold` | int or `"Inf"` (default 50000) | `myIO(webgl_threshold=)` | row-count cutoff for activating the WebGL bridge; `"Inf"` disables WebGL |
| `x.config.unify_data_path` | bool (default `false`) | `myIO(unify_data_path=)` | opt-in switch allowing coordinator batches to replace SVG layer data below `webgl_threshold`; default preserves the inline SVG path |
| `x.bigdata.mode` | string | set by `setBigData` | `"none"` \| `"inline_ipc"` \| `"url"` \| `"shiny_handle"` \| `"dbi"` |
| `x.bigdata.source_id` | string | R-generated uuid | identifies source in coordinator registry |
| `x.bigdata.ipc_b64` | string or null | R, base64 of Arrow IPC | present when `mode == "inline_ipc"` |
| `x.bigdata.url` | string or null | R | present when `mode == "url"` |
| `x.bigdata.schema` | object | R | column names + Arrow types; required for file path and URL sources in v1 |
| `x.bigdata.row_count` | int | R | total input rows |
| `x.bigdata.rowkey_col` | string | R, from `setBigData(rowkey_col=)` or auto-assigned | column used for crosstalk row-identity |
| `x.config.coordinator_enabled` | bool | R, `TRUE` iff `bigdata.mode != "none"` | gates JS coordinator instantiation per backward-compat invariant |
| `x.coordinator.chart_id` | string | R-generated uuid | stable per widget for registration |
| `x.coordinator.mark_spec` | object | derived from chart type | channel→column mapping + decimation policy |
| `x.coordinator.query_template` | string | derived by `setBigData` for point/line/area | base SELECT with `{{where}}` and `{{limit}}` placeholders |

File path and URL sources do not have a server-side probe in v1. `setBigData()` therefore requires `schema =` for those sources and errors before payload generation when schema is missing. Optional `row_count =` may be supplied for URL/file sources so the JS threshold gate can decide whether to install WebGL.

## Shiny transport (corrected per Codex review)

Shiny's two directions are asymmetric. The browser → R direction uses `Shiny.setInputValue()` with an R-side `shiny::registerInputHandler()`. The R → browser direction uses `session$sendCustomMessage()` with a JS-side `Shiny.addCustomMessageHandler()`. Sending `Shiny.sendCustomMessage()` from the browser is **not** a Shiny API and must not appear in this skill's implementation.

All messages are JSON. Version field on every message.

### Browser → R (via `Shiny.setInputValue` with a custom input handler)

| Input name | Handler registered via | Shape | Purpose |
|---|---|---|---|
| `myio_query` (input) | `shiny::registerInputHandler("myio.query", fn, force = TRUE)` | `{v:1, queryId, templateId, sourceId, predicateHash, bindings, limit}` | dispatch templated query |
| `myio_cancel` (input) | `shiny::registerInputHandler("myio.cancel", fn, force = TRUE)` | `{v:1, queryId}` | cancel in-flight query |
| `myio_ack` (input) | `shiny::registerInputHandler("myio.ack", fn, force = TRUE)` | `{v:1, queryId, seq}` | backpressure ack |

JS call shape: `Shiny.setInputValue("myio_query", {...}, {priority: "event"})`. `priority: "event"` is required or Shiny dedupes identical successive values and the second brush-to-same-selection never fires.

### R → browser (via `session$sendCustomMessage`)

| Message type | JS handler | Shape | Purpose |
|---|---|---|---|
| `myio:batch` | `Shiny.addCustomMessageHandler("myio:batch", fn)` | `{v:1, type, queryId, seq, ipc}` (ipc = base64 Arrow) | result batch |
| `myio:end` | `Shiny.addCustomMessageHandler("myio:end", fn)` | `{v:1, type, queryId, rowCount, elapsedMs}` | stream complete |
| `myio:error` | `Shiny.addCustomMessageHandler("myio:error", fn)` | `{v:1, type, queryId, code, message}` (code ∈ `cancelled \| syntax \| oom \| engine-gone \| timeout \| forbidden`) | error |

Backpressure window: 4 in-flight batches (configurable via `getOption("myIO.shiny_batch_window", 4L)`).

## SQL safety contract

Queries arriving on `myio_query` are **never** executed as arbitrary SQL. The R-side dispatcher MUST apply the following validation pipeline before any query reaches DuckDB:

1. **`templateId` whitelist.** The message carries a `templateId` (not raw SQL). Template set is enumerated per chart type at widget render time and stored on `session$userData$myIO_templates[[chartId]]`. Reject any templateId not in the chart's registered set → `myio:error` with `code: "forbidden"`.
2. **`sourceId` whitelist.** Must exist in `session$userData$myIO_sources` for this session. Reject otherwise.
3. **Column identifiers whitelist.** `bindings` slots that fill identifier positions (column names in WHERE / GROUP BY / SELECT) must match a column name from the source's registered schema. Rejected identifiers → `"forbidden"`.
4. **Identifier quoting.** All validated identifiers are wrapped in DuckDB's `"` quoting before interpolation.
5. **Value parameterization.** Value slots use `DBI::dbBind()` parameters (`?` placeholders), never string interpolation. Date/timestamp/numeric coercion happens inside R based on declared column type.
6. **Hard limits.** Query gets `LIMIT getOption("myIO.max_result_rows", 500000L)` appended; `SET statement_timeout TO getOption("myIO.query_timeout_ms", 10000L)` applied per connection. Exceeding either → `"oom"` or `"timeout"`.
7. **Raw SQL is never accepted.** No `sql` field on inbound messages — replaced by `templateId + bindings`.

Whitelist source: the widget's `markSpec.decimation` + chart-type module publishes a fixed list of template SQL strings at module load. Users cannot extend this from R/JS at runtime.

## Per-session source registry lifecycle

Big-data sources that cannot serialize across widget-JSON (DBI connections, server-held Arrow tables, streaming readers) live in per-session R state. Lifecycle:

| Event | R action |
|---|---|
| `renderMyIO()` on a widget with `bigdata.mode ∈ {"dbi", "shiny_handle"}` | construct `source` in R; store as `session$userData$myIO_sources[[sourceId]] <- list(mode, ref, schema, row_count, owner_chart_id)` |
| `renderMyIO()` on a widget with `bigdata.mode == "inline_ipc"` | serialize IPC into payload; no per-session registry entry needed |
| Shiny input `myio_query` for `sourceId` | R dispatcher reads from `session$userData$myIO_sources[[sourceId]]`; rejects if absent |
| Widget re-render in same session | old `sourceId` removed; new one registered; previously-owned DBI connection `DBI::dbDisconnect`'d if `owner_chart_id` no longer present on the page |
| `session$onSessionEnded()` | iterate registry, disconnect any DBI connections owned by the session; delete temp tables on shared `duckdb::duckdb()` connections |

Isolation invariant: two concurrent Shiny sessions each hold their own `session$userData$myIO_sources`. A query carrying `sourceId = X` in session A cannot resolve to a source registered in session B.

Tests must cover: two parallel sessions with different sources; re-render replacing a source; session-end cleanup of DBI connections.

## Row-key contract for big-data sources

`crosstalk::SharedData` row-key broadcasting only works when row keys can be materialized and transported. For the big-data tier:

- Every big-data source MUST declare a `rowkey_col` (a column whose values are unique per row). If the user passes a `data.frame` without an explicit `rowkey_col`, myIO assigns `seq_len(nrow(df))` coerced to character.
- `setBigData(source, rowkey_col = "id")` is the public API for declaring a user-chosen column.
- Validation at registration time: `rowkey_col` exists in schema; column type is text / integer / UUID; no NA values (error if present); uniqueness verified on the first `nrow < 10000` sample, warning issued for larger samples with a pointer to the documented contract.
- `factor` columns → coerced to `as.character()` with factor-level attribute stored (for inverse lookup).
- Date / timestamp columns → ISO 8601 strings with timezone preserved; round-trip tested.
- Non-syntactic column names → escaped identifiers everywhere (SQL + JS predicate). Tests for `"my column"`, `"1col"`, Unicode.

When the crosstalk adapter broadcasts, it emits row-key strings from `rowkey_col`. When it receives row-keys from a sibling widget, it builds `WHERE "rowkey_col" IN (?, ?, ...)` with parameterized bindings (not string interpolation).

## Multi-widget lifecycle

The coordinator is per-page but engine selection is per-source. `window.myIO.coordinator` is lazily instantiated on first widget mount; it holds a map `sourceId → engineAdapter`. Two widgets with the same `sourceId` share an adapter; two widgets with different `sourceId`s each get their own. Lifecycle:

| Event | Coordinator action |
|---|---|
| First widget mount (any engine) | instantiate `Coordinator`; register source-to-adapter binding |
| Subsequent widget mount, same source | reuse existing adapter; register chart with coordinator |
| Subsequent widget mount, new source | instantiate the appropriate adapter, add to the source → adapter map |
| Widget re-render (htmlwidgets `renderValue` called twice for same element) | call `coordinator.unregister(oldChartId)` before new registration; evict that chart's cache entries |
| Widget element removed from DOM (observable via `MutationObserver` or htmlwidgets resize/destroy hook) | `coordinator.unregister(chartId)`; if this was the last chart on a source, close the adapter |
| Last widget unmounts | close all adapters; delete `window.myIO.coordinator` |

Tests: two widgets same source (share adapter); two widgets different sources (independent); re-render; removal/cleanup.

`Coordinator.ensureAdapterFor(sourceId, ...)` must cache the in-flight initialization promise so parallel callers receive the same adapter instance. `Coordinator.unregister(chartId)` must abort that chart's in-flight query controller before removing the registration; stale batches from the aborted query must not paint into a newer renderer.

## Bundle size budget (JS)

`inst/htmlwidgets/myIO/myIOapi.js` has a size budget enforced in CI:

| Baseline | Current target | Hard ceiling |
|---|---|---|
| Pre-feature size | measured at Phase 0 start | — |
| Post-feature size | pre-feature + 600 KB gz | pre-feature + 1 MB gz |

If the hard ceiling is exceeded, the build must fail. Candidate levers to stay within budget:
- Lazy-load `regl-scatterplot` and `regl` only when a WebGL-tier chart actually renders (dynamic `import()` inside the renderer module).
- Tree-shake `apache-arrow` — import from `apache-arrow/Arrow.dom` only the symbols used (`Table`, `tableFromIPC`, `RecordBatch`), not the default export.
- Drop `alasql` from production bundle. `MemoryEngine` is test-only; move it into `tests/js/engines/memory.js` imported only by test setup.
- Keep `d3-force` only inside the worker bundle, not the main bundle.

CRAN tarball ceiling is separate: `R CMD build . && ls -lh myIO_*.tar.gz` must stay under the project's current size + 200 KB. Enforced at Phase 5 exit.

## JS engine adapter interface

Every adapter (`WasmEngineAdapter`, `ShinyEngineAdapter`, `MemoryEngine`, `SvgNullAdapter`) implements:

| Method | Shape | Purpose |
|---|---|---|
| `init({sourceRegistry})` | returns `Promise<void>` | bind to sources |
| `query({sql, params, queryId, signal})` | returns `AsyncIterable<ArrowBatch>` plus trailer `{queryId, rowCount, elapsedMs}` | execute query |
| `applyPredicateCache(hash, predicateSQL)` | optional; returns `Promise<void>` | engine-local predicate cache |
| `cancel(queryId)` | returns `Promise<void>` | cancel in-flight |
| `close()` | returns `Promise<void>` | teardown |

Error shape: `{queryId, code, message, sqlState?}` where `code` is one of `cancelled`, `syntax`, `oom`, `engine-gone`, `timeout`.

## Chart registration payload (chart → Coordinator)

| Field | Type | Purpose |
|---|---|---|
| `chartId` | string | from `x.coordinator.chart_id` |
| `queryTemplate` | string (SQL with `$where`, `$bin`, `$limit` placeholders) | parameterized query |
| `markSpec` | object | `{kind, channels, decimation}` |
| `sourceHandle` | `{engine, sourceId}` | which engine + which source |
| `predicateFn` | function `(selection) => predicateSQL` | local selection → SQL |
| `onResult` | function `({batches, trailer, markSpec}) => void` | coordinator result hook used by WebGL bridge and SVG fast-path |

## Selection update (chart → Coordinator)

| Field | Type | Purpose |
|---|---|---|
| `chartId` | string | origin |
| `predicate` | string (SQL WHERE fragment) or `null` (clear) | current selection predicate |

## Mark-spec enum

| Kind | Chart types | Decimation default |
|---|---|---|
| `scatter` | scatter, beeswarm | `none` (WebGL) or `hexbin` (SVG) |
| `line` | line, sparkline | `lttb` |
| `area` | area | `lttb` |
| `bin` | heatmap, calendar heatmap | `native_groupby` |
| `bin1d` | histogram, density | `native_groupby` |
| `bar` | bar, stacked-bar | `native_groupby` |
| `box` | boxplot | `native_groupby` (5 stats) |
| `category` | waffle, pie, donut, lollipop, dumbbell | `native_groupby` |

## Error condition classes (R-side)

| Condition class | When raised |
|---|---|
| `myIOError_duckdb_wasm_missing` | WASM engine needs binary, cache is empty |
| `myIOError_duckdb_wasm_checksum` | cache exists but sha256 mismatch against manifest |
| `myIOError_bigdata_payload_size` | inline IPC > 200MB hard error |
| `myIOError_engine_unsupported_source` | source type not supported by resolved engine |

## Suggested packages

| Package | Gated code path |
|---|---|
| `arrow` | `setBigData` with in-memory `data.frame` or `arrow::Table` |
| `duckdb` | `engine = "server"` resolved |
| `DBI` | `engine = "server"` with user `DBI` connection |
| `base64enc` | `setBigData` inline IPC mode |
| `cli` | `install_duckdb_wasm` progress |
| `curl` | `install_duckdb_wasm` download |

Every gated path opens with `if (!requireNamespace("<pkg>", quietly = TRUE)) stop(...)`.

## Frontend file layout

Project uses esbuild with sources under `inst/htmlwidgets/myIO/src/` — new files go there (not `srcjs/`).

| Path | Purpose |
|---|---|
| `inst/htmlwidgets/myIO/src/coordinator/index.js` | `Coordinator` class |
| `inst/htmlwidgets/myIO/src/coordinator/query-cache.js` | LRU cache |
| `inst/htmlwidgets/myIO/src/coordinator/source-registry.js` | source handle registry |
| `inst/htmlwidgets/myIO/src/coordinator/webgl-bridge.js` | result normalization, WebGL overlay bridge, SVG fast-path |
| `inst/htmlwidgets/myIO/src/engines/index.js` | factory |
| `inst/htmlwidgets/myIO/src/engines/wasm.js` | `WasmEngineAdapter` |
| `inst/htmlwidgets/myIO/src/engines/shiny.js` | `ShinyEngineAdapter` |
| `inst/htmlwidgets/myIO/src/engines/memory.js` | `MemoryEngine` (test double) |
| `inst/htmlwidgets/myIO/src/engines/svg-null.js` | `SvgNullAdapter` |
| `inst/htmlwidgets/myIO/src/decimate/lttb.js` | LTTB SQL template + JS fallback |
| `inst/htmlwidgets/myIO/src/decimate/hexbin.js` | hexbin SQL template |
| `inst/htmlwidgets/myIO/src/crosstalk-adapter/index.js` | crosstalk bridge |
| `inst/htmlwidgets/myIO/src/renderers/webgl/scatter.js` | `regl-scatterplot` wrap |
| `inst/htmlwidgets/myIO/src/renderers/webgl/line.js` | custom regl LINE_STRIP |
| `inst/htmlwidgets/myIO/src/renderers/webgl/area.js` | custom regl TRIANGLE_STRIP |
| `inst/htmlwidgets/myIO/src/renderers/webgl/beeswarm-layout.worker.js` | d3-force Web Worker |
| `inst/htmlwidgets/myIO.js` | existing entry point; new init hook |
| `inst/htmlwidgets/myIO/workers/beeswarm-layout.js` | worker bundle output |

Existing chart-type JS files are modified in-place only to add coordinator registration; their render logic is otherwise untouched.

## R-side file layout (new files)

| Path | Purpose |
|---|---|
| `R/install_duckdb_wasm.R` | install helper + status + clear |
| `R/setBigData.R` | big-data source attachment |
| `R/engine.R` | `resolve_engine`, auto-detect |
| `R/shiny_dispatch.R` | `.onLoad` Shiny custom-message handlers |
| `R/arrow_ipc.R` | IPC encode helper (behind `requireNamespace`) |
| `R/myIO-package.R` | existing; add `.onLoad` call to register Shiny handlers |
| `R/myIO.R` | existing; add `engine` argument |
| `R/setLinked.R` | existing; read `myIO.crosstalk_threshold` option into payload |
| `inst/duckdb-wasm-manifest.csv` | version, url, sha256, size_bytes |
| `vignettes/large-data-linking.Rmd` | crosstalk threshold + file-protocol docs |

## Naming rules

- R function names: `snake_case` for all-lowercase multiword, `camelCase` for user-facing widget helpers to match existing `setLinked`/`setFacet`/`setData` style.
- JS class names: `PascalCase`.
- JS file names: `kebab-case.js`.
- Widget payload fields: `snake_case` for R-authored, `camelCase` nested inside the JS coordinator.
- Message envelope fields: `camelCase` (JS convention; R-side serializers honor this).
- Option names: `myIO.<topic>` dot-namespaced.

## Backward-compatibility invariants

- `x.config.specVersion` bumps from 1 to 2. JS reader must accept both 1 and 2; v1 payloads skip coordinator init entirely.
- Any chart constructed without `engine` argument and without `setBigData()` must exercise zero new code paths — same JSON payload shape as v1, same SVG render, no new Suggested packages loaded.
- `setLinked()` signature unchanged. New threshold-option flow through the payload is additive.

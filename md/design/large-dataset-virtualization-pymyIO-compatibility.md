# pymyIO compatibility note — large-dataset virtualization

Date: 2026-04-23
Anchors: [md/todo/large-dataset-virtualization.md](../todo/large-dataset-virtualization.md) Phase 5 T5.3.

## Purpose

myIO and [pymyIO](https://github.com/mortonanalytics/pymyIO) share the htmlwidget JavaScript engine under `inst/htmlwidgets/myIO/` via a vendored copy (or submodule pin, depending on pymyIO's current setup). This feature materially changes those shared JS files. Python consumers need a clear picture of what happens to their charts during the rollout — specifically, that their current charts keep working unchanged until pymyIO chooses to bump.

## What changes in the shared JS surface

Per the feature's [contract §"Frontend file layout"](large-dataset-virtualization-contract.md), this PR adds the following files under `inst/htmlwidgets/myIO/src/`:

| Area | New files |
|---|---|
| Coordinator | `coordinator/index.js`, `coordinator/query-cache.js`, `coordinator/source-registry.js` |
| Engine adapters | `engines/index.js`, `engines/wasm.js`, `engines/shiny.js`, `engines/memory.js`, `engines/svg-null.js` |
| Decimation | `decimate/lttb.js`, `decimate/hexbin.js` |
| Crosstalk bridge | `crosstalk-adapter/index.js` |
| WebGL coordinator bridge | `coordinator/webgl-bridge.js` |
| WebGL renderers | `renderers/webgl/scatter.js`, `renderers/webgl/line.js`, `renderers/webgl/area.js`, `renderers/webgl/beeswarm-layout.worker.js` |

And modifies one existing file:
- `inst/htmlwidgets/myIO.js` — the widget entry point gets a post-mount coordinator boot gated on a new `x.config.coordinator_enabled` payload field plus a `file://` protocol override.

All additions are under `src/`; the built bundle at `inst/htmlwidgets/myIO/myIOapi.js` grows accordingly (contract-budgeted at baseline + 1 MB gzipped hard ceiling).

## Backward compatibility invariant for pymyIO

The [contract's backward-compat rule](large-dataset-virtualization-contract.md) specifies that any widget constructed *without* attaching a big-data source exercises **zero new code paths**:

- The `x.config.coordinator_enabled` flag defaults to `false` on every payload.
- The JS entry point only instantiates the coordinator (and only loads the new engine adapters) when that flag is `true`.
- Without big-data attachment, the widget payload shape is identical to today modulo a `specVersion: 2` bump and the new flags set to defaults.

Net effect for pymyIO: Python-constructed widgets that do not call into a (nonexistent) `set_big_data()` equivalent render exactly as they do today — SVG, D3, no new dependencies loaded in the browser. There is no regression risk from a submodule bump alone, provided pymyIO's Python surface does not start claiming `engine=` support before its R-side counterpart.

## What pymyIO consumers lose without a bump

Until pymyIO surfaces equivalent Python APIs, Python users cannot access:

- The `engine` argument (auto / server / wasm / svg dispatch).
- `setBigData()` for attaching parquet/arrow/DBI sources.
- The DuckDB-WASM engine.
- The WebGL renderer for scatter/line/area/beeswarm.
- The crosstalk predicate bridge (above the small-data threshold, which defaults to 100k rows).
- The WebGL bridge threshold and coordinator query-template payload used to paint coordinator results.

pymyIO charts remain fully functional at their current scale ceiling (SVG-grade, ~5k–20k DOM nodes). The shared JS bundle will contain the new engine code but it stays dormant because pymyIO's widget payload does not set `coordinator_enabled`.

## Required pymyIO follow-up

A tracking task must land in pymyIO to:

1. Bump the myIO submodule / vendored copy to include these JS changes.
2. Add Python equivalents for the `engine` argument on `MyIO(...)` constructors.
3. Add a Python equivalent of `setBigData()` — ideally named `set_big_data()` in snake_case to match Python conventions.
4. Pass through the new payload fields (`coordinator_enabled`, `bigdata.*`, `coordinator.chart_id`, `coordinator.query_template`, `coordinator.mark_spec`, `config.engine`, `config.duckdb_wasm`, `config.crosstalk_threshold`, `config.webgl_threshold`, `config.unify_data_path`).
5. Validate Python widget rendering in the RStudio Python interpreter, Jupyter, Posit Connect Python Shiny, and a headless Quarto render.
6. Decide on a Python install-helper analog to `myIO::install_duckdb_wasm()` — likely `pymyio.install_duckdb_wasm()` using `platformdirs.user_cache_dir()`.

This work is **out of scope** for the R-package PR. A pymyIO GitHub issue should be opened the moment this plan's Phase 0.5 lands so the coordination signal is recorded before feature code starts flowing.

## T5.3 follow-up — status

**2026-04-23, Phase 5 closeout:** The full R-side implementation is merged on `develop` (Phase 0 through Phase 4). A pymyIO tracking issue needs to be opened at `mortonanalytics/pymyIO` with the title "Bump myIO submodule + add large-dataset virtualization Python API." The issue body should reference:

- This R-side design doc and plan paths (local to the R checkout; paste the relevant sections)
- The six tasks enumerated above
- The `feature_ready_at_commit:` field populated with the Phase 4 merge SHA from the current develop tip
- Label: `engine-bump-pending` (matches the engine-bump-notify workflow's expected label)

The `.github/workflows/engine-bump-notify.yaml` workflow in this repo automatically opens such an issue on release cuts, so if this feature ships via `/release`, that workflow should fire and close the hand-off loop. Until release, the note here serves as the written record.

## WebGL bridge additive payload — 2026-05-05

The WebGL bridge wiring adds two pymyIO-visible payload fields while keeping Python charts dormant until pymyIO implements a `set_big_data()` equivalent:

- `[engine-additive]` `x.config.webgl_threshold`: positive integer row-count cutoff, with `"Inf"` disabling WebGL after JSON serialization.
- `[engine-additive]` `x.config.unify_data_path`: opt-in boolean for routing below-threshold coordinator results into the SVG render path; default `false` preserves existing inline SVG behavior.
- `[engine-additive]` `x.coordinator.query_template`: per-chart base SELECT for point/line/area big-data charts, consumed by the shared JS coordinator.
- `[engine-additive]` `x.coordinator.mark_spec.channels.color`: optional scatter color/group channel included in the query template as `color`; the bridge maps observed values to palette category indices.

pymyIO's next engine bump should expose these fields only when Python big-data support is added. Existing `specVersion: 1` Python widgets continue through the SVG path. Python URL/parquet sources should mirror the R v1 rule and require explicit schema metadata before generating query templates.

## Rollout order

- Ship this R-side feature first; pymyIO's submodule pin stays at the pre-feature bundle; Python charts remain SVG-only and identical to today.
- Open a pymyIO tracking issue at Phase 0.5 merge (before any feature code).
- Coordinate the submodule bump + Python API additions as a separate pymyIO release. That release is the moment Python users gain access to the new engines.

## Cross-links

- R-side plan: [md/todo/large-dataset-virtualization.md](../todo/large-dataset-virtualization.md)
- R-side design: [md/design/large-dataset-virtualization.md](large-dataset-virtualization.md)
- R-side contract: [md/design/large-dataset-virtualization-contract.md](large-dataset-virtualization-contract.md)
- pymyIO repo: mortonanalytics/pymyIO (private to Morton Analytics org at time of writing)

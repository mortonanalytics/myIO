## Submission

This is a new submission of myIO 1.2.0. It supersedes an earlier 1.2.0-track
submission (1.1.0) that we have withdrawn; no version of myIO is currently on
CRAN, so this is treated as a new submission.

## R CMD check results

0 errors | 0 warnings | 1 note

The only NOTE is "New submission".

## Test environments

* GitHub Actions: macOS-latest (release), windows-latest (release),
  ubuntu-latest (devel, release, oldrel-1) — all `R CMD check --as-cran`
  Status: OK.
* local macOS (aarch64-apple-darwin20), R 4.5.0.

## Notes

* This is a new submission to CRAN.
* The package bundles the following minified JavaScript and CSS libraries in
  `inst/htmlwidgets/lib/` as required by the htmlwidgets framework:
  - d3.js v7.9.0 (ISC license, ~273 KB)
  - d3-hexbin v0.2.2 (BSD-3-Clause, ~2 KB)
  - d3-sankey v0.12.3 (BSD-3-Clause, ~6 KB)
  - W3.CSS v4.13 (MIT license, ~23 KB)
  See `inst/COPYRIGHTS` for full attribution.
* myIO differs from existing interactive visualization packages (plotly,
  echarts4r, highcharter) by computing statistical transforms (confidence
  intervals, regression fits, pairwise significance tests, and uncertainty
  visualizations) in R and rendering them as composable D3.js layers, with
  bidirectional I/O (brush selection, click-to-annotate, Crosstalk linked
  brushing, parameter sliders). See `vignette("why-myio")` for details.
* This release also ships a machine-readable chart specification schema
  (`inst/myio-schema.json`) and validator functions so that large language
  model agents can author and verify chart specifications. See
  `vignette("llm-tool-calling")`.

## Optional DuckDB-WASM runtime (large-dataset engine)

myIO provides an optional in-browser big-data engine via the
`install_duckdb_wasm()` helper. The DuckDB-WASM binary (~22 MB) is **not
bundled** in the CRAN tarball; users opt in by calling `install_duckdb_wasm()`
which downloads and sha256-verifies the binary into
`tools::R_user_dir("myIO", "cache")`. This mirrors the pattern used by
`keras3`, `torch`, and `reticulate` for optional runtime components.

All dependencies the feature introduces (`arrow`, `duckdb`, `DBI`,
`base64enc`, `cli`, `curl`, `openssl`) are in Suggests, and every code path
that touches them is guarded by `requireNamespace()` with a clear
`install.packages(...)` pointer on the error path.

The pre-existing small-data rendering path exercises zero new code; the
feature is gated by an explicit `setBigData()` call on the widget object.

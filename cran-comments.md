## Resubmission

This is a resubmission addressing the review by Beni Altmann (2026-06-05):

- Added `\value` documentation. Non-exported `composite_*` and `transform_*`
  helpers are now `@noRd` (they are internal and were never intended as user
  API); the one exported function that lacked it, `stop_duckdb_wasm_missing`,
  now documents its `@return`.
- Replaced `\dontrun{}` with `\donttest{}` where the example is genuinely
  executable (`setBigData`), and made that example self-contained.
- Two examples retain `\dontrun{}` by design and are noted here:
  - `install_duckdb_wasm()` downloads ~22 MB from a network mirror, which is
    not permitted in executed examples.
  - `setSlider()` only runs inside a live Shiny server (reactive `output`
    context) and cannot execute standalone.

## Submission

This is a new submission. No version of myIO is currently on CRAN.

## R CMD check results

0 errors | 0 warnings | 1 note

NOTE: "New submission" — this package is new to CRAN.

The package installs to 5.1Mb. The `htmlwidgets/` subdirectory (3.4Mb) holds the
bundled, minified JavaScript libraries the widgets require at runtime:

- d3.js (Mike Bostock, BSD-3-Clause): core rendering
- d3-hexbin, d3-sankey (Mike Bostock, BSD-3-Clause): chart layouts
- jsPDF (James Hall, yWorks GmbH; MIT): PDF export

These libraries are essential and cannot be reduced without removing
functionality. Their copyright holders are listed in Authors@R with role 'cph';
full attribution is in inst/COPYRIGHTS.

## Test environments

- local: macOS 26.5 (R 4.5.0), R CMD check --as-cran
- GitHub Actions: ubuntu-latest (devel, release, oldrel-1), windows-latest
  (release), macos-latest (release) — all R CMD check --as-cran: OK

## Notes for the reviewer

myIO differs from existing interactive-visualization packages (plotly,
echarts4r, highcharter) by computing statistical transforms (confidence
intervals, regression fits, pairwise significance tests, uncertainty
visualizations) in R and rendering them as composable D3.js layers. It also
ships a machine-readable chart specification schema and validators so that
large language model agents can author and verify charts.

An optional in-browser DuckDB-WASM engine (~22Mb) is **not** bundled; users opt
in via install_duckdb_wasm(), which downloads and sha256-verifies the binary
into tools::R_user_dir("myIO", "cache"). All dependencies it introduces are in
Suggests and guarded by requireNamespace().

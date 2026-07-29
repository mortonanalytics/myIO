## Update

This is an update from myIO 1.2.0, the version currently on CRAN. Version 1.3.0
adds backward-compatible keyframe storytelling APIs, verifies the package's
WebR 0.6.0 path end to end, and updates documentation and safe dependencies.

## R CMD check results

0 errors | 0 warnings | 1 note

The documented NOTE is produced only by the local macOS check because the
installed HTML Tidy is older than the version recommended by R. The GitHub
Actions checks on current R release, devel, and oldrel-1 do not report it.

The package installs to 4.1 MB. The `htmlwidgets/` subdirectory (2.4 MB) holds the
bundled, minified JavaScript libraries the widgets require at runtime:

- d3.js (Mike Bostock, BSD-3-Clause): core rendering
- d3-hexbin, d3-sankey (Mike Bostock, BSD-3-Clause): chart layouts
- jsPDF (James Hall, yWorks GmbH; MIT): PDF export

These libraries are essential and cannot be reduced without removing
functionality. Their copyright holders are listed in Authors@R with role 'cph';
full attribution is in inst/COPYRIGHTS.

## Test environments

- local: macOS 26.5.2 (R 4.5.0), R CMD check --as-cran
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

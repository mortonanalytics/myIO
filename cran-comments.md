## Update

This is an update from myIO 1.2.0, the version currently on CRAN. Version 1.3.0
adds backward-compatible keyframe storytelling and legend-title APIs, verifies
the package's WebR 0.6.0 path end to end, updates documentation and safe
dependencies, and fixes a large batch of rendering and correctness defects
found in a full audit of the chart gallery.

Three of those fixes change behaviour that previously errored or produced
incorrect output, and are noted here so the change in NEWS.md is not mistaken
for a silent API break:

- `whiskerType = "minmax"` no longer errors on boxplots.
- Waterfall total rows render their computed value instead of `NA`.
- Legend entries for grouped layers show the group value alone rather than the
  layer label concatenated with it; `setLegendTitle()` names the grouping
  variable when that context is wanted.

Each replaces broken behaviour. Charts that rendered correctly under 1.2.0
render identically under 1.3.0.

## R CMD check results

0 errors | 0 warnings | 1 note

The documented NOTE is produced only by the local macOS check because the
installed HTML Tidy is older than the version recommended by R. The GitHub
Actions checks on current R release, devel, and oldrel-1 do not report it.

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

The package installs to 4.1 MB. The `htmlwidgets/` subdirectory (2.4 MB) holds the
bundled, minified JavaScript libraries the widgets require at runtime:

- d3.js 7.9.0 (Mike Bostock, ISC): core rendering
- d3-hexbin 0.2.2, d3-sankey 0.12.3 (Mike Bostock, BSD-3-Clause): chart layouts
- jsPDF 2.5.2 (James Hall, yWorks GmbH; MIT): PDF export

These libraries are essential and cannot be reduced without removing
functionality. Their copyright holders are listed in Authors@R with role 'cph';
full attribution is in inst/COPYRIGHTS.

An optional in-browser DuckDB-WASM engine (~22Mb) is **not** bundled; users opt
in via install_duckdb_wasm(), which downloads and sha256-verifies the binary
into tools::R_user_dir("myIO", "cache"). All dependencies it introduces are in
Suggests and guarded by requireNamespace().

## Update

This is an update from myIO 1.3.0, the version currently on CRAN. Version 1.4.0
adds two backward-compatible features — linked-cursor rendering on the y and xy
axes, and polynomial confidence bands — and fixes a batch of correctness and
rendering defects found in a full audit of the package's R transforms, chart
renderers, and documentation.

Four of those fixes change output for charts that render today. None changes a
function signature, a default argument, or an exported name, so none is an API
break; they are listed here so the corresponding NEWS.md entries are not mistaken
for one:

- Prediction intervals widen. `transform_ci(interval = "prediction")` was read
  but computed from the standard error of the fit alone, so every prediction
  band was drawn at confidence-interval width. Prediction bands now include the
  residual scale and are correspondingly wider.
- Bump charts draw rank 1 at the top with whole-number axis ticks, instead of
  rank 1 at the bottom with half-rank ticks. This reorients every existing bump
  chart, and matches the convention for rank charts.
- Grouped transforms no longer emit all-`NA` rows when a grouping variable
  contains `NA`. Those rows were an artifact of matching groups with `==`, which
  returns `NA` rather than `FALSE`. A genuinely missing group is now labeled.
- `setTransition(easing = )` reaches every chart type. It was documented as
  universal but applied by only about half the renderers, so it silently did
  nothing on eleven of them. Charts that never called `setTransition()` animate
  exactly as before.

`myio_validate_spec()` also rejects mappings that are non-character, empty, `NA`,
or whitespace only. It previously accepted them and failed later inside the
rendering engine, so a specification that newly fails validation is one that
could not have rendered under 1.3.0 either.

Each of these replaces broken or incorrect behavior. Charts that rendered
correctly under 1.3.0 render identically under 1.4.0, apart from the bump-chart
reorientation noted above.

## R CMD check results

0 errors | 0 warnings | 1 note

The documented NOTE is produced only by the local macOS check because the
installed HTML Tidy is older than the version recommended by R; the PDF manual
builds cleanly. The GitHub Actions checks on current R release, devel, and
oldrel-1 do not report it.

## Test environments

- local: macOS 26.6.2 (R 4.5.0), R CMD check --as-cran
- GitHub Actions: ubuntu-latest (devel, release, oldrel-1), windows-latest
  (release), macos-latest (release) — all R CMD check --as-cran: OK

## Notes for the reviewer

myIO differs from existing interactive-visualization packages (plotly,
echarts4r, highcharter) by computing statistical transforms (confidence
intervals, regression fits, pairwise significance tests, uncertainty
visualizations) in R and rendering them as composable D3.js layers. It also
ships a machine-readable chart specification schema and validators so that
large language model agents can author and verify charts.

The package installs to 4.2 MB. The `htmlwidgets/` subdirectory (2.5 MB) holds the
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

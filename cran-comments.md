## R CMD check results

0 errors | 0 warnings | 1 note

The only NOTE is "New submission".

## Test environments

* local macOS (aarch64-apple-darwin20), R 4.5.0
* GitHub Actions: macOS-latest (release), windows-latest (release),
  ubuntu-latest (devel, release, oldrel-1)

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
  intervals, regression fits, pairwise significance tests) in R and rendering
  them as composable D3.js layers, with bidirectional I/O (brush selection,
  click-to-annotate, Crosstalk linked brushing, parameter sliders).
  See `vignette("why-myio")` for details.

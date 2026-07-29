# myIO (development version)

## New features

* `setLegendTitle()` puts a title on the legend naming the variable its entries
  come from, so a grouped chart whose series are labelled `5 6 7 8 9` can say
  those are months. The title renders on whichever legend surface is active --
  the compact in-plot strip or the panel behind the legend button -- and on
  exported SVG, PNG and PDF. Pass a string, or `TRUE` to derive the title from
  the grouping column supplied to `addIoLayer(mapping = list(group = ...))`.
  Charts render exactly as before until the function is called.

## Bug fixes

* The legend button no longer sits on top of plotted data. Charts already
  reserved the button's corner band on narrow layouts; wide layouts now do
  the same, so a mark that lands in the top-right corner is never hidden
  underneath it. An explicit `setMargin()` still wins, and sparklines and
  non-axis charts are unaffected.

* Waterfall charts no longer log a browser console warning about null values,
  and the total bar's tooltip no longer reads `Delta: null`. A total row is
  declared by putting `NA` in the value column, and that `NA` was travelling all
  the way to the browser even though the transform had already worked out what
  the bar's height should be. The total row now carries its own magnitude -- the
  running total the bar spans -- so the chart reports a real number everywhere.
  Blast radius: the value column in exported CSV changes for waterfall charts.
  A total row's cell now holds the total instead of being blank, and a
  non-total row written as `NA` now reads `0`, which is the height that row has
  always been drawn at. Nothing about how the chart renders changes.

* Faceted charts now size each panel's left margin to fit its y tick labels.
  Panels never ran the margin fit that ordinary charts run, so a facet grid with
  a wide y format -- currency, or any large number -- drew its tick labels
  through the rotated axis title and off the left edge of the panel, where the
  same chart unfaceted laid out correctly. Blast radius: a faceted, axes-based
  chart whose y labels are wider than its left margin now gains left margin and
  loses the same amount of plot width; with `facet(scales = "fixed")` all
  panels share one domain and so shift together, and panels that call
  `setMargin()` are unchanged.

* Grouped bar charts no longer let their y tick labels run through the y-axis
  title after switching to the stacked layout. Stacking sums the series, so the
  tick labels gain digits the chart's left margin was never sized for -- a
  `"$,.0f"` format on data in the hundreds of thousands pushed the labels
  several pixels past the rotated title. The left margin is now re-measured
  after the bars are drawn, both when the layout is toggled from the chart's
  action button and on every redraw of a chart already in stacked mode. Charts
  that call `setMargin()` keep the margin they were given, and every other
  chart type is unchanged.

* Linked charts no longer disagree when a brush covers empty space. Dragging a
  brush over a region containing no points left the brushed chart with all its
  marks dimmed while every linked chart snapped back to full opacity, so the
  two showed opposite states for the same selection. An empty brush is now
  treated as what it is -- a selection of nothing -- and dims the marks on the
  linked charts too. Removing the brush entirely still restores everything
  everywhere, unchanged. Blast radius: any existing `setLinked()` or
  `linkCharts()` page will now dim its linked charts while a brush sits over
  empty space, where before they stayed bright. The `myIO-{id}-brushed` Shiny
  input gains an `active` field carrying the distinction (`TRUE` while a brush
  rectangle is on screen, `FALSE` once it is removed); existing code reading
  `keys`, `extent` or `data` is unaffected.

* `setLinked()` charts now cross-select against non-myIO widgets. A myIO chart
  in a Crosstalk group used to broadcast and match on its own internal row
  numbers rather than the keys the `SharedData` object was built with, so
  brushing it selected nothing in a linked `DT` table, `plotly` figure or
  `leaflet` map, and a selection made in any of those lit nothing in the myIO
  chart. Selections now travel on the Crosstalk keys, so all four coordinate.
  Two myIO charts linked to each other behaved consistently before and still
  do, and widgets saved by earlier versions of myIO keep working. Blast radius:
  the keys that reach the Crosstalk group change from myIO's private `row_1`,
  `row_2`, ... to the real keys, so any custom JavaScript listening on the
  group now sees the same keys every other widget uses. One limit is
  unchanged: keys are paired with rows by position, so a chart built from a
  frame that was re-sorted or re-filtered after `shared$data()` cannot be
  matched. Where the row count no longer matches, the chart now falls back to
  matching within itself rather than pairing keys with the wrong rows. See
  `?setLinked`.

* `type = "boxplot"` with `options = list(whiskerType = "minmax")` no longer
  fails with `$ operator is invalid for atomic vectors`. The documented
  `"minmax"` whisker style errored on every call; whiskers now render at each
  group's own minimum and maximum as documented. The default `"tukey"` whiskers
  are unaffected.

* The compact in-plot legend no longer runs underneath the x-axis title on
  narrow charts. Its first row shares a baseline band with the centred axis
  title, so that row now stops short of it and wraps instead; the second row
  sits below the title and keeps the full width.

* Treemap cells no longer render underneath the floating action button in the
  chart's top-right corner. The tiling now reserves the same button-width band
  that funnel and Sankey charts already reserve, so the corner cell and its
  label stay fully visible and clickable.

* `linkCharts()` now actually links charts. Brushing one chart in a
  `linkCharts()` group dims the non-matching marks on every other chart in the
  group; previously nothing happened at all, in any environment. Three things
  were wrong: the link mode written by `linkCharts()` was a value the
  browser-side code did not recognise, so neither the outgoing nor the incoming
  handler was ever connected; the cross-selection machinery required Crosstalk
  to be loaded even though `linkCharts()` is documented as not needing it, so it
  bailed out on a plain R Markdown or Quarto page; and rows were matched between
  charts by position rather than by the `on` column, which is meaningless for
  charts built from different data frames. Charts are now matched on the `on`
  column's values as documented, and coordination works with or without
  Crosstalk on the page. Charts linked with `setLinked()` are unaffected --
  they continue to use Crosstalk and to match on the shared row key. Widgets
  saved by earlier versions of myIO keep working against the new code.

* Clearing a brush -- by clicking outside it, pressing Escape, or using the
  status bar's "Clear" button -- no longer overflows the call stack. The
  overflow left the chart's stored selection in place and skipped the cleared
  event, so linked target charts stayed dimmed until the page was reloaded.

* Charts no longer pad the y axis down into negative territory for data that
  never goes negative. Y-axis padding is now 5% of the data range per side,
  matching the x axis, and the padded lower bound stops at zero when the data
  minimum is at or above zero -- a yield series bottoming out near 0 no longer
  renders a `-5` tick. Limits set explicitly with `setAxisLimits()` are
  unaffected.

* `type = "regression"` now draws the raw scatter, the fitted line and the
  confidence band in visually separable treatments. Previously all three shared
  a single hue, so the fit and its uncertainty band were hard to distinguish
  from the data. The scatter keeps the layer colour, the fit line and band take
  a second contrasting hue from the Okabe-Ito palette, and the band renders at a
  lighter fill opacity. Pass a two-element `color` vector to set both
  explicitly (`color = c("#333", "#333")` restores the previous single-hue
  look), or set `options$areaOpacity` to control the band opacity.

* Linked brushing set up with `setLinked()` now actually propagates: brushing a
  chart configured as a Crosstalk source dims the non-selected points on every
  target chart in the same group, and clearing the brush restores them. Target
  charts previously stayed inert because the inbound Crosstalk subscription was
  registered under an event name Crosstalk never emits. The `filter = TRUE`
  variant, which hides rather than dims non-selected marks, is fixed likewise.

* The demo screenshot script (`scripts/screenshot-all.js`) now enumerates the
  navbar and any nested tabsets from the live DOM instead of a hard-coded tab
  list, so it covers all 41 demo charts and no longer fails on tabs that are
  plain top-level entries rather than dropdown menus. It also records console
  errors and warnings per chart in `report.json`.

* Waffle charts now show a legend. Previously no legend appeared at all --
  neither the in-plot strip nor the bottom-sheet panel listed a single category,
  so there was no way to tell which colour meant which category. The legend now
  lists one entry per category, in data order, with swatches that match the cell
  colours.

* Bump charts now draw each series in its own colour, matching the legend
  swatches. Every series previously rendered in the same blue, making the
  legend useless and the ranking lines impossible to tell apart.

* Bump chart points and lines now line up with their x-axis ticks. On a
  categorical x axis the marks were drawn half a category width to the left of
  the tick they belonged to.

* Small multiples created with `setFacet()` now show the chart title once, above
  the grid, instead of repeating it inside every panel, and every panel draws
  its own x and y axis with identical plot geometry so the panels are readable
  and directly comparable. Previously only the first panel had a y axis, only
  the bottom row had an x axis, and the panels that lost an axis were drawn
  wider than the rest. The facet grid is also styled as a real CSS grid, so
  `ncol` and `minWidth` take effect and panels sit side by side rather than
  stacked at full width. An explicit `suppressAxis()` setting is now honoured
  inside facet panels.

* Radar charts now draw concentric grid rings with radial value labels, so the
  magnitude of each polygon vertex can actually be read. Previously the chart
  showed only the radial spokes and their category labels, leaving the plot
  without any value reference. The rings can be turned off or re-levelled per
  layer with `options = list(grid = FALSE)` and `options = list(gridLevels = 6)`.

* Bar, grouped bar and lollipop charts now start their value axis at zero by
  default, so bar lengths are proportional to the values they encode. The axis
  previously began at a buffered data minimum (a grouped bar demo spanning
  56-97 started at 50) while the bars themselves were still drawn from zero and
  clipped, so the axis and the geometry disagreed. An explicit `setAxisLimits()`
  still wins on either bound. Relatedly, a limit of exactly `0` passed to
  `setAxisLimits()` is no longer silently discarded -- it was treated as "not
  set" on every chart type, so `ylim = list(min = 0)` had no effect at all.

* Violin charts now draw the median marker inside the interquartile box. The
  median sub-layer rendered nothing at all, so the box showed the IQR span with
  no indication of where the median sat within it. It now draws the same white
  rule that boxplot charts use, matched to the box width.

* Ridgeline charts now label the y axis with the group each ridge belongs to
  instead of printing the raw stacking offsets (0.8, 1.0, 1.2, ...), and default
  the y axis title to the grouping variable. The axis previously read as a
  density scale even though the tick positions were group baselines, so the
  numbers were meaningless. An explicit `setAxisFormat(yLabel = )` still wins.

* Funnel and Sankey charts now show their numbers in the plot. Funnel stages
  print the stage value and its conversion rate against the first stage; Sankey
  nodes print their total and each flow prints its magnitude. Previously the
  only text was the stage or node name and the values were reachable only by
  hovering. Labels honour `setAxisFormat(yAxis = )`, are placed so they stay
  readable against the mark they sit on, and are suppressed rather than
  overlapped where the shape is too small. Pass `showValues = FALSE` to
  `addIoLayer()` to restore the previous names-only labelling.

* Sankey charts no longer push their terminal nodes against the right edge of
  the plot. The layout now reserves room for the right-hand node labels, so the
  last column and its labels sit inside the plot area instead of being clipped
  and drawn back on top of the flow ribbons. Node labels are also drawn in a
  high-contrast ink with a background-coloured halo, so they stay legible where
  they cross a ribbon; on a dark chart background the ink flips to white.

* Rotated y-axis titles set with `setAxisLabels(yAxis = )` are no longer shaved
  off at the left edge of the chart. The title was anchored 6px from the SVG
  border, but a `-90` degree rotation grows the glyphs leftward from that
  anchor, so the tops of every letter were clipped on every chart with a y-axis
  title. The anchor now sits far enough inside the border for the full glyph
  height to fit.

* Funnel and Sankey charts no longer draw under the floating action button in
  the corner of the widget. Both filled their whole plot rectangle, so the
  widest funnel stage and the right-hand Sankey column and its labels were
  partly hidden behind the button. Both layouts now reserve that band. Charts
  that already set `setMargin(right = 56)` or larger are unchanged.

* An open legend/actions panel now closes when its chart's tab is switched
  away from. Tab frameworks hide the pane rather than destroying the widget, so
  the panel stayed open -- it was still there on return, its button still
  reported itself expanded, and two charts could hold competing keyboard focus
  traps at once.

* Sankey flow values no longer stack on top of each other. Two links that cross
  inside the same column gap can compute the same label position, and each
  label's visibility was decided without reference to any other, so both were
  painted on the same pixel. A label that would land on one already drawn is now
  dropped, deterministically and in the links' own data order, so the same label
  wins on every re-render. The suppressed value is still on the link's tooltip
  and in the chart's data table.

* Short funnels no longer drop their values with no trace. Value placement now
  degrades in three steps instead of two: a stage band at least 34px tall keeps
  the value on a second line under the stage name, a band between 18px and 34px
  moves it onto the name's own line just outside the trapezoid, and only below
  18px is the name drawn alone with the value left to the tooltip. Previously
  anything under 34px hid every value outright, including values that would have
  fitted perfectly well beside the stage. `options = list(showValues = FALSE)`
  behaves exactly as before.

* A funnel value label placed outside its trapezoid no longer runs under the
  legend/actions button. The funnel's stages were already kept clear of the
  button, but a label that no longer fits inside a stage is placed against the
  full plot width, so on a funnel with a small top margin the first stage's
  value could be painted beneath it. Only a label whose text actually falls in
  the button's band is affected -- labels lower down the funnel still use the
  full width, so nothing that was legible before is suppressed now.

* The legend/actions button now sits in the top-right corner at every container
  width. On containers narrower than 600px it dropped to the bottom-right, where
  it covered the right-most x-axis tick label -- the bottom band there is fully
  occupied by rotated tick labels, the x-axis title and the inline legend, so
  there was no free space for it. Narrow axes charts that have not called
  `setMargin()` now reserve a 48px top margin for the button so it never lands
  on the plot. Blast radius: an axes chart in a container 600px wide or less
  that has not called `setMargin()` gains 18px of top margin (30 becomes 48) and
  loses the same amount of plot height. Charts wider than 600px, charts that
  call `setMargin()`, sparklines, and non-axes charts such as funnel, sankey and
  treemap are unchanged.

* Sparklines no longer paint a floating action button. The button covered about
  8% of a 60px inline chart and sat on top of its last data points, and it
  intercepted the pointer over that corner so those points had no tooltip.
  Sparkline mode already strips axes, legend, reference lines and interactions,
  and now strips the button too. Blast radius: the export menu (CSV, PNG, SVG,
  PDF, clipboard) is no longer reachable from a sparkline; export the same data
  from a full-size chart. The panel's legend was already suppressed in sparkline
  mode, so no legend is lost.

## User-visible changes

* Legend entries for grouped layers now show the group value on its own instead
  of concatenating the layer label with the group value -- `"Core"` rather than
  `"Rankings — Core"`. The chart title and axis labels already carry that
  context. This affects `addIoLayer(mapping = list(group = ...))`, grouped data
  frames from `dplyr::group_by()`, and the `regression`, `qq` and `survfit`
  composites. Labels set explicitly on ungrouped layers are unchanged. When a
  bare group value would collide with a layer already on the chart, the previous
  `"<label> — <group>"` form is used automatically, so multi-layer charts keep
  unique labels. Code that targets grouped layers by label -- `updateMyIOData()`,
  `addKeyframe()` -- and any CSS or test selector pinned to a grouped layer's
  generated class name must use the new labels.

* `type = "ridgeline"` now stacks its groups in a deterministic order instead of
  the order the group values happen to appear in the data. If the group column
  is a factor, its level order is used; otherwise groups sort ascending
  (character columns sort in the C locale so the result is identical on every
  machine). Ascending order reads bottom-to-top, matching a discrete y axis in
  ggplot2. **This changes the rendering of any existing ridgeline whose group
  column was not already sorted**: the ridges move, the y tick labels move with
  them, and because the `color` vector is applied by group position, the colours
  re-map too. For example, a ridgeline over `mtcars` with `cyl` as a character
  column previously stacked 6, 4, 8 from the bottom and now stacks 4, 6, 8. To
  keep a specific non-alphabetical order, make the group column a factor with
  the levels in the order you want.

* `type = "boxplot"`, `type = "violin"` and `type = "comparison"` now place
  their groups along the x axis by the same deterministic rule ridgeline
  already uses, instead of by the order the group values happen to appear in
  the data: a factor's level order wins, anything else sorts ascending, and
  character columns sort in the C locale so the result is identical on every
  machine. **This changes the rendering of any existing boxplot, violin or
  comparison chart whose group column was not already sorted** -- the boxes
  move, the x tick labels move with them, and on a violin passed a vector of
  colours the hues re-map, because `color` is applied by group position. Every
  statistic stays with its own group: each box, whisker, median and outlier is
  now looked up by group name rather than by position, and the significance
  brackets on a comparison chart are positioned by the same rule, so they keep
  spanning the pairs they are labelled with. Charts whose groups
  already appear in sorted order -- including every factor whose rows follow
  its levels -- render exactly as before. To keep a specific non-alphabetical
  order, make the group column a factor with the levels in the order you want.

* Charts left on the default left margin now widen it automatically when the y
  tick labels would run into the rotated y-axis title. Previously a currency or
  large-number y format -- `setAxisFormat(yAxis = "$,.0f")` on three-digit data,
  for example -- produced labels wide enough to overlap the title. The engine
  now measures the rendered tick labels and grows the left margin just enough to
  clear the title band; it only ever grows, never shrinks below the configured
  value, and it settles on the first render. A chart that calls `setMargin()`
  keeps exactly the margins it was given and is never adjusted. Charts whose
  labels already fit are unchanged. Note that a widget saved as HTML by an
  earlier version of myIO has no record of whether `setMargin()` was called, so
  re-rendering it against this version may widen a too-narrow left margin.

# myIO 1.3.0

## New features

* Keyframe storytelling adds `addKeyframe()` for named, transformed data
  snapshots and accessible previous/play-pause/next controls. Single-layer
  charts accept a data frame; multi-layer charts accept a named list keyed by
  layer label, with omitted layers retaining their prior state. Playback runs
  once and stops at the final frame, while reduced-motion and zero-duration
  transitions remain fully step- and play-capable. Shiny applications can use
  `setKeyframe()` and `stepKeyframe()` through the existing instance registry.
* WebR 0.6.0 compatibility is now a blocking CI contract: the package and its
  dependencies are compiled with the official r-wasm action, loaded in WebR,
  used to create and serialize a real widget, and rendered with the production
  bundle in Chromium. The verified path does not claim DuckDB-WASM support or
  universal compatibility across browser hosts.

* Legend/button UI streamlining (#84): charts now show exactly one legend
  surface at a time. When a discrete chart's compact in-plot legend is showing,
  the chart-controls panel no longer repeats the same legend and becomes
  actions-only (this supersedes the 1.2.0 note that kept the action-sheet
  legend alongside the new inline one). The in-plot legend is now interactive —
  click or keyboard (Enter/Space) toggles a series on/off, with `role="switch"`
  semantics matching the panel legend. Charts with more than 10 series, or
  containers too narrow to fit the strip legibly, move the full legend to the
  panel instead of truncating (previously the strip silently cut off at 10
  items). Inline legend rows now wrap by measured width rather than item count.
  No R API changes; `suppressLegend()` behaves exactly as before.
* Responsive chart-controls behavior now keys off the widget's own container
  width everywhere, instead of a mix of container width (panel docking) and
  browser viewport width (button position, sheet drag handle). A narrow widget
  embedded in a wide page — dashboard grids, side-by-side layouts — gets a
  coherent narrow-tier UI. The panel legend's two-column grid is now driven by
  item count on all sizes, not just narrow containers.

* New `setTransition(duration, easing, stagger)` configures chart animations:
  `duration` in milliseconds, `easing` (one of `"linear"`, `"quad"`, `"cubic"`,
  `"sin"`, `"exp"`, `"circle"`, `"back"`, `"bounce"`, `"elastic"`, mapped to the
  corresponding d3 easing), and `stagger` (per-element cascade delay in ms).
  All arguments are optional and additive; unset values keep each renderer's
  existing defaults, so the change is fully backward compatible.
  `setTransitionSpeed()` is now a thin wrapper over `setTransition(duration = )`.
  Animation stays fully opt-out-able: `duration = 0` disables it, and easing and
  stagger automatically no-op when the effective duration is 0, including under
  the viewer's `prefers-reduced-motion: reduce` system setting. A Playwright e2e
  spec verifies animate-when-on, still-when-off, and still-under-reduced-motion.
* New opt-in `"lttb"` transform for `line` layers downsamples a large series
  with Largest-Triangle-Three-Buckets, shipping at most `options$threshold`
  points (default 2000) while preserving the visual shape:
  `addIoLayer(type = "line", transform = "lttb", options = list(threshold = 1000))`.
  Off by default (`identity`); runs on the in-memory/SVG path and is independent
  of the DuckDB-WASM engine's own SQL-side LTTB, so it never double-downsamples.
* New `myIOProxy()` + `updateMyIOData()` update a rendered chart's layer data in
  place from the Shiny server without re-running `renderMyIO()`. Layers are
  matched by label and swapped through the existing data-join path, so only the
  changed marks transition and brush/zoom/toggle state is preserved (the full
  re-render destroyed and recreated the chart, flickering and dropping state):
  `myIOProxy("chart") |> updateMyIOData(series = new_df)`.

## Performance and tooling

* Release dependency intake updates the GitHub Actions, browser-test, Arrow,
  MCP, and JavaScript security transitive dependencies through PRs #91--#100.
  The MCP server now resolves `@hono/node-server` 2.0.12 and declares Node.js
  20 or newer as its runtime floor; its conformance, stdio smoke, and audit
  gates pass with zero known npm vulnerabilities.
* The production JavaScript bundle is now minified. The shipped
  `inst/htmlwidgets/myIO/myIOapi.js` drops from 2.32 MB to 1.20 MB raw
  (398,650 to 298,757 bytes gzipped, -25%) with no behavior change; the
  development `watch` build stays unminified for debugging.
* End-to-end tests now run from a committed `playwright.config.ts` and a new
  `e2e` CI workflow. The suite builds and loads the minified `myIOapi.js`,
  guarding the production bundle that source-importing unit tests cannot catch.
* Touch interaction is now verified end-to-end: a touch-emulation Playwright spec
  on iOS- and Android-class viewports confirms a `touchstart` on a bar surfaces
  the tooltip with the datum's content and `touchend` dismisses it, guarding the
  mobile hover path against the production bundle.
* The `file://` deployment e2e (self-contained widget opened directly from disk)
  is now exercised for real: its fixture loads the IIFE bundle via a classic
  `<script src>` rather than an ES module, so the file-protocol → SVG-engine
  fallback is verified under `file://` instead of skipped.

## Improved error messages and API ergonomics

* Argument names are now consistently camelCase across setters. `setBrush(onSelect)`,
  `setFacet(minWidth, labelPosition)`, `setTheme(textColor, gridColor)`, and
  `setBigData(rowkeyCol)` are the canonical forms (matching `colorScheme`, `xAxis`,
  etc.). The previous snake_case names (`on_select`, `min_width`, `label_position`,
  `text_color`, `grid_color`, `rowkey_col`) keep working as deprecated aliases that
  emit a one-line warning; existing code is unaffected aside from the warning. When
  both forms are supplied the camelCase value wins.
* `setFacet()`, `setLayerOpacity()`, and `setTheme(mode = )` now report invalid
  arguments with consistent, actionable messages (e.g.
  `setFacet(): \`scales\` must be "fixed", "free_x", "free_y", "free", not "x".`)
  instead of bare `stopifnot()` failures. `setColorScheme()` errors are likewise
  function-prefixed. No change to which inputs are accepted.
* `setTheme()` now warns when passed an unknown argument that lacks the required
  `--` prefix (e.g. a misspelled `text_colour`) and suggests the intended
  argument, instead of silently dropping it. Valid `--`-prefixed CSS overrides
  are unaffected.
* `setTheme()` documents the named `preset` values (`"midnight"`, `"ocean"`,
  `"forest"`, `"sunset"`, `"monochrome"`, `"neon"`, `"corporate"`, `"academic"`,
  `"nature"`, `"minimal"`, `"retro"`, `"warm"`, plus `"light"`/`"dark"`); the
  `preset` argument was already functional.
* `setLinked()` and `linkCharts()` now cross-reference each other in their
  documentation to clarify when to use the Crosstalk path versus the
  group-identifier path.
## Documentation

* New "Theme Gallery" article renders the same chart under all named presets
  (`midnight`, `ocean`, `forest`, `sunset`, `monochrome`, `neon`, `corporate`,
  `academic`, `nature`, `minimal`, `retro`, `warm`, plus `light`/`dark`) as
  live, side-by-side previews, and shows how to layer custom CSS overrides on
  top of a preset.
## Performance and reliability

* Inline Arrow IPC payloads now decode via the native `Uint8Array.fromBase64`
  when the browser provides it (falling back to the previous `atob` loop),
  avoiding a per-character JavaScript callback over large payloads in the
  in-memory and DuckDB-WASM engines.
* Added a regression test confirming charts that already render an inline
  legend are not given a duplicated legend on image/SVG export (GH #64).
* Layer-data serialization (`addIoLayer()`) is faster for large data: the
  row-rectangling step now extracts columns once and indexes per row instead of
  subsetting the data frame on every row, roughly 5x faster at 100k rows. The
  emitted JSON is byte-identical to before (pinned by tests across numeric,
  integer, character, logical, factor, Date, and POSIXct columns), so every
  chart type renders exactly as it did.

# myIO 1.2.0

## LLM tool-calling schema

* New machine-readable chart specification schema (`inst/myio-schema.json`)
  describing all chart types, required mappings, valid transforms, and function
  signatures, generated from the package's own contracts.
* Six exported R tools let large language model agents author and verify charts
  against that schema: `myio_list_chart_types()`, `myio_chart_schema()`,
  `myio_validate_spec()`, `myio_list_functions()`, `myio_function_signature()`,
  and `myio_validate_call()`. A Model Context Protocol server in the package's
  source repository exposes the same six tools to MCP-compatible clients.
* New vignette `llm-tool-calling` demonstrates a generate-validate-repair loop.

## Uncertainty visualizations

* New `quantile_dots` chart type and `quantile_dots` transform render a
  Wilkinson dot plot of predictive quantiles for communicating uncertainty.
* New `fan` composite renders a fan chart of nested prediction intervals around
  a central estimate.

## Gallery and chart context

* `myIO(title = ...)` and `setTitle()` add a backward-compatible chart title
  surface rendered inside the SVG. Existing charts that omit a title are
  unchanged.
* Axis titles from `setAxisFormat(xLabel = ..., yLabel = ...)` now render in
  the chart SVG, and multi-series charts get a compact visible legend while
  preserving the existing action-sheet legend.
* The gallery now carries chart titles across examples, repairs horizontal
  bars, mean-CI, heatmap margins, gauge thresholds, treemap labels, date-based
  finance examples, and shows themes across a small grid of representative
  charts.

## Crosstalk: expanded chart-type coverage

* `setLinked()` now links `waffle`, `beeswarm`, `lollipop`, and `dumbbell`
  layers in addition to the previously supported `point`, `bar`, `groupedBar`,
  `histogram`, and `hexbin`. Selection dims non-matching elements; filter
  hides them. Aggregate chart types (`boxplot`, `violin`, `qq`, `regression`,
  `density`, `ridgeline`, `survfit`, `comparison`) remain outside crosstalk
  in v1.2.
* New vignette `crosstalk-linking` demonstrates linking myIO with
  `DT::datatable()` and `reactable::reactable()`, with code listings for
  plotly and leaflet.

## bslib and Quarto Dashboards integration

* `myIO()` widgets now declare a sizing policy with `browser.fill = TRUE`
  and are tagged as `html-fill-item` via `htmltools::bindFillRole()`, so
  they fill container height inside `bslib::card()`, Quarto Dashboard
  `{.fill}` cards, and flexdashboard layouts. Rendering in plain RMarkdown
  and Shiny at the default 400px height is unchanged.
* Widget resize is now guarded against zero-dimension containers that can
  appear briefly during fill-layout transitions.

## Calendar heatmap

* New `calendarHeatmap` chart type — GitHub-contributions-style grid of daily
  cells over a single calendar year. Usage:
  `addIoLayer(type = "calendarHeatmap", data, mapping = list(date = "day", value = "x"))`.
  Supports Sunday or Monday week starts via `options$weekStart`, continuous
  color legend, and linked-cursor sync across two linked calendars. Multi-year
  data is rejected in v1.2; multi-year layouts are planned for v1.3. New CSS
  variables: `--chart-calendar-cell-gap`, `--chart-calendar-cell-stroke`,
  `--chart-calendar-empty-fill`.

## Theme gallery

* 12 named theme presets: `setTheme(preset = "midnight")`. Available presets:
  midnight, ocean, forest, sunset, monochrome, neon, corporate, academic,
  nature, minimal, retro, warm. Plus light/dark via mode parameter.

## Linked brushing

* `linkCharts(chart1, chart2, on = "column")` enables cross-chart selection.
  Brush in one chart highlights matching rows in linked charts. Works in Shiny
  and static HTML. Aggregation-to-source-row key resolution for summary views.

## Linked cursor

* `linkCharts()` and `setLinked()` gain a `cursor = TRUE` argument that draws a
  synchronized vertical crosshair on every linked chart when the user hovers
  any chart in the group. Supports point, bar, line, area, groupedBar, hexbin,
  and histogram layers (donut and treemap are excluded — no x-axis to sync on).
  Off by default; enable per-link or retrofit with `setLinkedCursor()` on a
  pre-linked widget. New `--chart-cursor-rule-color`/`-width`/`-dasharray` CSS
  variables theme the crosshair.

## Group-by auto-series

* Pass a `dplyr::group_by()` tibble to `addIoLayer()` and it auto-creates one
  layer per group with colors from the Okabe-Ito palette. Soft dplyr dependency.

## Survival curves (Kaplan-Meier)

* `addIoLayer(type = "survfit", mapping = list(time = "time", status = "status"))`
  computes Kaplan-Meier estimator with Greenwood CI using base R only (no
  `survival` package dependency). Composite expands to step-curve line, CI band,
  and censored-observation markers. Group stratification supported.

## Distribution fitting overlay

* `addIoLayer(type = "histogram_fit", mapping = list(value = "x"), options = list(family = "normal"))`
  fits normal, lognormal, or exponential distributions via MLE. Composite
  renders histogram + fitted density curve + optional parameter annotation.

## Layer opacity control

* `setLayerOpacity(label, opacity)` sets per-layer opacity (0-1). Critical for
  CI bands overlaying scatter data.

## SVG accessibility

* ARIA roles (`graphics-document`, `graphics-object`, `graphics-symbol`) applied
  to SVG chart structure for screen reader navigation.
* Keyboard navigation: arrow keys traverse layers and data points, with live
  region announcements (150ms debounce).
* Hidden data table fallback for screen reader access to raw data (capped at
  500 rows).
* Focus ring styling and screen-reader-only utility class.

## New chart types

* `lollipop` — vertical stem with circle head, supports `mean` and `summary`
  transforms. Compatible with categorical x-axis charts.
* `dumbbell` — connected dots showing a range between `low_y` and `high_y`.
* `waffle` — 10x10 grid of colored squares representing proportions. Standalone.
* `beeswarm` — dodge-positioned points to avoid overlap. Inline dodge algorithm.
* `bump` — smooth S-curves showing rank/value changes over time with grouped lines.
* `radar` — spider/radar chart with radial axes and polygon data fill.
* `funnel` — narrowing horizontal bars for conversion pipeline data.
* `parallel` — parallel coordinates for multivariate exploration.
  All new types support themed colors and standard tooltip formatting.

## Small multiples / faceting

* `setFacet(var, ncol, scales)` splits charts into a CSS grid of panels, one per
  unique value of the faceting variable. Supports fixed and free scale modes,
  auto-layout with configurable minimum panel width, and responsive breakpoints.

## Export enhancements

* `setExportOptions()` controls which export buttons appear in the toolbar
  (PNG, SVG, clipboard, CSV). New SVG download button and clipboard copy
  (SVG + PNG) via the Clipboard API.
* CSS custom properties resolved in exported SVGs for correct dark-mode colors.

## Dark mode / theme system

* `setTheme(mode = "dark")` applies a WCAG AA-verified dark palette across all
  chart elements. Also supports `"light"` and `"auto"` (detects OS preference
  and Quarto/Bootstrap `data-bs-theme`).
* Backward compatible: existing `setTheme(bg = "#fff")` calls still work.
* New `overrides` parameter for fine-grained CSS custom property control.
* High-contrast and reduced-motion CSS media query support.

## Sparkline mode

* `myIO(sparkline = TRUE)` renders a compact, axes-free chart suitable for
  embedding in table cells (reactable, DT, gt). Strips legend, axes, reference
  lines, and all interactions. Default height 20px. Supports line, bar, and
  area layer types.

## Bug fixes

* `myio_validate_spec()` and the chart specification schema no longer reject
  valid specs for chart types with a single required mapping (for example
  `histogram`, `gauge`, and `qq`). The schema now always represents list-typed
  fields as arrays.

# myIO 1.1.0

## I/O interaction system

myIO now supports bidirectional data flow — user interactions return
structured data, not just visual feedback.

* `setBrush()`: rectangle brush selection on point, bar, histogram, hexbin,
  and grouped bar charts. Selected points available as Shiny reactive input
  or scoped CSV export in static HTML.
* `setAnnotation()`: click any data point to attach a label. Annotations
  stored as structured data (source key, coordinates, label, category color,
  timestamp) and exportable as CSV. Supports preset label dropdowns and
  color category pickers.
* `setLinked()`: Crosstalk `SharedData` integration for cross-widget linked
  brushing. Selection dims non-matching points; optional filter mode hides
  them. Supports source, target, or bidirectional modes.
* `setSlider()`: parameter sliders below the chart that trigger Shiny
  re-rendering with configurable debounce. Renders disabled with tooltip
  in static HTML.

## Bug fixes

* `dragPoints()` now correctly emits the `dragEnd` event to Shiny
  (`input$myIO-{id}-dragEnd`), which was previously registered but never
  fired.

# myIO 1.0.0

## Statistical transforms

* New composable transform pipeline: `type + transform = layer`. Transforms
  compute statistics in R; renderers display them in D3.js.
* Transforms: `lm`, `loess`, `polynomial`, `ci`, `smooth`, `mean`, `mean_ci`,
  `residuals`, `summary`, `pairwise_test`, `qq`.
* Composite chart expansion: complex charts decompose into primitive layers.

## Chart types (20)

* Basic: `line`, `point`, `bar`, `area`, `groupedBar`.
* Statistical: `histogram`, `hexbin`, `regression`, `qq`.
* Distribution: `boxplot`, `violin`, `ridgeline`, `comparison`.
* Financial: `candlestick`, `waterfall`, `heatmap`.
* Standalone: `donut`, `gauge`, `treemap`, `sankey`.

## Composites

* `boxplot`: expands into IQR box + whisker caps + median + outliers.
* `violin`: expands into density area + IQR box + median point.
* `ridgeline`: density curves stacked vertically by group.
* `regression`: scatter + trend line + CI band + R-squared annotation.
* `qq`: Q-Q scatter + reference line + confidence envelope.
* `comparison`: boxplots + pairwise significance brackets.

## Interactions

* Tooltips with automatic formatting via `setToolTipOptions()`.
* Drag interaction via `dragPoints()`.
* CSV, SVG, and PNG export buttons.
* Reference lines via `setReferenceLines()`.
* Y-variable toggle via `setToggle()`.

## Infrastructure

* Responsive sizing that adapts to container dimensions.
* Shiny integration with `myIOOutput()` and `renderMyIO()`.
* Pipe-friendly API using native `|>`.
* Theming via CSS custom properties with `setTheme()`.
* Okabe-Ito colorblind-safe default palette.

# Market Research: Statistics Augmentation for Interactive R Visualization
## Date: 2026-03-21

## Executive summary

Interactive statistical visualization in R is a growing market (~200K-500K active users) with a clear vacuum opening: Plotly is deprioritizing R (retiring docs, 753 open issues, declining maintenance), and no existing package provides native, first-class statistical overlays (CI bands, regression diagnostics, distribution fits) on interactive D3-powered charts. The #1 validated user complaint — broken confidence interval rendering in ggplotly — has been open for 7+ years with zero response. myIO's transform pipeline is architecturally ready to fill this gap. Statistics augmentation isn't optional polish — it's the CRAN differentiation story.

## Market size

| Metric | Estimate | Source | Confidence |
|--------|----------|--------|------------|
| TAM | 2-3M R users worldwide | Stack Overflow Survey 2025 (4.9% of devs), TIOBE #10 | Medium |
| SAM | 200K-500K interactive viz users | htmlwidgets 8.2M downloads/yr, Shiny 6.3M/yr | Medium |
| SOM | 10K-30K users (3-year target) | Plotly R users seeking alternatives post-doc-retirement | Low |

## Growth and trends

- **R is growing, not dying.** Stack Overflow share rose from 4.3% (2024) to 4.9% (2025). TIOBE climbed to #10. R specializing in stats/bioinformatics/regulatory niches.
- **Interactive viz adoption accelerating.** htmlwidgets downloads grew 66% (4.96M → 8.23M) from 2022-2025. ggiraph nearly tripled.
- **Plotly R is in decline.** Documentation retired Nov 2025. Dash R/Julia/Matlab/F# docs already gone. Release cadence down to ~1/year. 753 open issues. Community asking "should I remove plotly as a dependency?"
- **Shiny enterprise adoption strong.** ~6.3M downloads/yr, active conference circuit (ShinyConf, Shiny in Production), pharma/finance verticals driving demand.
- **Growth rate**: Interactive R viz ~20% CAGR (htmlwidgets download trend). Shiny stable at ~6M/yr.

## Buyer segments

| Segment | Size | Pain intensity | Willingness to pay | Our fit |
|---------|------|---------------|-------------------|---------|
| Academic researchers (biostat, epi, social science) | Large (~40% of R users) | High — need CI bands, p-values, regression diagnostics on interactive plots | Low (open-source expectation) | Strong — transform pipeline maps directly to their workflow |
| Pharma/life sciences (FDA submissions, clinical trials) | Medium | High — regulatory viz needs are precise, interactive reporting growing | High (enterprise budgets) | Strong — distribution fits, CI bands, survival curves |
| Professional Shiny developers (consultancies, internal tools) | Medium (~50K) | Medium-High — frustrated with ggplotly conversion bugs | Medium (billable hours saved) | Strong — native Shiny integration, no ggplotly translation layer |
| Data journalists / communicators | Small | Low — need simple interactive charts, not statistical overlays | Low | Weak — not our primary value prop |
| Finance / quantitative analysts | Medium | Medium — need time-series smoothing, candlestick + moving averages | Medium | Moderate — candlestick exists, smoothing transforms would add value |

## Competitive landscape

| Player | Position | Strength | Weakness | Threat level |
|--------|----------|----------|----------|-------------|
| **plotly (R)** | Dominant incumbent, declining | 40+ chart types, ggplotly() one-liner, name recognition | Retiring R docs, 753 open issues, CI bands broken 7+ years, ggplotly conversion fundamentally flawed | Low (declining) |
| **ggiraph** | Rising ggplot2 extension | Inherits ALL ggplot2 stat layers, faithful rendering, linked brushing | SVG-only (perf degrades >10K points), no independent statistical compute | Medium (different niche) |
| **echarts4r** | Full-featured alternative | e_lm(), e_band(), e_band2() for stats, Apache 2.0 license, good defaults | Small community (84K downloads/yr), non-ggplot2 API, limited docs | Medium (closest competitor on stats) |
| **highcharter** | Premium option | Beautiful defaults, extensive chart types, drilldown | Commercial license ($590+/yr), no native stat features, must compute externally | Low (license barrier) |
| **apexcharter** | Lightweight dashboard tool | Clean API, MIT license | No statistical features, tiny user base (20K/yr) | Low |
| **r2d3** | Raw D3 bridge | Full D3 power | Requires JavaScript programming, minimal maintenance, no abstractions | Low (different market) |

### Statistical overlay support (validated)

| Feature | plotly | ggiraph | echarts4r | highcharter | apexcharter | **myIO opportunity** |
|---------|--------|---------|-----------|-------------|-------------|---------------------|
| CI bands | Broken in ggplotly (7yr bug) | Via ggplot2 stat layers | e_band() / e_band2() | Manual computation | No | **Native, first-class** |
| Error bars | Yes | Via ggplot2 | Yes | Yes | No | Native |
| Regression lines | Via ggplotly (buggy) | Via ggplot2 | e_lm() (basic) | Manual | No | **Native + CI** |
| Regression equation / R² | Broken in ggplotly (#1687) | Via ggplot2 extensions | No | No | No | **Differentiator** |
| Distribution fitting | No | Via ggplot2 stat | No | No | No | **Differentiator** |
| Statistical test annotations | No | No | No | No | No | **Differentiator** |
| LOESS / non-linear smooth | Via ggplotly (conversion issues) | Via ggplot2 | No | No | No | **Differentiator** |

### Market structure

**Fragmenting.** Plotly held dominant position but is ceding the R market. No clear successor. ggiraph is growing fastest but stays within ggplot2's paradigm (static-first, interactivity bolted on). echarts4r has the closest statistical features but small community. **This is an ideal entry window for a focused competitor.**

## Timing analysis

- **Why now**: Plotly retired R docs (Nov 2025). Dash R/Julia/Matlab docs already gone. Professional Shiny developers are actively asking "what do I migrate to?" (GitHub issue #2456, Posit Community thread). The window is open NOW.
- **Why not sooner**: Before Nov 2025, plotly was "good enough" despite bugs. The doc retirement was the trigger that made the community acknowledge the problem.
- **Window**: 12-18 months. Once the community settles on a successor (ggiraph for ggplot2 users, echarts4r for JS-native), switching costs rise. First mover with credible statistical features wins the "plotly replacement for Shiny" narrative.

## Validated user complaints (real issues, real URLs)

### The Big One: CI Bands Broken for 7+ Years

- **[plotly/plotly.R #1472](https://github.com/plotly/plotly.R/issues/1472)** (2019, STILL OPEN, 0 comments): geom_smooth CI ribbon renders nonsensical extra band below fitted line. Zero maintainer response in 7 years.
- **[plotly/plotly.R #1060](https://github.com/plotly/plotly.R/issues/1060)** (2017, STILL OPEN): geom_ribbon() breaks with NA values. Open 9 years.
- **[Plotly Community Forum](https://community.plotly.com/t/bug-strange-behavior-when-using-geom-ribbon-with-ggplotly-in-r/2003)**: Multiple threads confirming ribbon/CI rendering broken.

### Regression Annotations Don't Work

- **[plotly/plotly.R #1687](https://github.com/plotly/plotly.R/issues/1687)** (2020): stat_poly_eq (regression equation display) completely disappears in ggplotly. User: *"It is really urgent for me to show equation using ggplotly."*

### Growing List of Unimplemented Statistical Geoms (2025 alone)

- **#2428**: geom_GeomTextRepel not implemented
- **#2425**: geom_GeomLabel not implemented
- **#1705**: geom_GeomQqBand not implemented (QQ diagnostic bands)
- **#1404**: geom_GeomConfint not implemented (survival curve CIs)

### Performance Pain in Shiny

- **[Plotly Community](https://community.plotly.com/t/major-performance-difference-between-ggplotly-and-plot-ly/650)**: ggplotly renders in ~1s but plot_ly takes 5+ seconds with large datasets.
- **[#1874](https://github.com/plotly/plotly.R/issues/1874)**: partial_bundle() performance optimization itself is broken in Shiny.

### The Existential Question

- **[plotly/plotly.R #2456](https://github.com/plotly/plotly.R/issues/2456)** (Oct 2025): "Plotly is retiring its R documentation."
  - Hadley Wickham: *"No concrete news from us, but we are discussing this internally."*
  - Professional Shiny dev @Mkranj: *"We would appreciate new core Plotly.js functionality more than ggplotly() compatibility."*
  - User @SpikyClip: *"Or is Plotly R going to be completely abandoned, and I should remove it as a dependency from all our projects?"*

## Our opportunity

- **Wedge**: Interactive CI bands and regression overlays that actually work — the #1 broken feature in plotly R. Lead with "confidence intervals that render correctly, out of the box."
- **Differentiation**: Composable transform pipeline (compute → render separation). No ggplotly translation layer to break. Statistical computation in R (where it belongs), rendering in D3 (where it's beautiful). Only package offering native distribution fitting + test annotations on interactive charts.
- **Build vs. partner**: Build. The transform pipeline architecture is purpose-built for this. Each new transform is 40-80 LOC following a proven pattern. No external dependencies needed beyond base R `stats`.

## What to build (priority-ordered by validated demand)

### Tier 1: Directly addresses top user complaints

| Transform | What it solves | Validated by |
|-----------|---------------|-------------|
| `transform_lm` + CI bands | CI ribbon rendering (broken in plotly for 7 years) | Issues #1472, #1060, forum threads |
| `transform_loess` | Non-linear smoothing (ggplotly conversion issues) | geom_smooth conversion bugs |
| `transform_mean_ci` | Mean ± 95% CI error bars | Standard scientific practice; no interactive package does this natively |
| Regression equation / R² annotation | Equation display (broken in plotly #1687) | Issue #1687, "really urgent" user quote |

### Tier 2: Completes the statistical story

| Transform | What it solves | Validated by |
|-----------|---------------|-------------|
| `transform_summary` (count/sum/sd) | Pre-aggregation burden | Common Stack Overflow pattern |
| `transform_quantile_bands` | Percentile ribbons beyond boxplot 5-number summary | Time-series and longitudinal analysis needs |
| `transform_smooth` (moving average) | Time-series smoothing | Finance/operational dashboard use cases |
| `transform_polynomial` | Non-linear regression | Scientific modeling standard |

### Tier 3: Advanced differentiation

| Transform | What it solves | Validated by |
|-----------|---------------|-------------|
| `transform_fit_distribution` | Parametric distribution overlay | No competitor offers this |
| `transform_residuals` | Regression diagnostics | QQ band issues (#1705) |
| `composite_regression` | Scatter + line + CI + R² in one call | Workflow simplification |

## Recommendation

**Invest now.** This is the CRAN differentiation story AND the market timing is right:

1. The #1 user pain point (broken CI bands) maps directly to our strongest architectural advantage (composable transforms)
2. Plotly's R retreat creates a 12-18 month window before the community settles on alternatives
3. No competitor offers native statistical overlays on interactive D3 charts
4. Implementation cost is low — each transform is 40-80 LOC following a proven pattern
5. This transforms the CRAN narrative from "another charting wrapper" to "interactive statistical visualization toolkit"

**Sequence**: Tier 1 transforms first (CI bands, LOESS, mean±CI) → CRAN submission with differentiation story → Tier 2 post-acceptance → Tier 3 based on user feedback.

## Open questions

- Should transforms support grouped regression (separate model per group) from day one, or add it as a follow-up?
- Text annotation renderer in JS — needed for R²/equation display. How complex is this to add to the existing renderer architecture?
- Should we add a `composite_regression` (scatter + line + CI band) as a convenience composite, or let users compose layers manually?
- Performance: LOESS on 100K+ rows may be slow before serialization. Test and potentially add sampling option.
- echarts4r's `e_band()` is the closest competitor feature — should we study their API for ergonomic inspiration?

## Sources

- [Plotly retiring R documentation — GitHub #2456](https://github.com/plotly/plotly.R/issues/2456)
- [Plotly retiring R documentation — Posit Community](https://forum.posit.co/t/plotly-is-retiring-its-r-documentation/208325)
- [Plotly R development virtually stopped? — Plotly Community](https://community.plotly.com/t/plotly-r-development-virtually-stopped/88894)
- [Retiring non-Python Dash docs — Plotly](https://community.plotly.com/t/retiring-the-non-python-dash-documentation/92122)
- [geom_smooth CI bug #1472 (open since 2019)](https://github.com/plotly/plotly.R/issues/1472)
- [geom_ribbon NA bug #1060 (open since 2017)](https://github.com/plotly/plotly.R/issues/1060)
- [Regression equation bug #1687](https://github.com/plotly/plotly.R/issues/1687)
- [geom_ribbon rendering bugs — Plotly Community](https://community.plotly.com/t/bug-strange-behavior-when-using-geom-ribbon-with-ggplotly-in-r/2003)
- [Performance: ggplotly vs plot_ly — Plotly Community](https://community.plotly.com/t/major-performance-difference-between-ggplotly-and-plot-ly/650)
- [partial_bundle broken in Shiny #1874](https://github.com/plotly/plotly.R/issues/1874)
- [ggplotly regressions PR #2472](https://github.com/plotly/plotly.R/pull/2472)
- [Improving ggplotly — official docs](https://plotly-r.com/improving-ggplotly.html)
- [echarts4r statistical plots](https://echarts4r.john-coene.com/articles/stats.html)
- [ggiraph — InfoWorld](https://www.infoworld.com/article/2268015/easy-interactive-ggplot-graphs-in-r-with-ggiraph.html)
- [r2d3 — Posit](https://rstudio.github.io/r2d3/)
- [Stack Overflow Developer Survey 2025](https://survey.stackoverflow.co/2025/technology)
- [R climbs back to TIOBE top 10 — FlowingData](https://flowingdata.com/2025/12/19/r-climbs-back-up-into-the-top-ten-programming-languages)
- [CRAN Task View: Dynamic Visualizations](https://cran.r-project.org/web/views/DynamicVisualizations.html)
- [Interactive Data Visualization with R — Tidy Intelligence](https://blog.tidy-intelligence.com/posts/interactive-data-visualization-with-r/)
- [CRAN Downloads API](https://cranlogs.r-pkg.org/)
- [htmlwidgets cross-widget communication #86](https://github.com/ramnathv/htmlwidgets/issues/86)

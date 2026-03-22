# Phase 3 Roadmap — myIO
## Date: 2026-03-21

## Strategic context

Phase 2 (statistics augmentation) shipped 8 transforms + composite_regression + TextRenderer. The CRAN differentiation story is now "interactive statistical visualization with composable transforms." Phase 3 should: (a) lock in the CRAN submission, (b) extend the statistical story into high-value verticals, and (c) close the interaction gap with ggiraph/echarts4r.

## Phase 3A: CRAN Submission (4-6 weeks)

### 1. "Why myIO" vignette
**Effort:** 3-4 days | **Priority:** Blocker

Write `vignettes/why-myio.Rmd` with side-by-side comparisons:
- Plotly CI bands broken 7 years (#1472) vs. myIO native `transform_ci`
- ggplotly regression equation disappears (#1687) vs. myIO `composite_regression` with R²
- Composite auto-expansion (boxplot → 4 sublayers) vs. manual assembly in plotly
- Transform pipeline (R computes, D3 renders) vs. ggplotly conversion layer

This is the single biggest blocker. CRAN reviewers need the "why" answer.

### 2. Hypothesis test annotations
**Effort:** 3-4 weeks | **Priority:** High

Extends TextRenderer to support significance brackets between groups.

- `transform_pairwise_test(method = "t.test" | "wilcox.test")` — returns p-value + test statistic per pair
- TextRenderer data-coordinate positioning: bracket between two x values + p-value label
- `composite_comparison` — side-by-side boxplots + significance bracket
- No new dependencies — uses `stats::t.test`, `stats::wilcox.test`

**Why now:** Solves broken plotly #1687 (equation/stats display). Publication-critical for academic users. Completes the "statistical annotations" story started by TextRenderer.

### 3. Q-Q diagnostic plots
**Effort:** 2-3 weeks | **Priority:** Medium-high

Completes the regression diagnostics suite.

- `transform_qq` — theoretical vs. sample quantiles + CI envelope
- `composite_qq` — Q-Q scatter + reference line + confidence band
- Uses `stats::qqnorm`, `stats::qqline` internals
- Renders with existing PointRenderer + LineRenderer + AreaRenderer

**Why now:** Residual plots are already in Phase 2. Q-Q is the natural companion. Validates statistical rigor to CRAN reviewers and publication reviewers.

### 4. CRAN submission
**Effort:** 2-3 days | **Priority:** Gate

- `R CMD check --as-cran` — fix all NOTEs/WARNINGs
- Write `cran-comments.md`
- Submit via `devtools::release()`

## Phase 3B: Vertical expansion (6-8 weeks, post-CRAN)

### 5. Survival curve support (Kaplan-Meier)
**Effort:** 2-3 weeks | **Priority:** High

Opens the pharma/biostat segment — the highest willingness-to-pay vertical.

- `transform_survfit` — step function from time + status columns
- `composite_survfit` — step line + CI band + event markers
- No CRAN dependency on `survival` — compute step function with base R
- Works with LineRenderer (step interpolation) + AreaRenderer (CI)

### 6. Linked brushing (cross-chart filtering)
**Effort:** 4-5 weeks | **Priority:** Medium-high

Closes the interaction gap with ggiraph. Expected by Shiny dashboard users.

- JS: event broadcasting between chart instances via SharedData pattern
- R: `linkCharts(chart1_id, chart2_id, on = "column_name")`
- Brush selection in one chart highlights matching rows in linked charts
- Shiny input binding: `input$chart_id_selected_rows`

### 7. Distribution fitting overlay
**Effort:** 3-4 weeks | **Priority:** Medium

- `transform_fit_distribution(family = "normal" | "lognormal" | "exponential")`
- Overlay fitted PDF on histogram
- Implement MLE inline (avoid MASS dependency) for normal/exponential; defer Weibull
- `composite_histogram_fit` — histogram + fitted density curve

## Phase 3C: Polish (2-3 weeks, ongoing)

### 8. Layer opacity control
- `setLayerOpacity(label, opacity)` setter
- JS: respect `layer.options.opacity` in all renderers
- Critical for CI bands overlaying scatter data

### 9. Plotly migration guide vignette
- `vignettes/plotly-migration.Rmd`
- Side-by-side code for 10 common plotly patterns
- Performance comparison (render times)

### 10. Transform contributor guide
- How to add a custom transform (data contract, test patterns, registry)
- Template file for community contributions

## Dependency order

```
3A.1 (vignette) ──────────────────────────────────────────┐
3A.2 (hypothesis tests) ──── needs TextRenderer extension ─┤
3A.3 (Q-Q plots) ──── needs transform + composite ────────┤
                                                           ▼
                                                    3A.4 CRAN submit
                                                           │
                        ┌──────────────────────────────────┘
                        ▼
3B.5 (survival) ──── independent
3B.6 (linked brush) ── independent, JS-heavy
3B.7 (dist fitting) ── independent
3C.8-10 (polish) ──── independent, ongoing
```

## What we're NOT building (and why)

- **GLM / mixed-effects models**: Too many edge cases, heavy dependencies. Users pre-compute in R.
- **Bayesian credible intervals**: Niche. Users who need this have their own tooling.
- **WebGL rendering**: Only if performance complaints accumulate. SVG is fine for <10K points.
- **ggplot2 compatibility layer**: Different paradigm. We compete on native API, not translation.
- **Time-series decomposition**: Specialized. Better served by dedicated packages (forecast, tsibble).

## Success criteria

Phase 3 is complete when:
- myIO is accepted on CRAN
- "Why myIO" vignette shows clear differentiation from plotly/echarts4r/ggiraph
- At least one domain-specific feature (survival curves or hypothesis tests) ships
- Blog post published to R-bloggers

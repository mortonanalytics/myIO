# Repository stability remediation

## Objective and constraints

Correct reproduced programming, rendering, and documentation defects while preserving the public API. Intake: [stability-audit-20260905](../intake/stability-audit-20260905.md). The audit uses current source, executable reproductions, package tests, and the running demo. Passing automated checks is distinct from a founder walkthrough.

## Task manifest and test contract

| Task | Intake | Scheduled changes | Verification |
| --- | --- | --- | --- |
| PLAN | AUD-005 | Record findings, ownership, and disposition here. | Every intake ID and confirmed finding has a task. |
| FIX-R | AUD-001 | Align incomplete linear-model rows with source keys; support polynomial confidence bands; correct LOESS degree and prediction degrees of freedom; preserve missing groups without phantom rows; return typed empty aggregates; extend survival curves through follow-up. | Public R regression tests; compare model intervals with stats predictions; verify source-key partitioning, empty schemas, and survival endpoints. |
| FIX-JS | AUD-002 | Preserve clip paths through empty states; use canonical exact layer class matching; prevent delayed callbacks after destroy; clean binding subscriptions; preserve scalar group names and hidden-tab registration; render pre-1970 R Date ticks correctly. | JS regressions for hide/restore, labels, timers, subscriptions, resizing, and dates; production-bundle browser tests. |
| FIX-MCP | AUD-001, AUD-002 | Reject inherited schema names and invalid mapping values in validators; keep R and JS conformance aligned. | Shared validation corpus, R validator tests, MCP tests and server smoke. |
| FIX-DEMO | AUD-004 | Render the Beeswarm example using the actual renderer and categorical axis; correct observed gallery errors and graphic defects. | Visit every gallery tab, exercise regression controls and mobile layouts, inspect screenshots and console errors. |
| FIX-DOC | AUD-003 | Correct verified chart/theme counts and descriptions; align documentation with fixed behavior. | Source-backed documentation review, executable examples, pkgdown build, independent copy edit. |
| FIX-DEPS | AUD-002 | Reuse the existing PR #120 dependency fix where applicable; verify the resulting dependency tree and shipped bundle. | Clean npm install, audit, build, JS and browser tests. Preserve unrelated open dependency PRs. |
| REVIEW | AUD-006 | Independent devil's advocate review of the final diff for correctness, unnecessary complexity, missing cases, compatibility, and claims. | Resolve all confirmed defects; repeat affected checks. |
| VERIFY-MERGE | AUD-007 | Commit tested groups of changes, open one audit PR, wait for all required CI, merge, and verify resulting GitHub state. | R suite/check, JS suite, browser suite, MCP smoke, docs build, passing PR CI and confirmed merge SHA. |

## Ownership

R implementation agent: R transforms, grouping and composites, and their tests; excludes R/llm_tools.R. JavaScript implementation agent: Chart.js, PointRenderer.js, layout/axes.js, the htmlwidget binding, and focused JS regressions. Documentation/renderer agent: assigned README and vignette corrections, LineRenderer, AreaRenderer, CalendarHeatmapRenderer, BeeswarmRenderer, and their focused tests. The JavaScript agent also owns opacity targets in the other affected renderers. Parent: demo, validators, shared conformance fixtures, dependencies, bundle, audit records, integration verification, and PR.

## Disposition

All intake requirements are Scheduled to the task IDs above. Implementation and independent review are complete. VERIFY-MERGE remains pending PR CI and merge. The unused proxy-auth stub was removed while preserving the public gallery behavior. No release, version bump, or CRAN submission is part of this request.

## Findings from the live gallery and fix review

- FIX-JS / AUD-002, AUD-004: survival line and band ignore the composite's `stepAfter` option and draw smooth curves. Fixed with explicit step interpolation in LineRenderer and AreaRenderer, with SVG geometry regression tests.
- FIX-JS / AUD-002, AUD-004: calendar sizing omits cell gaps and clips the last weekday row. Fixed sizing against actual plot dimensions and narrow-container regression tests.
- FIX-JS / AUD-002: layer opacity is overwritten by enter transitions; id-based renderers also escape generic hide matching. Fixed renderer opacity targets, reset-to-one coverage, and id-based cleanup.
- FIX-MCP / AUD-002: current MCP lockfile includes vulnerable fast-uri and qs versions. Completed compatible transitive updates, conformance/smoke tests, and a clean audit.
- FIX-DOC / AUD-003: setSlider's example uses an unrecognized regression option and omits the reactive input. Added a working Shiny example and regenerated help.

- FIX-JS / AUD-002, AUD-004: Beeswarm categories used band starts, placing points above their axis labels; category tooltips displayed NaN. Fixed band centering and categorical tooltip formatting with regressions.
- FIX-DEMO / AUD-004: the regression demo passed degree 3 to LOESS, which rejects it. The example now chooses a valid degree for each method. Mobile navigation now collapses.
- FIX-JS / AUD-002: the shipped bundle was stale after a dependency update. Rebuilt it and added a CI comparison of the committed bundle with a clean build.

## Independent review findings resolved

The R author reviewed the JavaScript and validator changes; the JavaScript author reviewed the R changes. A separate copy-editor checked the documentation against the voice brief and source facts.

- Replaced suffix matching with exact mark tokens after a crafted neighboring label reproduced incorrect cleanup.
- Added coordinator and bridge cleanup on actual destruction while retaining registration during temporary hiding.
- Preserved the existing parallel-coordinate dimension-vector mapping contract in both validators.
- Kept NA and NaN source partitions distinct and disambiguated missing labels after JavaScript sanitization.
- Returned typed empty polynomial confidence bands when residual degrees of freedom are unavailable.

## Verification

- Full JavaScript suite: 689 tests passed in 64 files.
- Production-bundle browser suite: 28 tests passed, including the new empty/restore clipping regression.
- Full R suite: passed; three existing DuckDB cache tests skip because their optional local fixture is absent.
- MCP shared conformance tests and server smoke: passed. Root and MCP npm audits report zero vulnerabilities.
- R package build, examples, vignettes, and pkgdown site build: passed.
- R CMD check --as-cran: passed with one local NOTE because the system HTML Tidy cannot validate the HTML manual; PDF manual passed.
- Desktop gallery: all 44 pages visited with no console diagnostics. Screenshots inspected for Beeswarm, calendar, survival, and theme layouts.
- Intake coverage: every AUD-001 through AUD-007 appears in the task manifest. No intake item is deferred or out of scope.

PR CI and merge evidence will be added after GitHub verification. Python consumers receive compatible engine fixes with their next submodule update; this work does not claim a completed pymyIO bump or a founder walkthrough.

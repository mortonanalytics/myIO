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
| REVIEW | AUD-006 | Independent devil's advocate review of the final diff for correctness, unnecessary complexity, missing cases, compatibility, and claims. | Resolve all actionable findings; repeat affected checks. |
| VERIFY-MERGE | AUD-007 | Commit tested groups of changes, open one audit PR, wait for all required CI, merge, and verify resulting GitHub state. | R suite/check, JS suite, browser suite, MCP smoke, docs build, passing PR CI and confirmed merge SHA. |

## Ownership

R implementation agent: R transforms, grouping and composites, and their tests; excludes R/llm_tools.R. JavaScript implementation agent: Chart.js, PointRenderer.js, layout/axes.js, the htmlwidget binding, and focused JS regressions. Documentation agent: README.md, vignettes, and corresponding generated documentation only. Parent: demo, validators, shared conformance fixtures, dependencies, bundle, audit records, integration verification, and PR.

## Disposition

All intake requirements are Scheduled above. The existing proxy-auth debug stub requires checking deployment intent before changing public demo access; no access policy is inferred. No release, version bump, or CRAN submission is part of this request. Follow-up findings and final verification results will be recorded before merge.

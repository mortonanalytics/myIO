# Intake — automation loop hardening, 2026-09-05

Source: a review of the scheduled automation loops for this repository, requested
2026-09-05, followed by an instruction to implement the recommendations that survived a
devil's advocate pass. The review's findings are the canonical list below; each carries the
evidence that produced it so a reader can re-derive the finding rather than trust it.

Plan: [automation-loop-hardening-20260905](../todo/automation-loop-hardening-20260905.md)

| ID | Item | Evidence | Disposition |
| --- | --- | --- | --- |
| LOOP-001 | An unreviewed `automation-pr` head-of-line blocks the whole pipeline. #120 sat open 5 days at 11/11 green, went `CONFLICTING` at 14 commits behind, and its `Closes #115` never fired. | `backlog-pipeline` intake gate requires no open `automation-pr`; `gh pr view 120` | Scheduled — UNBLOCK |
| LOOP-002 | The pipeline opens pull requests and never revisits them, so a stale one stays stale. | 9 runs in `myio-backlog-pipeline.stdout.log`, none touching a prior run's pull request | Scheduled — PIPE-TEND |
| LOOP-003 | Nothing notifies anyone that an automation pull request is waiting. Output goes to append-only files on the laptop. | `StandardOutPath` in all three plists; no other sink exists | Scheduled — WATCH-PR |
| LOOP-004 | Exit status is meaningless: `claude -p` returns 0 for shipped, for gate-failed, and for died-mid-run. | 2026-08-31 run: final output `Three green so far ... Waiting on the R matrix`, exit 0 | Scheduled — RUN-JSON |
| LOOP-005 | Waiting on CI synchronously cost the 2026-08-31 run its entire report after 2h51m. | Same run; pull request created 15:50:09, session ended 15:51:40 mid-wait | Scheduled — PIPE-NOWAIT |
| LOOP-006 | Cadence is inverted. `idea-scout` runs monthly and yields about two `backlog-ready` items; the pipeline runs weekly and consumes one. 7 of 9 runs no-oped, most logging zero open issues. | Both stdout logs, 2026-07-06 through 2026-09-01 | Scheduled — SCOUT-CADENCE |
| LOOP-007 | No release loop exists. `cut-release` never fired and 1.4.0 has been finished and unshipped since 2026-08-09. | No `myio-cut-release.*` log; `git tag` stops at `v1.3.0` | Scheduled — REL-REPORT |
| LOOP-008 | `NEWS.md:1` reads `# myIO 1.4.0` with no development marker while 1.4.0 is untagged, and #118 and #127 appended notes under it. Every release automation reads this header. | `NEWS.md:1`; `cut-release` SKILL.md Step 3 expects `# myIO (development version)` | Scheduled — NEWS-DEV |
| LOOP-009 | Nothing watches the two outward-facing surfaces: the CRAN check farm for the published version, and the demo site. Both green today, so this is cover, not a fire. | 13/13 `OK` on 1.3.0; `morton-analytics.com/myio/` HTTP 200 | Scheduled — WATCH-HEALTH |
| LOOP-010 | Stale worktrees accumulate and local `main` drifts behind `origin`. Every run's report spends words on the drift; none fixes it. | `/private/tmp/myio-115` prunable; `main` was 2 behind at review time | Scheduled — RUN-JSON |
| LOOP-011 | Two malformed permission rules warn on every run since July. | Both stderr logs | Deferred — destination: the session that removes `--permission-mode bypassPermissions`, which is the re-entry gate. Inert under bypass, so fixing them now changes nothing observable. |

## Inherited IDs

`AUD-001` through `AUD-007` belong to
[stability-audit-20260905](stability-audit-20260905.md) and were carried by PR #127, which
merged 2026-09-05. They are out of scope for this plan: that intake owns their
disposition, and this work touches no file under `R/`, `src/`, `inst/`, `tests/`, or
`man/`. They surface here only because the coverage hook unions IDs across every file in
`md/intake/`.

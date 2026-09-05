# Automation loop hardening

## Objective and constraints

The three scheduled loops for this repo (`idea-scout`, `backlog-pipeline`, and the
never-fired `cut-release` one-shot) produced one merged pull request across nine
`backlog-pipeline` runs between 2026-07-06 and 2026-08-31. This plan fixes the causes
that review identified and that survived a devil's advocate pass. It changes automation
only: no package source, no public API, no version bump, no release, no CRAN step.

Intake: [automation-loop-hardening-20260905](../intake/automation-loop-hardening-20260905.md).

Evidence base, all verified 2026-09-05:

- `~/.local/share/myio-backlog-pipeline.stdout.log` — 9 runs, 7 no-ops, one truncated run.
- `~/.local/share/myio-idea-scout.stdout.log` — 2 runs; the 2026-08-01 run filed nothing.
- No `~/.local/share/myio-cut-release.*` log exists, so that loop never ran.
- `git tag` stops at `v1.3.0` while `DESCRIPTION` reads `1.4.0` and `NEWS.md:1` reads
  `# myIO 1.4.0`.
- CRAN check farm: 13/13 `OK` on 1.3.0. `https://morton-analytics.com/myio/`: HTTP 200.

Two constraints shape the design. `launchd` `StartCalendarInterval` cannot express a
biweekly schedule, and version numbers are the maintainer's call, not this plan's.

## Task manifest and test contract

| Task | Intake | Scheduled changes | Verification |
| --- | --- | --- | --- |
| UNBLOCK | LOOP-001 (R1) | Close pull request #120 as superseded by #127 and close issue #115, whose `Closes` never fired because #120 never merged. | `gh pr view 120` reports `CLOSED`; `gh issue view 115` reports `CLOSED`; `npm audit --omit=dev` reports zero vulnerabilities on `main`. |
| PIPE-TEND | LOOP-002 (R2) | `backlog-pipeline` tends its own open `automation-pr` — rebase when conflicted, report age and check rollup — instead of stopping at a bare no-op. Never merges or closes it. | Skill states the rebase path, the abort-on-non-mechanical-conflict path, and the never-merge rule. |
| PIPE-NOWAIT | LOOP-005 (R5) | `backlog-pipeline` opens the pull request, writes its report, and exits rather than polling CI to completion. | Skill states the exit point and requires naming which checks had reported and which were pending. |
| WATCH-PR | LOOP-003 (R3) | `.github/workflows/automation-watch.yml` — daily; comments once on any `automation-pr` open past the threshold, with its check rollup and mergeability. | Local: YAML parses; `bash -n` on the `run:` body; the marker guard holds in both directions against a 9.2 MB comment body, where the obvious `gh \| grep -q` form fails under `pipefail` via SIGPIPE; the rollup jq labels an in-progress check `PENDING`. On a runner: not verifiable before merge — see Gate commands. |
| WATCH-HEALTH | LOOP-009 (new) | `.github/workflows/health-watch.yml` — weekly; opens an issue if the CRAN check farm shows `WARN`/`ERROR`, if the package page 404s (archival), or if the demo site is not 200. | Local dry-run against the live endpoints: package page 200 (303 without `-L`, which would have left the archival probe permanently dead), farm 13/13 `OK`, demo 200, files nothing. Red path exercised with a stubbed `gh`. On a runner: not verifiable before merge — see Gate commands. |
| RUN-JSON | LOOP-004, LOOP-010 (R4) | One shared `~/.local/bin/myio-loop.sh` replacing three near-identical scripts: `--output-format json`, parsed outcome, TSV ledger, exit non-zero only on harness error, stdin redirect, worktree prune, fast-forward, PID-checked lock. | A real loop run through the script appends one ledger row and writes its log; a concurrent invocation exits on a live-PID lock and proceeds after clearing a stale one; non-JSON output records `harness-fail` and exits 1; the fast-forward is skipped when the checkout is not on `main`. |
| SCOUT-CADENCE | LOOP-006 (R6) | `idea-scout` moves from monthly (day 1) to weekly Saturday, so the queue is fresh before every Monday pipeline run. Skill gains an explicit instruction to file nothing when a run surfaces nothing new. | `launchctl print` shows `Weekday 6`; skill states the file-nothing rule. |
| REL-REPORT | LOOP-007 (R7) | New `release-readiness` skill plus a monthly loop. Reports what is merged and unreleased, what the version bump would be, and whether the CRAN gate passes. Opens an issue only when unreleased work exists. Never tags, bumps, releases, or submits. The `cut-release` one-shot plist and script retire to `retired/`. | Skill states the report-only boundary; `launchctl list` shows the new job and no `cut-release` job. |
| NEWS-DEV | LOOP-008 (R8) | `NEWS.md:1` becomes `# myIO (development version)`. 1.4.0 is untagged and unpublished, and two pull requests appended notes under a header that read as released. | `grep -n '^# myIO' NEWS.md` shows the development header above `# myIO 1.3.0`; no version number is chosen by this change. |

## Disposition

Every recommendation that survived the devil's advocate pass is Scheduled above.
Recommendations rejected during that pass are recorded below with the reason, so they are
not silently re-proposed:

- **Parallel `automation-pr`s** — Out of scope. Concurrent automation pull requests on
  overlapping files are the merge-chaos case, and more open pull requests do not help when
  the constraint is review time.
- **Auto-merging a green `automation-pr`** — Out of scope. It removes the only human gate
  on unattended code entering a CRAN package, and `main` has no branch protection.
- **Moving the loops off `launchd`** — Out of scope. All 11 scheduled fires landed on
  time; the scheduler is not the failure.
- **`--max-turns` or a hard timeout** — Out of scope. PIPE-NOWAIT removes the truncation
  failure mode without a cap that would strangle a legitimate three-hour run.
- **Branch protection on `main`** — Out of scope. It would break the two badge-committing
  workflows that push to `main` directly.
- **LOOP-011, the two malformed permission rules in the loops' stderr** — Deferred. The
  destination is the session that removes `--permission-mode bypassPermissions`, and that
  removal is the re-entry gate. Under bypass the rules are inert, so fixing them now
  changes nothing observable.
- **AUD-001, AUD-002, AUD-003, AUD-004, AUD-005, AUD-006 and AUD-007** — Out of scope.
  They belong to [stability-audit-20260905](../intake/stability-audit-20260905.md), which
  owns their disposition and shipped them in PR #127; this plan touches no file under
  `R/`, `src/`, `inst/`, `tests/`, or `man/`.

Two deviations from the review, both forced and both stated rather than absorbed:

- **SCOUT-CADENCE is weekly, not biweekly.** `launchd` has no biweekly interval, and
  expressing one by day-of-month puts `idea-scout` back on a possible Monday collision
  with `backlog-pipeline`. A week-parity guard in the runner would work but adds a silent
  skip path that reads as a failure in the ledger and misbehaves across the week 53 to
  week 1 boundary. Saturday-weekly is collision-free by construction. The filler-candidate
  risk this raises is answered by the file-nothing rule and the four existing
  `backlog-ready` bars, which demonstrably held #123 back on 2026-09-01.
- **REL-REPORT reports; it does not release.** `cut-release` sat disabled for a month
  without anyone noticing, which says the release decision is not cron-shaped. A monthly
  report converts the riskiest loop into the safest and still surfaces that 1.4.0 has been
  finished and unshipped since 2026-08-09.

`DESCRIPTION` stays at `1.4.0`. Whether an unreleased development version should read
`1.3.0.9000` instead is a versioning decision this plan raises and leaves to the
maintainer.

## Files

Repository, carried by this branch:

- `.agents/skills/backlog-pipeline/SKILL.md` — PIPE-TEND, PIPE-NOWAIT
- `.agents/skills/idea-scout/SKILL.md` — SCOUT-CADENCE
- `.agents/skills/release-readiness/SKILL.md` — REL-REPORT (new)
- `.claude/skills/release-readiness` — symlink matching the seven existing ones
- `.github/workflows/automation-watch.yml` — WATCH-PR (new)
- `.github/workflows/health-watch.yml` — WATCH-HEALTH (new)
- `NEWS.md` — NEWS-DEV
- `md/intake/automation-loop-hardening-20260905.md` — the canonical item list
- `md/todo/automation-loop-hardening-20260905.md` — this plan

Host, outside the repository and therefore outside this branch:

- `~/.local/bin/myio-loop.sh` — RUN-JSON (new, shared)
- `~/.local/bin/myio-{backlog-pipeline,idea-scout,cut-release}.sh` — retired
- `~/Library/LaunchAgents/com.morton.myio-idea-scout.plist` — SCOUT-CADENCE
- `~/Library/LaunchAgents/com.morton.myio-backlog-pipeline.plist` — RUN-JSON
- `~/Library/LaunchAgents/com.morton.myio-release-readiness.plist` — REL-REPORT (new)
- `~/Library/LaunchAgents/retired/com.morton.myio-cut-release.plist.disabled` — retired there,
  alongside `~/.local/bin/retired/`, mirroring the existing `~/.claude/commands-retired/`
  convention rather than deleting either

These host files are unversioned. That is pre-existing and this plan does not change it;
reconstructing them for this review required reading `launchctl` and the filesystem.

## Gate commands

- Workflows: `actionlint` if present, otherwise `python3 -c "import yaml,sys;
  yaml.safe_load(open(f))"` on each, plus `bash -n` on every extracted `run:` body and a
  local dry-run of each probe against its live endpoint.

  **A `workflow_dispatch` run cannot gate this branch.** GitHub exposes dispatch only for
  workflows already on the default branch: `gh workflow view automation-watch.yml` returns
  `HTTP 404: not found on the default branch` until this merges. Both workflows therefore
  reach the pull request having never executed on a runner, and the first post-merge
  dispatch of each is part of this work rather than a follow-up. What that dispatch has to
  prove is what no local check can: GNU `date -u -d` on the runner, `set -euo pipefail`
  through the whole `while read` loop, `GITHUB_OUTPUT` heredoc handling for a multi-line
  `FARM_DETAIL`, and the two `gh` write paths under the workflow token's `pull-requests:
  write` and `issues: write` scopes. Neither comment path has ever posted anything.
- Runner: `bash -n ~/.local/bin/myio-loop.sh`, then a real invocation of each loop with
  the ledger row inspected, then a concurrent invocation to prove the lock.
- `launchd`: `plutil -lint` each plist, `launchctl bootout`/`bootstrap`, `launchctl print
  gui/$(id -u)/<label>` to confirm the parsed calendar interval.
- Repository unchanged elsewhere: `git diff --stat origin/main` touches no file under
  `R/`, `src/`, `inst/`, `tests/`, or `man/`.

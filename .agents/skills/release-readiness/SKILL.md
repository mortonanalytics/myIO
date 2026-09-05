---
name: release-readiness
description: Report what is merged and unreleased in myIO, what version bump it implies, and whether the CRAN gate would pass. Reports only — never bumps, tags, releases, or submits. Use for the scheduled monthly release check or when deciding whether it is time to cut.
---

# myIO release readiness

Answer one question: is there enough finished work to justify a release, and would it pass
if cut today. Report the answer. Do not act on it.

`cut-release` is the skill that acts, and it stays manual. This one exists because the
release decision is not cron-shaped — the `cut-release` one-shot sat disabled for a month
without anyone noticing while 1.4.0 sat finished and untagged since 2026-08-09. A report
that arrives is worth more than an automated release nobody asked for.

## What to gather

Evaluate everything against remote state. `git fetch origin` first, and answer any
merged/landed/shipped question with `git merge-base --is-ancestor <sha> origin/main` or
`gh pr view <n> --json state` reporting `MERGED`. A commit in bare `git log` proves
nothing.

- Last released tag (`git tag --sort=-v:refname | head -1`) and every non-merge commit
  since it. Read them, do not count them.
- `DESCRIPTION` `Version:` and the current `NEWS.md` top section, read fresh.
- Whether every merged pull request since the tag is reflected in `NEWS.md`. Name the gaps;
  do not fill them.
- The version on CRAN and the check-farm result for it, from
  `https://cran.r-project.org/web/checks/check_results_myIO.html`. A `WARN` or `ERROR`
  there outranks everything else in this report: CRAN archives on a clock.
- Open `automation-pr`s and open `backlog-ready` issues — work that is nearly in, which
  changes whether waiting a week is better than cutting now.

## What to decide, and what not to

Per `docs/versioning-policy.md`: patch for bug fixes with no API change, minor for
backward-compatible features, major for removed deprecated APIs or unavoidable breaks.

State which bump the merged work implies and why. Flag prominently if anything reads as
breaking — a wrong major/minor call is a real compatibility break for users pinned to
`^1.x`. **Do not choose the number and do not edit `DESCRIPTION` or `NEWS.md`.** Version
numbers are the maintainer's call; this skill supplies the evidence for it.

Compare the bump against `DESCRIPTION` rather than assuming they agree. This project bumps
`DESCRIPTION` ahead of the tag, so an unreleased line shows up as a `Version:` with no
matching tag — `1.4.0` against a newest tag of `v1.3.0`. That is the normal in-flight state,
not a defect. Report it as "1.4.0 is the open line, N days since v1.3.0". It becomes a
finding only when the implied bump disagrees with the number already sitting in
`DESCRIPTION`, because then whoever cuts the release has to choose.

Run the CRAN gate by invoking the `cran-check` skill or the **cran-submission-expert**
agent. Report the verdict and the per-gate detail. Do not fix what it finds.

## What to file

File a GitHub issue titled `Release readiness — {date}`, labeled `enhancement`, **only
when there is merged work not yet in a released tag**. Include the version bump the work
implies, the CRAN gate verdict, any `NEWS.md` gaps, and the count of days since the last
tag. If an open `Release readiness` issue already exists, comment on it instead of opening
a second one.

If everything merged is already released, write the finding to the run log and file
nothing. A monthly issue saying "nothing to do" is the noise this skill was built to avoid.

Two exceptions, which file regardless of release state because they are outages rather than
readiness: a CRAN check-farm `WARN`/`ERROR` on the published version, and a `NEWS.md` whose
top section carries a bare version header whose tag does not exist — that header misleads
every release automation that reads it.

## Boundary

Never bump a version, edit `NEWS.md` or `DESCRIPTION`, tag, push, create a release, or
submit to CRAN. Those belong to `cut-release` and to Ryan. Ending a run having changed a
tracked file is a failed run.

## Output

```
## Release readiness — {date}

### Merged and unreleased
{last tag, days since, commits since, PRs, NEWS.md coverage gaps}

### Implied bump
{patch/minor/major, with rationale — flag prominently if major. No number chosen.}

### CRAN
{published version, check-farm result, gate verdict with per-gate detail}

### Nearly in
{open automation-prs, open backlog-ready issues}

### Verdict
{Cut now / wait, with the reason. Issue filed: #N, or "nothing filed, all merged work is released".}
```

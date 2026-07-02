---
name: idea-scout
description: Source new feature ideas from competitive/ecosystem scanning and inbound GitHub signal, triage each one, and write approved candidates into the intake ledger so backlog-pipeline can pick them up. Loop-compatible — upstream of backlog-pipeline, not a replacement for it.
argument-hint: "[topic-focus] (optional — narrows the scan, e.g. 'geospatial layers')"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Idea Scout

Sources and triages new feature ideas, then hands qualified ones to `backlog-pipeline` via the
ledger. Idea generation and idea execution are kept as separate skills on purpose — they can run
on different cadences (e.g. scout weekly, pipeline continuously).

## Step 1 — Source candidates (run in parallel)

**A. Competitive/ecosystem scan**
- **competitive-analyst agent** — "myIO's competitive set is ECharts, Plotly, deck.gl, and Mosaic
  (not ggiraph — see project positioning). What do those four ship that myIO doesn't? Return 3-5
  concrete gaps, each one sentence: {capability} — {why a data scientist choosing between these
  tools would care}." If `$ARGUMENTS` names a topic focus, scope the question to it.
- **researcher agent** — "Scan the CRAN interactive-viz ecosystem and recent D3/dataviz-ecosystem
  developments for capabilities myIO (an R htmlwidget wrapping D3) doesn't yet have. Return 3-5
  concrete gaps." Same topic-focus scoping if given.

**B. Inbound signal**
```
gh issue list --state open --label enhancement --json number,title,body,createdAt
```
Also try `gh api repos/{owner}/{repo}/discussions --paginate` — skip silently if discussions
aren't enabled on the repo. These are already-articulated asks, not generated ideas; keep them
as a distinct source in the output.

## Step 2 — Dedup against known state

For every candidate from Step 1, grep `md/intake/*-recommendations.md` and any other
`md/intake/*.md` file for existing coverage — SHIPPED, DEFERRED, or OUT-OF-SCOPE entries on the
same capability. Drop matches. Don't re-propose items like C2/C3/C4 that already carry a
documented reason — re-surfacing them without new evidence is noise, not research.

## Step 3 — Triage survivors

For each surviving candidate, run the same evaluation `/feature-request` uses: product-manager +
chief-of-staff + competitive-analyst agents in parallel (scoping agents too, if a "build now"
looks plausible enough to need an effort estimate). Invoke `/feature-request` directly per
candidate when there are few; inline the same agent calls as one batch when triaging many at
once is cheaper. Get one decision per candidate: **Build now / Build after X / Defer / Decline**.

## Step 4 — Write disposition

Every candidate gets one of the three intake dispositions (per the multi-item work intake
protocol) — no silent drops. Prefer GitHub issues as the record; the ledger is only for items
that need gate-tracking:

- **Build now** → for a competitive/ecosystem-sourced idea (no existing issue), `gh issue create`
  with label `enhancement`. For an inbound issue, use it directly. Either way,
  `gh issue edit {n} --add-label backlog-ready` — that label is the approval signal
  `/backlog-pipeline next` scans for; no ledger entry needed.
- **Build after X** → create (or use) the GitHub issue with label `enhancement`, but do *not*
  apply `backlog-ready` yet — the "X" is a real unmet condition. Instead add a new `## DEFERRED`
  entry in `md/intake/*-recommendations.md` referencing the issue number, with the re-entry gate
  being the "X" from triage. Once that gate clears on a future scout pass, apply `backlog-ready`
  to the issue and remove the ledger entry (mirrors `backlog-pipeline`'s own source split).
- **Decline** → no issue for a self-sourced idea with no prior record. For an inbound issue,
  comment with the decline rationale and label `wontfix` rather than closing silently. If the
  idea touches share, export, demo, or collaboration, write the reason it's not MVP explicitly
  (per intake protocol rule 5) rather than defaulting to decline.

## Step 5 — Stop

Report what was sourced, deduped, and dispositioned. Do not run `/design` or otherwise enter the
build pipeline — that boundary belongs to `backlog-pipeline`.

## Output

```
## Idea Scout — {date}

### Sourced
- Competitive/ecosystem: {N candidates}
- Inbound (GitHub): {N candidates}

### Deduped away
- {candidate} — already covered by {ledger entry}

### Triaged
| Idea | Source | Decision | Gate / reason |
|---|---|---|---|
| ... | competitive / inbound | Build now / Build after X / Decline | ... |

### Issues / ledger updated
{N issues created or labeled backlog-ready, N ledger entries added for Build-after-X items}

### Next
`/backlog-pipeline next` picks up any `backlog-ready`-labeled issue on its next run.
```

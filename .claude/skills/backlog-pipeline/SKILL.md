---
name: backlog-pipeline
description: Carry one backlog item — a GitHub issue labeled backlog-ready, or a gate-cleared md/intake/*-recommendations.md entry — through design/implement/code-the-plan/preflight/pr, stopping before version bump or release. Loop-compatible — designed to be the payload a /loop iteration invokes.
argument-hint: "[item-id] | next"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Backlog Pipeline

Carries exactly one backlog item from its source (GitHub issue or ledger entry) to an open PR. Never bumps
`DESCRIPTION` Version, edits the `NEWS.md` release header, runs `/release`, or touches CRAN —
that decision stays the maintainer's call (see `feedback_version_decisions` memory).

## Step 0 — Select the item

Two eligible sources — check both, GitHub issues first (they're pre-cleared by construction):

- **GitHub issues**: `gh issue list --label backlog-ready --state open --json number,title,body`.
  The `backlog-ready` label *is* the approval — a human (or `idea-scout`, after a "Build now"
  triage decision) attached it deliberately, so these need no further gate check. If `$ARGUMENTS`
  names an issue number, use it directly regardless of label (explicit request overrides).
- **Ledger**: `md/intake/*-recommendations.md` entries under `## DEFERRED` headings, in file
  order. Unlike GitHub issues, these carry a stated re-entry gate that must be evaluated (Step 1)
  — use the ledger only for items that genuinely need gate-tracking (uncertain evidence, external
  blockers), not as a place to duplicate an already-labeled issue.
- If `$ARGUMENTS` names a ledger item ID (e.g. `D1`, `C2`, `P4-2`), use it.
- If `$ARGUMENTS` is `next` or empty: try the oldest open `backlog-ready` issue first; if none,
  fall back to the ledger and evaluate gates (Step 1) until one clears.

## Step 1 — Gate check (ledger items only; GitHub issues skip straight to Step 2)

Every deferred ledger item already states a re-entry gate — don't treat elapsed time as having
satisfied it. Read the item's "Re-entry gate" line and classify it:

- **Verifiable now** (e.g. "Branch A merged", "profiling trace showing hover lag ≥50k points",
  "snapshot harness diffing payloads"): actually run the check — grep, read, benchmark, whatever
  the gate names. Record `VERIFIED ✓` or `NOT MET ✗` with the evidence, same rigor as `/design`'s
  Hypothesis Verification gate. Only a `VERIFIED ✓` item is eligible.
- **External/human-gated** (e.g. "needs a real webR session", "owner decision", "own wave —
  decide play/step UX first"): this item cannot be picked up autonomously. Skip it and say so —
  most of this ledger is intentionally blocked on something other than queue position.

If scanning for `next` and nothing clears — no ready-labeled issue, no ledger item with a met
gate — stop and report "no eligible items" rather than force one through. Do not lower a gate's
bar, and do not treat an unlabeled issue as eligible, to manufacture an eligible item.

## Step 2 — Run the chain

Invoke each skill via the Skill tool in order. Do not skip a step or reorder them.

1. **`/design`** — topic is the item's description: for a GitHub issue, its title + body; for a
   ledger item, its description and "Design sketch" line if present. If the ledger references an
   existing design doc, check it actually exists first (ledger entries can reference docs from a
   prior session that were archived or were gitignored session-local intake artifacts) — read and
   reuse it only if present; otherwise design fresh.
2. **`/implement`** — pass the resulting design doc path.
3. **`/code-the-plan`** — pass the resulting plan path.
4. **`/preflight`** — run on the resulting feature branch.
5. **`/pr`** — only if the preflight verdict is "Ready for PR". For a GitHub-issue-sourced item,
   include `Closes #{issue}` in the PR body so merging auto-closes it.

Each step gates the next. If any step fails, or surfaces a blocking gap it can't resolve, stop
and report at that step — don't push a half-verified item into the next stage.

## Step 3 — Update the source

On a successful `/pr`:
- **GitHub issue**: `gh issue edit {n} --remove-label backlog-ready` and leave a comment with the
  PR link. Don't close it — the `Closes #{issue}` in the PR body handles that on merge. Removing
  the label stops it from being re-picked by next week's run while the PR is still open.
- **Ledger item**: edit its entry in `md/intake/*-recommendations.md` — move it out of its
  `## DEFERRED` section into a `## SHIPPED` section (new dated heading if none fits), replacing
  the re-entry-gate note with the PR number and a one-line summary, matching the ledger's
  existing voice and format.

## Step 4 — Stop

Report the PR URL and stop there. Do not touch version/release/CRAN — flag it as the next human
decision, not the next pipeline step.

## Output

```
## Backlog Pipeline — {item-id}

### Gate check
{VERIFIED ✓ / NOT MET ✗ / external-gated, with evidence}

### Pipeline result
- Design: {doc path, or "reused existing" / "not reached"}
- Plan: {doc path, or "not reached"}
- Code: {branch + files touched, or "not reached"}
- Preflight: {verdict, or "not reached"}
- PR: {url, or "not opened — reason"}

### Source updated
{issue: label removed + comment added, or "not reached" / ledger: yes/no + what changed}

### Stopped before
Version bump / `/release` / CRAN submission — maintainer's call.
```

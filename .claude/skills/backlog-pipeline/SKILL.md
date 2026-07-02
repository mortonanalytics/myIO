---
name: backlog-pipeline
description: Carry one deferred backlog item from md/intake/*-recommendations.md through research/design/implement/code-the-plan/preflight/pr, stopping before version bump or release. Loop-compatible — designed to be the payload a /loop iteration invokes.
argument-hint: "[item-id] | next"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Backlog Pipeline

Carries exactly one deferred backlog item from its ledger entry to an open PR. Never bumps
`DESCRIPTION` Version, edits the `NEWS.md` release header, runs `/release`, or touches CRAN —
that decision stays the maintainer's call (see `feedback_version_decisions` memory).

## Step 0 — Select the item

- If `$ARGUMENTS` names an item ID (e.g. `D1`, `C2`, `P4-2`), use it.
- If `$ARGUMENTS` is `next` or empty, scan `md/intake/*-recommendations.md` for entries under
  `## DEFERRED` headings, in file order, and evaluate each one's re-entry gate (Step 1) until
  one passes.

## Step 1 — Gate check (mandatory, blocking)

Every deferred item in this ledger already states a re-entry gate — don't treat elapsed time as
having satisfied it. Read the item's "Re-entry gate" line and classify it:

- **Verifiable now** (e.g. "Branch A merged", "profiling trace showing hover lag ≥50k points",
  "snapshot harness diffing payloads"): actually run the check — grep, read, benchmark, whatever
  the gate names. Record `VERIFIED ✓` or `NOT MET ✗` with the evidence, same rigor as `/design`'s
  Hypothesis Verification gate. Only a `VERIFIED ✓` item is eligible.
- **External/human-gated** (e.g. "needs a real webR session", "owner decision", "own wave —
  decide play/step UX first"): this item cannot be picked up autonomously. Skip it and say so —
  most of this ledger is intentionally blocked on something other than queue position.

If scanning for `next` and nothing clears its gate, stop and report "no eligible items" rather
than force one through. Do not lower a gate's bar to make an item eligible.

## Step 2 — Run the chain

Invoke each skill via the Skill tool in order. Do not skip a step or reorder them.

1. **`/design`** — pass the item's ledger description and "Design sketch" (if the ledger has one)
   as the topic. If the ledger references an existing design doc, check it actually exists first
   (ledger entries can reference docs from a prior session that were archived or were gitignored
   session-local intake artifacts) — read and reuse it only if present; otherwise design fresh.
2. **`/implement`** — pass the resulting design doc path.
3. **`/code-the-plan`** — pass the resulting plan path.
4. **`/preflight`** — run on the resulting feature branch.
5. **`/pr`** — only if the preflight verdict is "Ready for PR".

Each step gates the next. If any step fails, or surfaces a blocking gap it can't resolve, stop
and report at that step — don't push a half-verified item into the next stage.

## Step 3 — Update the ledger

On a successful `/pr`, edit the item's entry in `md/intake/*-recommendations.md`: move it out of
its `## DEFERRED` section into a `## SHIPPED` section (new dated heading if none fits), replacing
the re-entry-gate note with the PR number and a one-line summary of what shipped, matching the
existing ledger's voice and format.

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

### Ledger updated
{yes/no + what changed}

### Stopped before
Version bump / `/release` / CRAN submission — maintainer's call.
```

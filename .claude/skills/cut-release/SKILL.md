---
name: cut-release
description: Bump version (semver-computed from what's actually merged), finalize NEWS.md, run the full CRAN-readiness gate, build the tarball, tag and create the GitHub Release. Stops before the actual CRAN upload/email confirmation — that step needs the maintainer. Designed for scheduled one-time invocation.
argument-hint: "(no arguments — always re-derives scope from git state at run time)"
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
---

# Cut Release

Takes myIO from "changes staged in NEWS.md as (development version)" to a tagged GitHub Release
with a CRAN-ready tarball. Does **not** run `devtools::submit_cran()` or upload to
`cran.r-project.org/submit.html` — CRAN's own process requires a human to click an email
confirmation link, so full automation stops one step short of that by construction.

## Step 1 — Re-derive scope (don't trust a stale snapshot)

- `git tag --sort=-v:refname | head -1` — last released tag (e.g. `v1.2.0`).
- `git log {last_tag}..HEAD --oneline --no-merges` — everything merged since, including anything
  `backlog-pipeline`/`idea-scout` landed after this skill was written. Read every commit.
- Read current `NEWS.md`'s `# myIO (development version)` section. Cross-check every commit above
  against it — if a merged PR isn't reflected in NEWS.md, add an entry for it (match the existing
  section style: New features / Performance and tooling / etc.) before proceeding. Don't ship a
  release with undocumented changes.

## Step 2 — Determine the version bump

Per `docs/versioning-policy.md`: Patch = bug fixes/no API change, Minor = new features/backward
compatible, Major = removed deprecated APIs or unavoidable breaking changes.

- Default assumption: **minor** (everything shipped via `backlog-pipeline` so far has been
  additive/backward-compatible by design — see `feedback_animation_optout` and the versioning
  policy's backward-compatibility guarantee).
- Actually check: grep the NEWS.md entries gathered in Step 1 for anything that removed a
  deprecated function past its sunset window, changed a default in a breaking way, or otherwise
  reads as breaking. If found, this is **major**, not minor — stop and flag it prominently in the
  output rather than silently picking minor; a wrong major/minor call is a real compatibility
  break for users pinned to `^1.x`.
- Compute the number from current `DESCRIPTION` `Version:` (read fresh, don't assume `1.2.0` —
  more time may have passed than expected).

## Step 3 — Update DESCRIPTION and NEWS.md

- `DESCRIPTION`: bump `Version:` to the computed number.
- `NEWS.md`: replace the `# myIO (development version)` header with `# myIO {version}` (no date
  in the header per this project's existing NEWS.md convention — check recent released sections
  for the exact format and match it).

## Step 4 — Run the CRAN-readiness gate

Invoke the **cran-submission-expert agent** (or run the `cran-submit` skill's gate checklist
directly) covering all 6 gates: metadata, documentation, `R CMD check --as-cran`, cran-comments.md,
package differentiation, final checks. Get a verdict.

- **NOT READY**: stop here. Do not commit, tag, or create anything. Report exactly which gates
  failed and why — leave `DESCRIPTION`/`NEWS.md` changes uncommitted in the working tree so the
  next session can see and fix them (don't discard the work, don't ship it broken either).
- **READY**: continue.

## Step 5 — Build, verify, commit, tag, release

1. `R CMD build . --no-manual` then `R CMD check --as-cran` on the resulting tarball — confirm
   0 errors / 0 warnings, and every NOTE is one already documented in `cran-comments.md`.
2. Commit `DESCRIPTION` + `NEWS.md` directly to `main` (not a feature branch — this is a release
   commit, matching how prior releases in this repo were tagged directly on main).
3. `git tag -a v{version} -m "Release v{version}"` and `git push origin main --tags`.
4. `gh release create v{version}` with notes drawn from the finalized NEWS.md section (customer-
   facing summary), following the format `/release` already uses.

## Step 6 — Stop, hand off the actual submission

Report the release URL and the tarball path. Explicitly state: CRAN submission
(`devtools::submit_cran()` or the web form) and the resulting email confirmation are manual —
next action is the maintainer's, not this skill's.

## Output

```
## Cut Release — v{version}

### Scope re-derived
{commits since last tag, any NEWS.md gaps found and filled}

### Version bump
{minor/major, with rationale — flag prominently if major}

### CRAN-readiness gate
{READY / NOT READY, per-gate detail}

### Result
- Tarball: {path}, R CMD check: {0/0/N}
- Tag: v{version}
- GitHub Release: {url}

### Still needs you
CRAN submission (devtools::submit_cran() / cran.r-project.org/submit.html) + the confirmation
email CRAN sends — not automatable, not attempted.
```

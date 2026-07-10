---
name: cran-submit
description: End-to-end CRAN submission workflow for myIO — pre-checks, fix cycles, tarball build, cran-comments.md, and resubmission handling. Use when preparing to submit or resubmit to CRAN, or when you receive CRAN reviewer feedback.
---

# CRAN Submission Skill

Prepare myIO for CRAN submission. This is a gated checklist — every gate must pass before proceeding to the next.

## Gate 1: Version & metadata

- [ ] DESCRIPTION Version matches `$0` (if provided) or is correct for this release
- [ ] DESCRIPTION Title is in Title Case (no period at end)
- [ ] DESCRIPTION Description is ≥1 sentence, doesn't start with "This package" or package name, ends with period
- [ ] Authors@R uses `person()` format with valid roles (aut, cre, ctb)
- [ ] License field matches LICENSE/LICENSE.md files
- [ ] URL and BugReports fields are present and valid
- [ ] SystemRequirements mentions D3.js if needed

Read: `DESCRIPTION`, `LICENSE`, `LICENSE.md`

## Gate 2: Documentation completeness

- [ ] `roxygen2::roxygenise()` runs without errors
- [ ] Every exported function (check NAMESPACE) has a man page
- [ ] Every man page for exported functions has: `\title{}`, `\description{}`, `\arguments{}` (all params), `\value{}`, `\examples{}`
- [ ] Shiny functions (myIOOutput, renderMyIO) have examples in `\dontrun{}`
- [ ] No broken `\link{}` or `\href{}` references
- [ ] Package-level man page (`man/myIO-package.Rd` or `man/myIO.Rd`) exists

Read: `NAMESPACE`, then spot-check 5+ man/ files. Grep for missing `\value` and `\examples` sections.

## Gate 3: R CMD check

- [ ] Run `R CMD build . --no-manual && R CMD check --as-cran myIO_*.tar.gz`
- [ ] 0 errors
- [ ] 0 warnings
- [ ] All NOTEs documented — list each one

If check fails, stop and report. Do not proceed to Gate 4.

## Gate 4: cran-comments.md

- [ ] File exists at project root
- [ ] Lists test environments (at least 2: e.g., macOS + Ubuntu, or local + GHA)
- [ ] States check results: "0 errors | 0 warnings | N notes"
- [ ] Every NOTE from Gate 3 is explained
- [ ] If new submission: states "This is a new submission"
- [ ] If resubmission: states what changed since last submission
- [ ] Mentions bundled D3.js JavaScript and its size

Read: `cran-comments.md`

## Gate 5: Package differentiation

- [ ] DESCRIPTION Description clearly states what makes myIO different (composable statistical transforms, not just charts)
- [ ] cran-comments.md or cover letter explains differentiation from plotly, highcharter, echarts4r, r2d3
- [ ] At least one vignette demonstrates the statistical transform pipeline (the key differentiator)

## Gate 6: Final checks

- [ ] `devtools::spell_check()` — no real typos (technical terms are fine)
- [ ] No files that should be in .Rbuildignore (node_modules, screenshots, scripts/, etc.)
- [ ] Package tarball size <5MB
- [ ] NEWS.md is up to date for this version
- [ ] Git working tree is clean (all changes committed)

## Output

Produce a submission readiness report:

```
## myIO v[X.Y.Z] CRAN Submission Readiness

### Gate Results
- Gate 1 (Metadata): ✓ PASS / ✗ FAIL [details]
- Gate 2 (Documentation): ✓ PASS / ✗ FAIL [details]
- Gate 3 (R CMD check): ✓ PASS / ✗ FAIL [details]
- Gate 4 (cran-comments): ✓ PASS / ✗ FAIL [details]
- Gate 5 (Differentiation): ✓ PASS / ✗ FAIL [details]
- Gate 6 (Final): ✓ PASS / ✗ FAIL [details]

### Verdict
READY TO SUBMIT / NOT READY — [N] gates failed

### Next Steps
[If ready]: Run `devtools::submit_cran()` or upload at https://cran.r-project.org/submit.html
[If not ready]: Fix list in priority order
```

## Resubmission flow

When `$0 = resubmit` or `$0 = feedback "..."`:

1. **Parse CRAN feedback.** Ask the user to paste the reviewer email, or read from a file path if provided. Invoke the **cran-submission-expert agent** with the feedback text to classify each issue as hard-blocker vs soft suggestion.

2. **Fix each issue.** For each hard-blocker the agent identifies:
   - Apply the recommended code/documentation fix
   - Re-run the relevant gate (e.g., if documentation issue → re-run Gate 2 and Gate 3)
   - Verify the fix resolves the NOTE/WARNING

3. **Re-run Gate 3** (full R CMD check). All previous gates must still pass.

4. **Update cran-comments.md** — add a `## Resubmission` section:
   ```
   ## Resubmission
   This is a resubmission. In this version I have:
   - {quote reviewer request → describe fix}
   - {quote reviewer request → describe fix}
   ```
   Do not overwrite prior resubmission sections; append as round N+1 if needed.

5. **Increment patch version** if the reviewer feedback required code changes (not just docs).

6. **Rebuild tarball** and verify it passes check.

7. Present the resubmission package to the user.

## Expert agent integration

When Gate 3 fails or produces NOTEs that are ambiguous, invoke the **cran-submission-expert agent** with the full `R CMD check` output. The agent classifies each NOTE as:
- **Hard blocker** — will cause rejection (fix before submitting)
- **Soft note** — acceptable if documented in cran-comments.md
- **False positive** — can be ignored (but still document in cran-comments.md)

Apply the agent's recommended fixes, then re-run Gate 3.

## Rules

- Never submit to CRAN automatically. Present the package and let the user submit.
- CRAN reviewers are volunteers — cran-comments.md should be concise and directly address their points.
- If R CMD check fails, do NOT proceed past Gate 3.
- Track resubmission rounds: if cran-comments.md already has a Resubmission section, this is round N+1.
- Always check that the version number is > the current CRAN version before submitting.
- Versioning must follow the policy in CLAUDE.md — strict semver, 2-year deprecation window.

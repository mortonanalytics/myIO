---
name: cran-review
description: Simulate a CRAN reviewer evaluating myIO for acceptance. Adversarial review that flags rejection risks before you submit.
---

# CRAN Review Simulation

Simulate a CRAN volunteer reviewer evaluating myIO for acceptance. Perform the review directly or use a read-only review subagent when explicitly requested.

## Instructions

1. Read the core package files:
   - `DESCRIPTION`
   - `NAMESPACE`
   - `cran-comments.md`
   - 5 random man/ pages for exported functions
   - `inst/` directory listing
   - `.Rbuildignore`

2. If `$ARGUMENTS` specifies a focus area, weight that area more heavily but still review everything.

3. If R CMD check output exists in `myIO.Rcheck/00check.log`, read it. Otherwise note that check hasn't been run.

4. Delegate to the `cran-reviewer` agent with all gathered context.

5. Return the simulated reviewer email and detailed findings.

## When to use

- Before running `/cran-submit` — catch issues early
- After fixing issues from a previous `/cran-review` — verify fixes
- When unsure if the package differentiation story is strong enough
- After major changes to documentation or exports

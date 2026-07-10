---
name: cran-check
description: Run R CMD check --as-cran on the myIO package, parse the output, and map each ERROR/WARNING/NOTE to a concrete fix
---

# CRAN Check Skill

Run `R CMD check --as-cran` on the myIO package and produce an actionable report.

## Process

1. **Clean and rebuild documentation**
   ```
   Rscript -e 'roxygen2::roxygenise()'
   ```

2. **Build the package**
   ```
   R CMD build . --no-manual
   ```

3. **Run the check** with any flags from `$ARGUMENTS`
   ```
   R CMD check --as-cran myIO_*.tar.gz
   ```
   If `$ARGUMENTS` includes flags like `--no-examples`, `--no-vignettes`, or `--no-tests`, append them.

4. **Parse the output** — Read `myIO.Rcheck/00check.log` and categorize every finding:

   For each ERROR:
   - **Check**: which check failed (e.g., "checking examples ... ERROR")
   - **Message**: exact error text
   - **File**: the R/, man/, or vignettes/ file causing it
   - **Fix**: concrete edit to resolve it
   - **Priority**: P0 — must fix before submission

   For each WARNING:
   - Same format, Priority P1

   For each NOTE:
   - Same format, Priority P2
   - **cran-comments.md**: whether this NOTE is already explained, and if the explanation is sufficient

5. **Update cran-comments.md** — If any NOTEs are legitimate (e.g., "New submission", "installed size"), draft the explanation to add.

6. **Summary** — Total errors/warnings/notes, comparison to previous run if available, and next steps.

## After the check

- Clean up: remove `myIO_*.tar.gz` and `myIO.Rcheck/` directory
- If 0 errors and 0 warnings: report ready status and list any NOTEs that need cran-comments.md updates
- If errors or warnings: prioritize fixes and offer to apply them

## Important

- Never skip or suppress check output — show everything
- If examples are slow, suggest `\donttest{}` wrapping rather than `--no-examples`
- If vignettes fail, check for internet dependencies or missing Suggests packages
- The goal is 0 errors | 0 warnings | N notes (all explained)

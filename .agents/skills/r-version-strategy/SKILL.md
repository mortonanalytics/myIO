---
name: r-version-strategy
description: Document and enforce R package versioning strategy for myIO. Covers semantic versioning, backward compatibility policy, deprecation schedules, and CRAN constraints. Use when planning a release, deprecating a function, or documenting versioning decisions.
---

Manage the versioning and deprecation strategy for the myIO R package. Ensures version bumps are intentional, backward compatibility is handled, and deprecation gives users adequate notice.

## Arguments

$ARGUMENTS — one of:
- (empty) — review current versioning state and recommend next version
- `bump {major|minor|patch}` — prepare a version bump with changelog
- `deprecate {function_name}` — set up deprecation for a function (2-year schedule)
- `audit` — check all deprecated functions and their timeline status
- `document` — generate/update the versioning strategy doc

## Versioning rules (myIO-specific)

- **Semantic versioning**: MAJOR.MINOR.PATCH
  - MAJOR: breaking changes to exported API (function removed, argument renamed, return type changed)
  - MINOR: new features, new exported functions, non-breaking enhancements
  - PATCH: bug fixes, documentation, internal-only changes
- **CRAN constraints**: version must be > current CRAN version; no more than 1 submission per month unless fixing a critical bug
- **Backward compatibility**: breaking changes require a 2-year deprecation period with `.Deprecated()` warnings before removal
- **Dev versions**: use `.9000` suffix for development (e.g., `1.2.0.9000`)

## Deprecation workflow

When `$ARGUMENTS = deprecate {function_name}`:

1. **Verify the function exists and is exported.** Read `NAMESPACE` and the function source.

2. **Create the deprecation wrapper:**
   ```r
   #' @rdname myIO-deprecated
   #' @export
   old_function <- function(...) {
     .Deprecated("new_function", package = "myIO",
       msg = "old_function() was deprecated in myIO {current_version} and will be removed in myIO {current_version + 2 major}. Please use new_function() instead.")
     new_function(...)
   }
   ```

3. **Update documentation:**
   - Add `\lifecycle{deprecated}` badge to the man page
   - Update `myIO-deprecated.Rd` with the function
   - Add entry to NEWS.md: `* `old_function()` is now deprecated in favor of `new_function()`. It will be removed in myIO {version}.`

4. **Record the deprecation schedule:**
   - Create or update `inst/deprecation-schedule.csv`:
     ```
     function,deprecated_in,remove_after,replacement,deprecated_date
     old_function,1.2.0,3.2.0,new_function,2026-04-15
     ```
   - The `remove_after` version = current MAJOR + 2 (2-year rule at ~1 major/year cadence)

5. **Add a test** that the deprecated function still works (calls the replacement) and emits the warning:
   ```r
   test_that("old_function is deprecated but functional", {
     expect_warning(old_function(...), "deprecated")
     expect_equal(suppressWarnings(old_function(...)), new_function(...))
   })
   ```

## Version bump workflow

When `$ARGUMENTS = bump {level}`:

1. **Check current version** in DESCRIPTION.
2. **Determine new version** based on `{level}` (major/minor/patch).
3. **Audit deprecation schedule**: if bumping MAJOR, check `inst/deprecation-schedule.csv` for functions past their `remove_after` version. List them for removal.
4. **Update DESCRIPTION** version field.
5. **Update NEWS.md** with a new section header for the version.
6. **Update `cran-comments.md`** if it exists (clear prior resubmission notes).
7. **Stage changes** but do not commit. Report what changed.

## Audit workflow

When `$ARGUMENTS = audit`:

1. Read `inst/deprecation-schedule.csv`.
2. Read current version from DESCRIPTION.
3. For each deprecated function:
   - Is it still in the codebase? (grep for it)
   - Is the `.Deprecated()` call present?
   - Is the deprecation warning test present?
   - Is the `remove_after` version past the current version? If yes, flag for removal.
4. Report:

```
# Deprecation Audit — myIO {version}

| Function | Deprecated in | Remove after | Replacement | Status |
|----------|---------------|--------------|-------------|--------|
| old_fn   | 1.2.0         | 3.2.0        | new_fn      | ⏳ Active (remove in 3.2.0) |
| other_fn | 0.9.0         | 2.9.0        | better_fn   | ⚠️ Past removal date — remove now |
```

## Document workflow

When `$ARGUMENTS = document`:

Generate `vignettes/versioning-strategy.Rmd` (or update if exists) covering:
- Semantic versioning policy
- Backward compatibility commitment
- Deprecation timeline (2 years)
- How users should respond to deprecation warnings
- Where to find the deprecation schedule

## Rules

- Never remove a deprecated function without checking the deprecation schedule. The 2-year window is a commitment to users.
- Always update `inst/deprecation-schedule.csv` when deprecating — it's the machine-readable source of truth.
- When bumping MAJOR, proactively check for removable deprecated functions. Don't leave dead code.
- CRAN requires version > current published version. Check `available.packages()` before bumping.
- Dev versions (`.9000`) should not be submitted to CRAN.

## Input

$ARGUMENTS

# AGENTS.md — myIO

Guidance for AI coding agents (Claude Code, Codex, etc.) working in this
repo. Read this before editing anything under `inst/htmlwidgets/myIO/`.

## This repo owns the engine

`inst/htmlwidgets/myIO/myIOapi.js` and `style.css` are the canonical d3
engine. They are consumed by **two** wrappers:

- **myIO** (this repo) — R package, htmlwidget binding.
- **pymyIO** (`../pymyIO` locally, `mortonanalytics/pymyIO` on GitHub) —
  Python package. Pulls this repo in as a git submodule at
  `vendor/myIO/` and symlinks to
  `inst/htmlwidgets/myIO/{myIOapi.js,style.css}`.

That means every JS/CSS change you make here is a change to **both**
packages’ runtime, even if only the R tests exercise it in this repo.

## Hard rules

1.  **Breaking JS changes require a paired pymyIO update.** If you
    rename, remove, or change the contract of a config key, layer
    option, event name, or traitlet surface in `myIOapi.js`, the Python
    builder in pymyIO must be updated in lockstep. Options:

    - Ship the R-side change here, then immediately open a pymyIO PR
      that bumps the submodule pointer and updates the Python surface.
    - Or: stage both changes together before either lands.

    Do **not** land a breaking engine change here without flagging it —
    pymyIO’s next submodule bump will silently break its users.

2.  **Additive changes are safer but not free.** New chart types, new
    optional kwargs, new event channels are still features pymyIO will
    want to expose. Note them in the commit message so the pymyIO-side
    agent knows what to surface on the next bump.

3.  **CRAN comes first, but don’t pessimize pymyIO.** `main` is the CRAN
    submission target (per user policy). When resolving a CRAN NOTE by
    deleting or refactoring engine code, check whether pymyIO relies on
    what you’re removing before you remove it. Grep `../pymyIO/src/` if
    the local checkout is present.

4.  **Versioning applies to the engine too.** This package follows
    strict semver (see `docs/versioning-policy.md` and `CLAUDE.md`). A
    breaking JS change is a breaking change for both R and Python
    consumers and gates on a major version bump — don’t slip one into a
    patch release.

## Workflow cheatsheet

| You want to… | Do this |
|----|----|
| Fix a d3 rendering bug | Edit `inst/htmlwidgets/myIO/myIOapi.js` here; note in commit whether pymyIO needs to bump |
| Add a new chart type | Engine change here → commit → tell pymyIO to bump + add Python builder surface |
| Rename a config key | Breaking change — coordinate with pymyIO before merging; bump major |
| Change R-only behavior (R/\*.R) | Safe; no pymyIO coordination needed |

## Cross-repo sync automation

Two workflows keep myIO and pymyIO in sync:

- **This repo** — `.github/workflows/engine-bump-notify.yaml` opens a
  tracking issue in pymyIO on every push to `main` that touches
  `inst/htmlwidgets/myIO/**`. Requires repo secret `PYMYIO_SYNC_TOKEN`:
  a fine-scoped PAT with `issues: write` on `mortonanalytics/pymyIO`. If
  the secret is missing the workflow no-ops (warns in logs).
- **pymyIO** — `.github/workflows/engine-bump-close.yaml` auto-closes
  tracking issues whose upstream SHA is now an ancestor of the current
  submodule HEAD. Uses the default `GITHUB_TOKEN`; no extra setup.

**Classifying a commit:** include `[engine-breaking]` or
`[engine-additive]` in the commit subject to pre-classify the tracking
issue. Default is `engine-additive`.

## Preflight for agents

**At session start, run:**

    gh issue list --repo mortonanalytics/pymyIO --label engine-bump-pending

Any open issues there are prior myIO engine changes that pymyIO hasn’t
picked up yet. Not your job to fix from this repo, but worth knowing: if
the user asks you to ship another engine change, those pending bumps
will stack up on the pymyIO side.

Before any change to `inst/htmlwidgets/myIO/`, answer in one sentence:
**“Is this change visible to a Python consumer?”** If yes, flag it in
the PR description so the pymyIO side can pick it up on the next
submodule bump. A GitHub Action auto-opens a tracking issue in pymyIO on
merge to `main` when `inst/htmlwidgets/myIO/**` is touched — use PR
labels `engine-breaking` or `engine-additive` to pre-fill the checklist.
See `../pymyIO/AGENTS.md` for the mirror-image rules on that side.

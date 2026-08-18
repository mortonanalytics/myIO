---
name: backlog-pipeline
description: Carry one human-approved myIO package issue through test-first implementation, package checks, and an unmerged PR without releasing or submitting to CRAN. Use for scheduled myIO backlog work.
---

# myIO backlog pipeline

Require `backlog-ready`, non-red `main`, no open `automation-pr`, and an isolated worktree. Evaluate every gate against remote state, never the local checkout: run `git fetch origin` first, and answer any merged/landed/shipped question with `git merge-base --is-ancestor <sha> origin/main` or `gh pr view <n> --json state` reporting `MERGED` — a commit appearing in bare `git log` proves nothing about `main`, because an unattended run may start on an unmerged feature branch. Before the intake gate, clear dependabot: squash-merge and delete the branch for every open pull request authored by `app/dependabot` that reports `MERGEABLE`, a `CLEAN` merge state, and `SUCCESS` on every check, then re-fetch so the worktree branches off the updated remote. Leave every other pull request alone — a dependabot pull request that is failing, pending, conflicted, or behind stays open for a human, and an `automation-pr` is never merged by this pipeline. Report what merged, and treat merging dependency updates as real work: an otherwise empty run that merged a pull request did not no-op.

Process one issue. Add a failing R, JavaScript, MCP, or integration contract before implementation as appropriate. Preserve myIO as the canonical engine and coordinate wrapper-visible behavior with pymyIO.

Run focused tests plus the repository's package, JavaScript, MCP, and documentation checks applicable to the change. Open one PR labeled `automation-pr` with provenance, `Closes #N`, commands/results, downstream compatibility risks, and unrun external gates. Stop before version bump, release, publication, or CRAN submission.

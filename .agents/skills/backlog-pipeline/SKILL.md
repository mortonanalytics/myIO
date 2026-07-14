---
name: backlog-pipeline
description: Carry one human-approved myIO package issue through test-first implementation, package checks, and an unmerged PR without releasing or submitting to CRAN. Use for scheduled myIO backlog work.
---

# myIO backlog pipeline

Require `backlog-ready`, non-red `main`, no open `automation-pr`, and an isolated worktree. Process one issue. Add a failing R, JavaScript, MCP, or integration contract before implementation as appropriate. Preserve myIO as the canonical engine and coordinate wrapper-visible behavior with pymyIO.

Run focused tests plus the repository's package, JavaScript, MCP, and documentation checks applicable to the change. Open one PR labeled `automation-pr` with provenance, `Closes #N`, commands/results, downstream compatibility risks, and unrun external gates. Stop before version bump, release, publication, or CRAN submission.

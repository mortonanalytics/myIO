---
name: idea-scout
description: Research myIO package, chart-engine, MCP, CRAN, compatibility, and performance opportunities and create evidence-backed research candidates. Use for scheduled myIO scouting or inbound enhancement triage.
---

# myIO idea scout

Read current package code, CRAN state, open issues, recent PRs, pymyIO compatibility constraints, and current primary dependency or ecosystem sources. Deduplicate every finding and propose the smallest testable change. Verify any "already shipped/merged" claim against the remote, never the local checkout: `git fetch origin` first, then `git merge-base --is-ancestor <sha> origin/main` or `gh pr view <n> --json state` — bare `git log`, `HEAD`, or a commit merely existing locally is not evidence of shipping.

Creating `research-candidate` issues is pre-authorized — file them without asking, including on scheduled runs where no human is present to answer. Each issue carries sources, current gap, user value, compatibility impact, validation plan, and provenance. Ending a run with candidates described but unfiled is a failed run: the backlog pipeline reads issues, not logs.

Apply `backlog-ready` yourself to any candidate that clears all four bars, on scheduled runs as well as supervised ones. A candidate clears when: its evidence is verified against remote state and cited as a command or `file:line` another person can re-run; the issue names a smallest testable change that begins with a failing test; the change needs no R signature change, no change to existing default behavior, no version bump, and no release or CRAN step; and its scope is one issue bounded to the files it names. Miss any bar and the issue stays `research-candidate` only — an unlabeled candidate waiting for Ryan is a correct outcome, and labeling a candidate you could not fully verify is worse than filing nothing. State per issue which call you made and why, so a failed bar is auditable rather than silent.

Never modify code, bump a version, or begin a release. Those stay with Ryan.

---
name: idea-scout
description: Research myIO package, chart-engine, MCP, CRAN, compatibility, and performance opportunities and create evidence-backed research candidates. Use for scheduled myIO scouting or inbound enhancement triage.
---

# myIO idea scout

Read current package code, CRAN state, open issues, recent PRs, pymyIO compatibility constraints, and current primary dependency or ecosystem sources. Deduplicate every finding and propose the smallest testable change. Verify any "already shipped/merged" claim against the remote, never the local checkout: `git fetch origin` first, then `git merge-base --is-ancestor <sha> origin/main` or `gh pr view <n> --json state` — bare `git log`, `HEAD`, or a commit merely existing locally is not evidence of shipping.

When GitHub mutation is authorized, create `research-candidate` issues with sources, current gap, user value, compatibility impact, validation plan, and provenance. Never apply `backlog-ready`, modify code, bump a version, or begin a release.

# Field tracking trial with CAGE

The trial adds `field` to the R API, renderer registry, schema and production bundle.
The example uses the frozen Metrica clip and two independent widgets. Founder
walkthrough and comparison remain pending.

## Contract

Required mappings: `x_var`, `y_var`, `time`, `entity`. Optional mappings: `team`,
`label`, `kind`. Coordinates are numeric meters and time is numeric seconds.
`kind = "ball"` renders the ball. Options: `pitchLength = 105`, `pitchWidth = 68`,
`maxGap = 0.5`, and `events` (records containing time/type/player and optional
team/subtype/target). Invalid dimension/gap options use their defaults.

Interpolation is linear within one identity between finite observations no more
than `maxGap` seconds apart. Missing/nonfinite coordinates and duplicate
identity/time observations break positions and trails. Missing IDs and nonfinite
timestamps are excluded. There is no extrapolation. Team and label metadata use
the first observation for an identity. Selection uses the entity identifier, independent of row order.
Replacing data resets playback and selection; resize preserves them.

Timeline seeking pauses playback. Frame buttons navigate sampled timestamps;
playback advances by elapsed time and speed. Play at the final timestamp restarts.
Event buttons seek exact times and highlight the most recent event. At equal
timestamps the last event receives the highlight; all remain clickable. Short
numeric marker labels keep mobile text legible; selection and tooltips retain
full labels. Export behavior beyond browser rendering has not been verified.

This engine addition is visible to Python consumers. pymyIO needs the new type,
mappings and options exposed on its next submodule update. No Python repository,
release, push or publication is part of this branch.

## Verification and corrections

- `npm run schema` and `npm run build`: passed.
- Full JS regression: 67 files, 724 tests passed.
- Focused JS contracts: three files, nine tests passed.
- Full R regression: 1524 passed, three existing DuckDB-fixture skips, no warnings.
- Eight production-bundle field browser tests and four existing keyframe tests passed.
  Field tests cover real mapped coordinates, independent
  widgets, playback and end state, seek, keyboard, selection, trails, events,
  filtering, resize, reduced motion, replacement, removal and destruction.
- The first browser tests missed a scrub defect: pause repainted the slider before
  its value was read. The exact-coordinate test failed on that defect. Snapshotting
  the value before pause fixes it; keyboard ArrowRight has its own assertion.
- Native slider arrows were also intercepted by the chart keyboard navigator.
  Field controls now stop keydown propagation while preserving native behavior.
- Independent review found field playback surviving a same-label change to point.
  Field disposal now checks the routed type and label, with a public updateChart test.
- Independent review found missing JS column validation. Field contract validation
  now rejects unknown mapping columns and nonnumeric values while retaining missing
  observations. Browser tests exercise error events and removal of field marks.
- Mobile review found excess card height and tiny labels. The demo now measures
  content height; browser tests check height and rendered label size. Screenshots
  are retained locally in `.cage/mobile-after.png` and `.cage/desktop-after.png`.

Desktop-to-mobile exploration was rechecked at 250, 500 and 1000 ms after resize:
page width remained 390 px. The demo also caps the outer SVG width during the
chart resize debounce. A regression covers this transition and public resize,
including retained player selection and timeline position. A subsequent visual
review caught vertically clipped content despite the width check passing. The
demo now measures unscaled HTML offsetHeight and refits after chart resize; its
content uses natural height without an internal vertical scroll container.
Tests cover fresh 390 px pages and desktop-to-mobile transitions, requiring
controls, the complete pitch and events inside both cards, with zero internal
vertical scroll and bounded card height. Both resulting screenshots were inspected.

## CAGE record

Consultation `cb8a32f1d1a6cc8a9c32906f29337706817994b197352aa6e56ccefc9eddd06e`
used v1 of identity-preserving-reconciliation, resource-owned-lifecycle,
single-owner-sequence-controller and validated-extension-registry. The first
broad request also returned unrelated transaction/API patterns; an explicit
pattern list narrowed the second consultation. Those unrelated obligations were
not claimed as implemented.

Local adaptations retain myIO's renderer registry, SVG/HTML controls, identity
mapping, timestamp interpolation and stop-at-end policy. CAGE supplied metacode
and invariants; the agent authored and tested the implementation. Shared sources
include d3-selection v3.0.0 (ISC) and myIO lifecycle/registry implementations (MIT).
No external implementation was copied. Conformance and generalized learning
receipts are kept in this worktree's `.cage` directory. `patterns check` returned
`conformant` against the current artifact hashes, based on agent-reported evidence;
`application_verified` remains false.

The verified seek defect produced an additive sequence-controller invariant:
capture navigation input before callbacks can repaint its control. CAGE promoted
version 2, hash `481674806f5bdd254cc615136468e6eabcf4a01110d5b998dcc916bc41c17e38`,
observation `field-trial-capture-navigation-20261024-2`. The first observation was
rejected because review notes were placed in the unresolved-findings field. A
second request with an explicit reviewer and no unresolved findings was promoted.
No project source content or private data was submitted.

## Requirement coverage

| Intake | Disposition | Result |
|---|---|---|
| FTR-001 | Scheduled: F01 | Native real-data field chart implemented; walkthrough pending |
| FTR-002 | Scheduled: F02 | Playback, timeline, frame step and speed implemented |
| FTR-003 | Scheduled: F02 | Selection, trails, labels, teams and events implemented |
| FTR-004 | Scheduled: F01/F03 | R/JS/schema integration, accessibility and lifecycle checks |
| FTR-005 | Scheduled: F03 | Unit, R and production-bundle browser tests |
| FTR-006 | Scheduled: F04 | Branch demo ready; coordinator owns servers and comparison |
| FTR-007 | Scheduled: F05 | Coordinator owns conditional tactical feature request |

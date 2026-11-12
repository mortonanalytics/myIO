# Field tracking chart: common trial specification

Both implementations start from the same commit, input data and specification. The independent agents receive the same references and local tools. No code or tests may be copied from the other variant. CAGE assistance is the experimental difference. All FTR intake requirements remain Scheduled.

## Feature contract

Add an additive native myIO chart type `field`, available through the existing `addIoLayer` R API and JavaScript engine/schema/MCP contract. It must use the production bundle. Existing chart behavior and APIs remain compatible. The feature is visible to pymyIO consumers; record `[engine-additive]` and the new mappings in implementation notes, without editing pymyIO or publishing anything.

A 2D soccer pitch displays both teams and ball from the committed real clip. Preserve the 105×68 physical aspect ratio and top-left coordinate origin. Pitch markings, player labels, selected-player state, trails and a readable time display must remain coherent after resize. Use chart-local state so two widgets can run independently.

Required mappings: `x_var`, `y_var`, `time`, `entity`. Optional mappings: `team`, `label`, `kind` (player/ball). Data is long-form rows, with timestamps in seconds and x/y in meters. Support the supplied raw column names through mappings instead of hardcoding them. Renderer options carry pitch dimensions and event data; document the exact options. Reuse existing theme/tooltip/event conventions where they fit.

Interactions:

- Play/pause (accessible button label switches between `Play` and `Pause`), reset (`Reset`), previous/next sampled frame (`Previous frame`, `Next frame`). Playback speed selector labeled `Playback speed`, offering at least 0.5×, 1× and 2×.
- Timeline range input labeled `Timeline`, with time values in seconds. Seeking must update players, ball, selected trails, event state and time display immediately; playback must advance by timestamp, not by arbitrary per-frame dwell. Playback stops coherently at the end.
- Select a player from a control labeled `Player` and by clicking its marker. Show a distinct selected state and useful tooltip. Toggle labels and team visibility. A trail-length control labeled `Trail length` controls history in seconds; selected-player trails remain attached to identity while rows reorder.
- Synchronized clickable event markers/list entries seek to event time. The data includes passes and other events; do not invent a shot where none exists.
- Paused/manual exploration remains usable with reduced-motion preferences. Keyboard control, visible focus, clear selection and responsive controls must work. Follow the project theme; provide a finished title/card/legend presentation in the demo.
- Missing/nonfinite observations never become (0,0), acquire another player's identity, or draw a trail across a long data gap. Define and document interpolation/gap behavior. Repeated play, seek, resize, layer removal and destroy must not leave duplicate schedulers/listeners or detached controls.

## Input and references

`tests/playwright/fixtures/field-tracking-data.json` is immutable trial input: 101 sampled frames, 23 entities, 2323 observations, 16 events, covering the first 20 seconds of Metrica Sample Game 1. SHA-256 `879d886b8a37ec183484fa526bb4bc0f2e87aeed792ed9692f5750306195adf4`.

`tracking` contains time/frame/entity_id/team/x/y/label/kind; `events` contains time/type/subtype/team/player/target. `pitch` and `source` contain dimensions, coordinate convention and attribution. Display the Metrica credit in the demo. Do not substitute mock movement for this clip.

Both agents may consult the same primary references:

- https://github.com/metrica-sports/sample-data/blob/master/README.md
- https://mplsoccer.readthedocs.io/en/latest/gallery/pitch_plots/plot_animation.html
- https://github.com/d3/d3-selection/tree/v3.0.0/src/selection

## Implementation plan and Task Manifest

| Task | Intake / disposition | Work | Acceptance |
|---|---|---|---|
| F01 | FTR-001, FTR-004 / Scheduled | Add renderer, R/JS validation and schema contracts; regenerate schemas/bundle | R and JS instantiate the new type with renamed column mappings; existing types remain valid. |
| F02 | FTR-002, FTR-003 / Scheduled | Implement chart-local playback, exploration, events and field rendering | Actual data renders and every specified interaction changes the correct state. |
| F03 | FTR-004, FTR-005 / Scheduled | Finish style/accessibility/lifecycle and focused tests | Browser checks through production bundle, R integration, missing-data/identity/lifecycle failures protected; independent resize/reduced-motion behavior. |
| F04 | FTR-006 / Scheduled | Demo `tests/playwright/fixtures/field-tracking.html`, separate browser servers and report | Each branch has a working URL; compare actual quality, unresolved defects and test protection. Coordinator owns report/servers. |
| F05 | FTR-007 / Scheduled | Coordinator creates GitHub tactical-analysis issue after successful variant | At least one variant works properly; CAGE need not win. |

## Verification

Run `npm run schema`, `npm run build`, focused JS/R/browser tests and appropriate existing regression suites. Browser tests must exercise the built bundle. Demonstrate a meaningful failing condition in a disposable test copy when useful; do not keep artificial defects in production. Record commands and limitations in `md/field-tracking-notes.md` with all FTR IDs accounted for. Do not claim founder acceptance or merge/release readiness from code existence.

Keep scope to this chart and its required integration. No tactical overlays in this trial: Ryan's "Watching and exploring first" and conditional feature-request instruction authorize that sequencing. The new chart must be a library capability, not a standalone demo that bypasses myIO.

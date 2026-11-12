# Field tracking trial intake

User scope, verbatim:

> Add a new feature with and without CAGE on different branches. Compare both and produce a report to me to review. Stand up both so I can compare in the browser as well.

> Let's add a chart type in myIO first, then we can try a network map dashboard for GroundPulse second (more complext)

> Research a type and make a suggestion. Maybe something related to sports analytics like a field level map of player movements that is interactive and able to animate.

> Watching and exploring first. If successful, write up a github issue for a feature request on the tactical analysis features

> Successful means one of the two versions works properly

> Upgrade CAGE first, test second. You can re-run the epicenter test too if you'd like

This trial follows the completed CAGE upgrade. GroundPulse remains scheduled after this comparison in the CAGE execution plan.

| ID | Requirement | Disposition |
|---|---|---|
| FTR-001 | New myIO field-tracking chart with real player/ball movement | Scheduled: F01 |
| FTR-002 | Playback, pause, scrub, frame step and speed selection | Scheduled: F02 |
| FTR-003 | Player selection, trails, labels/team filtering, synchronized events | Scheduled: F02 |
| FTR-004 | Native library integration, responsive accessible presentation, lifecycle safety | Scheduled: F01/F03 |
| FTR-005 | Tests that catch meaningful failures | Scheduled: F03 |
| FTR-006 | Separate comparable branches, browser previews and report | Scheduled: F04 |
| FTR-007 | Tactical feature request when either version works | Scheduled: F05 (conditional success trigger) |

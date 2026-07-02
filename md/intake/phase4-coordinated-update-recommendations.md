# Recommendations — Phase 4 coordinated update (deferred & unverified)

Companion to `phase4-coordinated-update.md` (intake) and `-plan.md` (dispositions). Holds items
that did NOT ship — deferred-by-design or failed/uncertain at the validation gate — each with the
evidence needed to pick it up later. Items move here, with reasons; the workflow continues.

Status legend: **DEFERRED** (intentional, has a gate) · **FAILED-GATE** (attempted, didn't pass) ·
**OUT-OF-SCOPE** · **SHIPPED**.

---

## SHIPPED in the 2026-06-22 autonomous pass

All merged to `main`, each green on full CI + `R CMD check --as-cran` (0/0/0), code-reviewed
(security-reviewed where it touched IO/integration):

- **P4-1 — transitions API** (#76): `setTransition(duration, easing, stagger)`; `easingFor`/
  `staggerDelay` wired across all SVG renderers; opt-out preserved (duration=0 / reduced-motion);
  Playwright e2e for animate / still / reduced-motion. `setTransitionSpeed()` now a wrapper. Folds in **E6**.
- **P4-4 — mobile/touch** (#77): touch already wired; shipped the verification — touch-emulation
  Playwright specs (iOS/Android viewports) for the tooltip path. No product defect found.
- **B2 — file:// deployment** (#78): re-authored `deployment-file.html` to load the IIFE bundle via
  a classic `<script src>` and un-`fixme`d the file:// test. jsPDF lazy-load was already shipped
  (`load-jspdf.js`; not a declared htmlwidget dep, so not inlined in selfcontained saves).
- **D1 — serialization** (#79): `as_layer_rows()` extract-columns-then-index, ~5× faster at 100k
  rows, **byte-identical** output (oracle-equivalence tests across all column types). Chose the
  identical-by-construction rewrite over `toJSON(dataframe="rows")` to avoid the byte-compat risk.
- **D4 — R-side downsampling** (#80): opt-in `"lttb"` transform for `line` layers (default 2000
  points); independent of the DuckDB SQL-side LTTB (no double-downsampling).
- **E1 — arg-name consistency** (#81): camelCase canonical (`onSelect`/`minWidth`/`labelPosition`/
  `textColor`/`gridColor`/`rowkeyCol`) with deprecated snake_case aliases captured via `...`
  (collision-free under partial matching); `.Deprecated` + `inst/deprecation-schedule.csv`.
- **B5 — Shiny partial-update** (#82): `myIOProxy()` + `updateMyIOData()` swap layer data in place
  via `Chart.updateData()` (no destroy/flicker, preserves brush/zoom/legend state); prototype-
  pollution-hardened registry + handler.

## NOT shipped this pass — honest reasons

- **C2 (Delaunay hover)**: `makeNearestIndex` already uses `d3.quadtree.find` (O(log n), 16px
  radius); Delaunay only wins in a no-radius global-nearest regime not used here. No hover-lag
  trace at ≥50k to justify the swap. **No-ship (no defect / gate evidence absent).**
- **C3 (Canvas mid-tier / lower WebGL cutoff)**: the cutoff is already user-tunable via `threshold`;
  lowering the default forces WebGL onto 10k–50k charts that render fine as SVG (behavior change)
  with no profiling win; a Canvas-2D renderer is a separate feature. **No-ship.**
- **C4 (transferable ArrayBuffer → duckdb worker)**: duckdb-wasm `registerFileBuffer(name, buffer)`
  exposes no transfer-list parameter — transfer vs structured-clone is internal to its worker RPC,
  not opt-in-able without patching the dependency. **No-ship (dependency-blocked).**
- **P4-2 (WebR / Quarto Live vignette)**: the gate requires manually confirming myIO loads+renders
  under webR/Quarto Live before claiming first-mover compatibility; no webR toolchain is available
  in this environment and myIO is not known to be in webR's binary repo. A "compatible" vignette
  unverified violates the two-phase evidence rule. **Deferred — needs a real webR session.**
- **P4-3 (R-bloggers draft)**: external announcement is release/version-framed; framing around a
  version number is out of scope and there is no release milestone to anchor. Announcement timing
  and content are the maintainer's call. **Deferred — owner decision.**
- **addKeyframe**: net-new keyframe-sequencing subsystem (ordered states + play/step UX + Shiny
  binding); no scaffold exists; design-heavy with UX decisions. **Deferred — own wave** (the
  additive half of P4-1, setTransition + easing/stagger, shipped in #76).

---

## DEFERRED — design-heavy / feature-sized

### UI-1 legend/button streamlining (#84) — DEFERRED
- **Ask:** legend/button UI needs a design pass — streamlined, adaptive layout; clear visual
  separation between legends and buttons; popover UI must not render a duplicate legend when the
  chart already shows one in the regular plot area. Distinct from #64 (fixed: double legend entry
  on image *export*) — this is in-app popover-vs-plot-area duplication.
- **Re-entry gate:** approved 2026-07-02, no further gate — ready for `/design`.

### P4-1 `addKeyframe()` keyframe sequencing — DEFERRED
- **Why not now:** No scaffold exists (`grep keyframe|stagger` → 0 hits in src). This is a net-new
  sequencing subsystem (ordered data states, labels, play/step controls), not a wiring change. The
  `setTransition()` setter + easing/stagger wiring (the additive, low-risk half of P4-1) shipped in
  **#76**; only the keyframe-sequencing half remains.
- **Design sketch:** `addKeyframe(myIO, data, label)` appends to `config$transitions$keyframes[]`;
  JS controller advances states on a timer/Shiny input, reusing the now-shipped transition path per step.
- **Re-entry gate:** approved design doc; decide play/step UX and Shiny binding first.

### D1b columnar serialization variant (`dataframe="columns"`) — DEFERRED
- **Context:** the row-oriented D1 rewrite shipped in **#79** (`as_layer_rows()`, ~5× faster,
  byte-identical). The columnar variant is still open: 31% smaller *and* fast, but needs a JS reader
  rewrite — larger, separate change.
- **Re-entry gate:** JS layer reader updated to consume columnar payloads; byte/behavior parity
  proof same as D1's gate.

## DEFERRED — validation / verification first

### P4-2 WebR / Quarto Live vignette — DEFERRED
- **Evidence:** no webr vignette; WASM refs are DuckDB-only. quarto + R present locally.
- **Re-entry gate:** manually confirm myIO loads + renders under webR/Quarto Live (htmlwidget deps,
  d3 global, bundle path) before writing a vignette that claims first-mover compatibility.

## DEFERRED — profile/decision-gated (Stream C)

### C2 d3.Delaunay hover — DEFERRED
- `coordinator/webgl-bridge.js:168` uses a quadtree; Delaunay is bundle-free (in d3 v7 global) but
  only wins at high N. Gate: a profiling trace showing hover lag ≥50k points.

### C3 Canvas-2D mid-tier / lower WebGL cutoff — DEFERRED
- 10k–50k renders as raw SVG (WebGL engages at 50k, `webgl-bridge.js:14`). Cheap fix = lower cutoff;
  expensive = new Canvas renderer. Gate: regl per-page context-limit analysis + cutoff profiling.

### C4 transferable ArrayBuffer → duckdb worker — DEFERRED
- `engines/wasm.js:49` `registerFileBuffer`; transfer (vs structured-clone copy) only helps the wasm
  engine. Gate: confirm the duckdb API exposes transfer semantics.

## DEFERRED — sequencing

### D5 Arrow IPC on small-data path — DEFERRED (subsumed)
- 33.6% smaller / 1261× faster encode (benchmarked) but heavy dep; subsumed by D1+D4 for typical N.
  Gate: revisit only if D1+D4 prove insufficient at large N.

### P4-3 R-bloggers announcement draft — DEFERRED
- External-facing content → two-phase evidence rule; and the mission forbids framing around a version
  number. Gate: a release milestone to announce + Phase-1 evidence array.

## OUT-OF-SCOPE

- **B3** inline Arrow base64 bloat — already gated by `.check_inline_ipc_size` (`R/setBigData.R:217`).
- **C5** CSS container queries — responsive branch values are SVG geometry (point radius, stroke),
  not CSS-drivable; wrong layer (`utils/responsive.js:1-13`).
- **C6** WebGPU — Firefox no support thru v155, Safari 26+ only (caniuse 82.3%); regl-scatterplot has
  no WebGPU backend. Disqualified for a render-anywhere CRAN library.

---

## Validation-gate failures (appended during execution)

_None — all shipped branches passed the gate; uncertain/structural items are in
the Deferred sections above with re-entry gates._

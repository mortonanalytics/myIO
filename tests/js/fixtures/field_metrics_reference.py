"""Independent reference values for the field overlay metrics (myIO #169).

Reads the immutable Metrica fixture directly and recomputes team width/depth,
separation and interval aggregates without using any myIO JavaScript. Writes
tests/js/fixtures/field-metrics-reference.json, which tests/js/field-metrics.test.js
compares against fieldMetrics() / fieldMetricsWindow().

Run: python3 tests/js/fixtures/field_metrics_reference.py
"""
import hashlib
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
FIXTURE = ROOT / "tests/playwright/fixtures/field-tracking-data.json"
OUT = ROOT / "tests/js/fixtures/field-metrics-reference.json"
SHA = "879d886b8a37ec183484fa526bb4bc0f2e87aeed792ed9692f5750306195adf4"
MAX_GAP = 0.5
GAP_PLAYER, GAP_START, GAP_END = "home-2", 5.0, 6.0


def load():
    raw = FIXTURE.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == SHA, "fixture changed"
    return json.loads(raw)["tracking"]


def tracks(rows):
    by_id, team, kind = {}, {}, {}
    for r in rows:
        by_id.setdefault(r["entity_id"], []).append((r["time"], r["x"], r["y"]))
        team.setdefault(r["entity_id"], r["team"])
        kind.setdefault(r["entity_id"], r["kind"])
    for v in by_id.values():
        v.sort()
    return by_id, team, kind


def position(samples, t):
    before = [s for s in samples if s[0] <= t]
    after = [s for s in samples if s[0] >= t]
    if before and before[-1][0] == t:
        s = before[-1]
        return None if s[1] is None or s[2] is None else (s[1], s[2])
    if not before or not after:
        return None
    a, b = before[-1], after[0]
    if b[0] - a[0] > MAX_GAP or None in (a[1], a[2], b[1], b[2]):
        return None
    w = (t - a[0]) / (b[0] - a[0])
    return (a[1] + w * (b[1] - a[1]), a[2] + w * (b[2] - a[2]))


def shape(by_id, team, kind, t, min_players=2, exclude=()):
    out = {}
    for tm in sorted({team[e] for e in by_id if kind[e] != "ball"}):
        pts = [position(by_id[e], t) for e in by_id
               if team[e] == tm and kind[e] != "ball" and e not in exclude]
        pts = [p for p in pts if p is not None]
        ok = len(pts) >= min_players
        xs, ys = [p[0] for p in pts], [p[1] for p in pts]
        out[tm] = {"n": len(pts),
                   "width": max(ys) - min(ys) if ok else None,
                   "depth": max(xs) - min(xs) if ok else None}
    return out


def separation(by_id, team, kind, t, who):
    me = position(by_id[who], t)
    if me is None:
        return None
    best = {"opponent": None, "teammate": None}
    for e in by_id:
        if e == who or kind[e] == "ball":
            continue
        p = position(by_id[e], t)
        if p is None:
            continue
        d = math.hypot(p[0] - me[0], p[1] - me[1])
        role = "teammate" if team[e] == team[who] else "opponent"
        if best[role] is None or d < best[role]["distance"]:
            best[role] = {"entity": e, "distance": d}
    if best["opponent"] is None and best["teammate"] is None:
        return None
    return best


def window(by_id, team, kind, t0, t1, min_players=2):
    stamps = sorted({s[0] for v in by_id.values() for s in v if t0 <= s[0] <= t1})
    out = {}
    for t in stamps:
        for tm, m in shape(by_id, team, kind, t, min_players).items():
            agg = out.setdefault(tm, {"width": [], "depth": []})
            if m["width"] is not None:
                agg["width"].append(m["width"])
                agg["depth"].append(m["depth"])
    summary = lambda v: {"mean": sum(v) / len(v), "min": min(v), "max": max(v)} if v else {"mean": None, "min": None, "max": None}
    return {"sampled": len(stamps),
            "teams": {tm: {"frames": len(a["width"]), "width": summary(a["width"]), "depth": summary(a["depth"])} for tm, a in out.items()}}


rows = load()
full = tracks(rows)
gapped_rows = [r for r in rows if not (r["entity_id"] == GAP_PLAYER and GAP_START < r["time"] < GAP_END)]
gapped = tracks(gapped_rows)

cases = {
    "instants": [
        {"name": "kick-off pass (interpolated 0.12 s)", "data": "full", "time": 0.12, "selected": "away-21",
         "shape": shape(*full, 0.12), "separation": separation(*full, 0.12, "away-21")},
        {"name": "pass at 7.64 s (interpolated)", "data": "full", "time": 7.64, "selected": "away-21",
         "shape": shape(*full, 7.64), "separation": separation(*full, 7.64, "away-21")},
        {"name": "sampled frame 10.04 s", "data": "full", "time": 10.04, "selected": "home-2",
         "shape": shape(*full, 10.04), "separation": separation(*full, 10.04, "home-2")},
        {"name": "recovery at 15.12 s excluding goalkeepers", "data": "full", "time": 15.12, "selected": "home-2",
         "exclude": ["home-11", "away-25"],
         "shape": shape(*full, 15.12, exclude=("home-11", "away-25")), "separation": separation(*full, 15.12, "home-2")},
        {"name": "home-2 inside a 1.2 s tracking gap", "data": "gapped", "time": 5.5, "selected": "home-2",
         "shape": shape(*gapped, 5.5), "separation": separation(*gapped, 5.5, "home-2")},
        {"name": "teammate of the gapped player", "data": "gapped", "time": 5.5, "selected": "home-3",
         "shape": shape(*gapped, 5.5), "separation": separation(*gapped, 5.5, "home-3")},
        {"name": "minPlayers above available players", "data": "gapped", "time": 5.5, "selected": None, "minPlayers": 11,
         "shape": shape(*gapped, 5.5, min_players=11), "separation": None},
    ],
    "windows": [
        {"name": "full clip", "data": "full", "window": [0.04, 20.04], "minPlayers": 2, **window(*full, 0.04, 20.04)},
        {"name": "gap window, minPlayers 11", "data": "gapped", "window": [4.5, 6.5], "minPlayers": 11, **window(*gapped, 4.5, 6.5, 11)},
    ],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"source": "tests/js/fixtures/field_metrics_reference.py", "fixture_sha256": SHA, "maxGap": MAX_GAP,
                           "gap": {"entity": GAP_PLAYER, "removedAfter": GAP_START, "removedBefore": GAP_END},
                           **cases}, indent=2) + "\n")
print(OUT)

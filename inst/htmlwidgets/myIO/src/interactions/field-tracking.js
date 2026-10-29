const finite = value => typeof value === "number" && Number.isFinite(value);

export function fieldData(rows, mapping) {
  const entities = new Map();
  const times = new Set();
  for (const row of rows) {
    const id = row[mapping.entity], time = row[mapping.time];
    if (id == null || id === "" || !finite(time)) continue;
    const key = String(id);
    if (!entities.has(key)) entities.set(key, { id: key, label: String(row[mapping.label] ?? id), team: String(row[mapping.team] ?? "Players"), kind: row[mapping.kind] === "ball" ? "ball" : "player", samples: [] });
    const entity = entities.get(key);
    entity.samples.push({ time, x: row[mapping.x_var], y: row[mapping.y_var] });
    times.add(time);
  }
  for (const entity of entities.values()) {
    entity.samples.sort((a, b) => a.time - b.time);
    // Ambiguous duplicate identity/time observations are missing, never positional.
    entity.samples = entity.samples.map((p, i, a) => (a[i - 1]?.time === p.time || a[i + 1]?.time === p.time) ? { time: p.time, x: null, y: null } : p).filter((p, i, a) => i === 0 || a[i - 1].time !== p.time);
  }
  return { entities: [...entities.values()], times: [...times].sort((a, b) => a - b) };
}

export function positionAt(samples, time, maxGap) {
  let lo = 0, hi = samples.length;
  while (lo < hi) { const mid = (lo + hi) >>> 1; if (samples[mid].time < time) lo = mid + 1; else hi = mid; }
  const b = samples[lo];
  if (b?.time === time) return finite(b.x) && finite(b.y) ? b : null;
  const a = samples[lo - 1];
  if (!a || !b || b.time - a.time > maxGap || ![a.x, a.y, b.x, b.y].every(finite)) return null;
  const f = (time - a.time) / (b.time - a.time);
  return { time, x: a.x + f * (b.x - a.x), y: a.y + f * (b.y - a.y) };
}

export function trailAt(samples, time, seconds, maxGap) {
  const points = samples.filter(p => p.time >= time - seconds && p.time <= time);
  const end = positionAt(samples, time, maxGap);
  if (end && points.at(-1)?.time !== time) points.push(end);
  let previous = null;
  return points.map(p => {
    if (!finite(p.x) || !finite(p.y)) { previous = null; return ""; }
    const command = previous && p.time - previous.time <= maxGap ? "L" : "M";
    previous = p;
    return `${command}${p.x},${p.y}`;
  }).join(" ");
}

export function playback(times, changed, scheduler = { request: fn => requestAnimationFrame(fn), cancel: id => cancelAnimationFrame(id) }) {
  const state = { time: times[0] ?? 0, playing: false, speed: 1 };
  let handle = null, last = null, disposed = false;
  function pause() { state.playing = false; if (handle !== null) scheduler.cancel(handle); handle = null; last = null; }
  function seek(time) {
    if (disposed || !finite(time) || !times.length) return;
    state.time = Math.max(times[0], Math.min(times.at(-1), time));
    if (state.time === times.at(-1)) pause();
    changed(state);
  }
  function tick(now) {
    handle = null;
    if (disposed || !state.playing) return;
    const elapsed = last === null ? 0 : (now - last) / 1000;
    last = now;
    seek(state.time + elapsed * state.speed);
    if (state.playing) handle = scheduler.request(tick);
  }
  return { state, seek,
    play() { if (disposed || state.playing || times.length < 2) return; if (state.time === times.at(-1)) seek(times[0]); state.playing = true; last = null; changed(state); handle = scheduler.request(tick); },
    pause() { pause(); if (!disposed) changed(state); },
    step(direction) { pause(); const next = direction > 0 ? times.find(t => t > state.time + 1e-8) : times.slice().reverse().find(t => t < state.time - 1e-8); seek(next ?? state.time); },
    dispose() { pause(); disposed = true; }
  };
}

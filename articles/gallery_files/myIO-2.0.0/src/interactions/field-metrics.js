import { positionAt } from "./field-tracking.js";

// Team shape and player separation for the field chart (myIO #169).
// Inputs are fieldData() output; positions follow positionAt() and its maxGap rule.
// Units are the data's (meters). Attack direction does not enter any metric.

export function fieldMetrics(data, time, { maxGap = 0.5, minPlayers = 2, excludeEntities = [], selected = null } = {}) {
  const excluded = new Set(excludeEntities.map(String));
  const players = data.entities.filter(entity => entity.kind !== "ball");
  const located = players.map(entity => ({ entity, point: positionAt(entity.samples, time, maxGap) }));
  const teams = [...new Set(players.map(entity => entity.team))].map(team => {
    const points = located.filter(d => d.entity.team === team && d.point && !excluded.has(d.entity.id)).map(d => d.point);
    if (points.length < minPlayers) return { team, n: points.length, width: null, depth: null, minX: null, maxX: null, minY: null, maxY: null };
    const xs = points.map(p => p.x), ys = points.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    return { team, n: points.length, width: maxY - minY, depth: maxX - minX, minX, maxX, minY, maxY };
  });
  return { time, teams, separation: separationAt(located, selected) };
}

function separationAt(located, selected) {
  const self = located.find(d => d.entity.id === selected);
  if (!self?.point) return null;
  const nearest = { opponent: null, teammate: null };
  for (const { entity, point } of located) {
    if (entity === self.entity || !point) continue;
    const role = entity.team === self.entity.team ? "teammate" : "opponent";
    const distance = Math.hypot(point.x - self.point.x, point.y - self.point.y);
    if (!nearest[role] || distance < nearest[role].distance) nearest[role] = { entity: entity.id, distance, x: point.x, y: point.y };
  }
  if (!nearest.opponent && !nearest.teammate) return null;
  return { entity: self.entity.id, x: self.point.x, y: self.point.y, ...nearest };
}

// Mean/min/max of width and depth over the sampled timestamps in [t0, t1].
// Frames where a team's metric is null are excluded, never filled.
export function fieldMetricsWindow(data, [t0, t1], options = {}) {
  const times = data.times.filter(t => t >= t0 && t <= t1);
  const values = new Map(data.entities.filter(entity => entity.kind !== "ball").map(entity => [entity.team, { width: [], depth: [] }]));
  for (const time of times) {
    for (const team of fieldMetrics(data, time, { ...options, selected: null }).teams) {
      if (team.width !== null) { values.get(team.team).width.push(team.width); values.get(team.team).depth.push(team.depth); }
    }
  }
  const summary = v => v.length ? { mean: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v) } : { mean: null, min: null, max: null };
  return { window: [t0, t1], sampled: times.length, teams: [...values].map(([team, v]) => ({ team, frames: v.width.length, width: summary(v.width), depth: summary(v.depth) })) };
}

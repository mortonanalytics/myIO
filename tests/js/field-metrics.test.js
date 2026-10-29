import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fieldData } from '../../inst/htmlwidgets/myIO/src/interactions/field-tracking.js';
import { fieldMetrics, fieldMetricsWindow } from '../../inst/htmlwidgets/myIO/src/interactions/field-metrics.js';

// Expected values come from tests/js/fixtures/field_metrics_reference.py, which reads
// the fixture JSON directly and does not use any myIO JavaScript.
const reference = JSON.parse(readFileSync('tests/js/fixtures/field-metrics-reference.json', 'utf8'));
const rows = JSON.parse(readFileSync('tests/playwright/fixtures/field-tracking-data.json', 'utf8')).tracking;
const mapping = { x_var: 'x', y_var: 'y', time: 'time', entity: 'entity_id', team: 'team', label: 'label', kind: 'kind' };
const { entity, removedAfter, removedBefore } = reference.gap;
const datasets = {
  full: fieldData(rows, mapping),
  gapped: fieldData(rows.filter(r => !(r.entity_id === entity && r.time > removedAfter && r.time < removedBefore)), mapping)
};
const close = (actual, expected) => expected === null ? expect(actual).toBeNull() : expect(actual).toBeCloseTo(expected, 9);

describe('fieldMetrics agrees with the independent reference', () => {
  for (const c of reference.instants) {
    it(`${c.name} at ${c.time}s`, () => {
      const result = fieldMetrics(datasets[c.data], c.time, { maxGap: reference.maxGap, minPlayers: c.minPlayers ?? 2, excludeEntities: c.exclude ?? [], selected: c.selected });
      expect(result.teams.map(t => t.team).sort()).toEqual(Object.keys(c.shape).sort());
      for (const team of result.teams) {
        const expected = c.shape[team.team];
        expect(team.n).toBe(expected.n);
        close(team.width, expected.width);
        close(team.depth, expected.depth);
        if (team.width !== null) { close(team.maxY - team.minY, expected.width); close(team.maxX - team.minX, expected.depth); }
      }
      if (c.separation === null) { expect(result.separation).toBeNull(); return; }
      for (const role of ['opponent', 'teammate']) {
        expect(result.separation[role].entity).toBe(c.separation[role].entity);
        close(result.separation[role].distance, c.separation[role].distance);
      }
    });
  }

  it('a gapped player is excluded, not interpolated across the gap', () => {
    const [gap] = reference.instants.filter(c => c.data === 'gapped');
    const home = fieldMetrics(datasets.gapped, gap.time).teams.find(t => t.team === 'home');
    expect(home.n).toBe(10);
    expect(fieldMetrics(datasets.full, gap.time).teams.find(t => t.team === 'home').n).toBe(11);
  });

  it('returns null, never 0, when fewer than minPlayers have positions', () => {
    const one = fieldMetrics(datasets.full, 1, { excludeEntities: datasets.full.entities.filter(e => e.team === 'home' && e.id !== 'home-2').map(e => e.id) });
    expect(one.teams.find(t => t.team === 'home')).toMatchObject({ n: 1, width: null, depth: null });
    expect(fieldMetrics(datasets.full, 1, { minPlayers: 12 }).teams.every(t => t.width === null && t.depth === null)).toBe(true);
    expect(fieldMetrics(datasets.full, 99).teams.every(t => t.n === 0 && t.width === null)).toBe(true);
  });

  it('separation is null without a selected position or any candidate', () => {
    expect(fieldMetrics(datasets.full, 1).separation).toBeNull();
    expect(fieldMetrics(datasets.full, 1, { selected: 'ball' }).separation).toBeNull();
    const lonely = fieldData(rows.filter(r => r.entity_id === 'home-2' || r.kind === 'ball'), mapping);
    expect(fieldMetrics(lonely, 1, { selected: 'home-2' }).separation).toBeNull();
  });
});

describe('fieldMetricsWindow aggregates sampled frames', () => {
  for (const w of reference.windows) {
    it(`${w.name}`, () => {
      const result = fieldMetricsWindow(datasets[w.data], w.window, { maxGap: reference.maxGap, minPlayers: w.minPlayers });
      expect(result.sampled).toBe(w.sampled);
      for (const team of result.teams) {
        const expected = w.teams[team.team];
        expect(team.frames).toBe(expected.frames);
        for (const metric of ['width', 'depth']) for (const stat of ['mean', 'min', 'max']) close(team[metric][stat], expected[metric][stat]);
      }
    });
  }

  it('reports zero frames and null statistics when every frame is missing', () => {
    const result = fieldMetricsWindow(datasets.gapped, [5.04, 5.84], { minPlayers: 11 });
    expect(result.sampled).toBe(5);
    expect(result.teams.find(t => t.team === 'home')).toEqual({ team: 'home', frames: 0, width: { mean: null, min: null, max: null }, depth: { mean: null, min: null, max: null } });
    expect(result.teams.find(t => t.team === 'away').frames).toBe(5);
    expect(fieldMetricsWindow(datasets.full, [30, 40]).teams.every(t => t.frames === 0)).toBe(true);
  });
});

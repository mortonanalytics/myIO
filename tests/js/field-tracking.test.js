import { describe, it, expect } from 'vitest';
import { fieldData, positionAt, trailAt, playback } from '../../inst/htmlwidgets/myIO/src/interactions/field-tracking.js';

describe('field tracking', () => {
  it('preserves mapped identity across row order and removes ambiguous samples', () => {
    const mapping = { entity: 'who', time: 't', x_var: 'east', y_var: 'north' };
    const rows = [{who:'b',t:1,east:20,north:4},{who:'a',t:0,east:1,north:2},{who:'b',t:0,east:10,north:2},{who:'a',t:1,east:3,north:4}];
    const data = fieldData(rows,mapping);
    expect(positionAt(data.entities.find(d=>d.id==='a').samples, .5, 1)).toEqual({time:.5,x:2,y:3});
    expect(positionAt(fieldData([...rows,rows[0]],mapping).entities.find(d=>d.id==='b').samples, 1, 1)).toBeNull();
    expect(fieldData([{who:null,t:0,east:0,north:0}],mapping).entities).toHaveLength(0);
  });
  it('never coerces null or nonfinite observations and breaks long gaps', () => {
    const samples=[{time:0,x:1,y:1},{time:.2,x:null,y:2},{time:.4,x:3,y:3},{time:2,x:4,y:4}];
    expect(positionAt(samples,.2,.5)).toBeNull(); expect(positionAt(samples,.1,.5)).toBeNull(); expect(positionAt(samples,1,.5)).toBeNull();
    expect(trailAt(samples,2,3,.5)).toBe('M1,1  M3,3 M4,4');
    expect(positionAt([{time:0,x:Infinity,y:2}],0,.5)).toBeNull();
  });
  it('owns one scheduler and uses elapsed time, with pause, invalid seek, end and disposal', () => {
    let pending=new Map(), id=0, calls=0;
    const scheduler={request: fn=>{pending.set(++id,fn);return id;},cancel:key=>pending.delete(key)};
    const run=now=>{const jobs=[...pending.values()];pending.clear();jobs.forEach(fn=>fn(now));};
    const p=playback([0,.2,1,4],()=>calls++,scheduler);
    p.play();p.play();expect(pending.size).toBe(1);run(100);run(600);expect(p.state.time).toBe(.5);
    p.seek(NaN);expect(p.state.time).toBe(.5);p.state.speed=2;run(1100);expect(p.state.time).toBe(1.5);
    p.pause();expect(pending.size).toBe(0);p.step(-1);expect(p.state.time).toBe(1);
    p.play();run(1200);run(4200);expect(p.state).toMatchObject({time:4,playing:false});expect(pending.size).toBe(0);
    p.play();expect(p.state.time).toBe(0);p.dispose();p.dispose();const before=calls;p.seek(1);p.play();run(5000);expect(calls).toBe(before);expect(pending.size).toBe(0);
  });
});

import { getRenderer, registerRenderer, registerBuiltInRenderers } from '../../inst/htmlwidgets/myIO/src/registry.js';
it('admits field exactly once and rejects unknown or incomplete renderers', () => {
  registerBuiltInRenderers();
  const field = getRenderer('field');
  expect(field.constructor.type).toBe('field');
  expect(()=>registerRenderer('field',field)).toThrow('already registered');
  expect(()=>getRenderer('unknown-field')).toThrow('Unknown renderer');
  expect(()=>registerRenderer('invalid-field',{})).toThrow('missing static traits');
});

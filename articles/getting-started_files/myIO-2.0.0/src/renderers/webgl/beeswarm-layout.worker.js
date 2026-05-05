// Beeswarm layout worker. Runs d3-force on a Web Worker thread so the
// main thread stays at 60fps. Main thread posts {points, xScale, yScale,
// collideRadius}; worker responds with a transferable Float32Array of
// paired [x, y] positions after ~120 simulation ticks.
//
// Contract: md/design/large-dataset-virtualization-contract.md
//   §Frontend file layout (beeswarm-layout.worker.js).

self.addEventListener("message", async (evt) => {
  const { points, xScale, yScale, collideRadius, iterations } = evt.data || {};
  if (!Array.isArray(points) || points.length === 0) {
    self.postMessage({ positions: new Float32Array(0), error: null });
    return;
  }

  let d3;
  try {
    // Note: d3-force is ESM; Web Workers support ES modules when the
    // parent creates the worker with { type: "module" }.
    d3 = await import("d3-force");
  } catch (err) {
    self.postMessage({
      positions: new Float32Array(0),
      error: "d3-force import failed: " + (err?.message || String(err))
    });
    return;
  }

  // Build nodes. Each input point has {x, y, category?}. The layout:
  //   - x-force pulls each node toward its target scaled x
  //   - y-force pulls gently toward scaled y (allowing spread)
  //   - collide prevents overlap using collideRadius
  const _xScale = buildLinearScale(xScale);
  const _yScale = buildLinearScale(yScale);
  const nodes = points.map((p, i) => ({
    index: i,
    tx: _xScale(Number(p.x)),
    ty: _yScale(Number(p.y)),
    x: _xScale(Number(p.x)),
    y: _yScale(Number(p.y))
  }));

  const radius = (typeof collideRadius === "number" && collideRadius > 0)
    ? collideRadius : 3;
  const ticks = Math.max(10, Math.min(500, Math.floor(iterations || 120)));

  const sim = d3.forceSimulation(nodes)
    .force("x", d3.forceX((d) => d.tx).strength(1))
    .force("y", d3.forceY((d) => d.ty).strength(0.1))
    .force("collide", d3.forceCollide(radius))
    .stop();
  for (let i = 0; i < ticks; i++) sim.tick();

  const positions = new Float32Array(nodes.length * 2);
  for (let i = 0; i < nodes.length; i++) {
    positions[i * 2] = nodes[i].x;
    positions[i * 2 + 1] = nodes[i].y;
  }

  // Transfer the underlying buffer back to the main thread.
  self.postMessage({ positions, error: null }, [positions.buffer]);
});

/**
 * Accept { domain: [d0, d1], range: [r0, r1] } and return a linear scaler.
 * d3.scaleLinear would work but we avoid the extra d3-scale dep.
 */
function buildLinearScale(scale) {
  if (!scale || !Array.isArray(scale.domain) || !Array.isArray(scale.range)) {
    return (v) => Number(v);
  }

  const [d0, d1] = scale.domain;
  const [r0, r1] = scale.range;
  const dspan = (d1 - d0) || 1;
  const rspan = r1 - r0;
  return (v) => r0 + ((Number(v) - d0) / dspan) * rspan;
}

// WebGL renderer dispatcher.
//
// Maps markSpec.kind -> renderer class. Chart-type glue or the coordinator
// calls createWebGLRenderer({kind, el, width, height, xScale, yScale}) to
// get a renderer instance. Renderer classes expose a common shape:
// update(rows) / updateArrow(table) / resize() / destroy().
//
// Beeswarm is a special case - it does not have a single renderer class
// with update(); instead, main-thread callers spawn the layout worker,
// then hand positions to WebGLScatter for rendering.

import { WebGLScatter } from "./scatter.js";
import { WebGLLine } from "./line.js";
import { WebGLArea } from "./area.js";

const RENDERERS = {
  scatter: WebGLScatter,
  line: WebGLLine,
  area: WebGLArea
  // beeswarm: intentionally absent; see createBeeswarmPipeline below.
};

/**
 * @param {{kind:string, el:HTMLElement, width:number, height:number,
 *          xScale:any, yScale:any, palette?:string[], color?:number[]}} opts
 * @returns renderer instance exposing update() / resize() / destroy(), or null
 *   if kind is not WebGL-eligible.
 */
export function createWebGLRenderer(opts) {
  const Cls = RENDERERS[opts.kind];
  if (!Cls) return null;
  return new Cls(opts);
}

/**
 * Beeswarm is a two-stage pipeline: worker computes positions, scatter
 * renders them. Caller is responsible for worker lifecycle.
 *
 * Usage:
 *   const bs = createBeeswarmPipeline({ el, width, height, xScale, yScale });
 *   await bs.layout(points, { collideRadius: 3 });  // runs worker
 *   // Positions are now on bs.positions; scatter has rendered them.
 *   bs.destroy();
 */
export function createBeeswarmPipeline({
  el,
  width,
  height,
  xScale,
  yScale,
  palette,
  workerUrl
}) {
  const scatter = new WebGLScatter({ el, width, height, xScale, yScale, palette });
  let worker = null;
  let lastPositions = null;

  async function layout(points, { collideRadius = 3, iterations = 120 } = {}) {
    return new Promise((resolve, reject) => {
      if (!workerUrl) {
        return reject(new Error(
          "createBeeswarmPipeline: workerUrl is required. Typically " +
          "'<htmlwidgets-asset-root>/workers/beeswarm-layout.js' built by " +
          "`npm run build:worker`."
        ));
      }
      if (!worker) {
        worker = new Worker(workerUrl, { type: "module" });
      }
      const onMsg = async (evt) => {
        worker.removeEventListener("message", onMsg);
        if (evt.data?.error) return reject(new Error(evt.data.error));
        lastPositions = evt.data.positions;
        const rows = new Array(points.length);
        for (let i = 0; i < points.length; i++) {
          rows[i] = {
            x: lastPositions[i * 2],
            y: lastPositions[i * 2 + 1],
            category: points[i].category || 0
          };
        }
        await scatter.update(rows);
        resolve(rows);
      };
      worker.addEventListener("message", onMsg);
      // Scale descriptors: pass domain + range so the worker can replicate.
      const xDesc = {
        domain: xScale.domain ? xScale.domain() : [0, 1],
        range: xScale.range ? xScale.range() : [0, width]
      };
      const yDesc = {
        domain: yScale.domain ? yScale.domain() : [0, 1],
        range: yScale.range ? yScale.range() : [0, height]
      };
      worker.postMessage({
        points,
        xScale: xDesc,
        yScale: yDesc,
        collideRadius,
        iterations
      });
    });
  }

  function destroy() {
    if (worker) {
      try {
        worker.terminate();
      } catch (_) {}
      worker = null;
    }
    if (scatter) scatter.destroy();
  }

  return {
    layout,
    destroy,
    scatter,
    get positions() {
      return lastPositions;
    }
  };
}

export { WebGLScatter, WebGLLine, WebGLArea };

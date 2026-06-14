// WebGL renderer dispatcher.
//
// Maps markSpec.kind -> renderer class. Chart-type glue or the coordinator
// calls createWebGLRenderer({kind, el, width, height, xScale, yScale}) to
// get a renderer instance. Renderer classes expose a common shape:
// update(rows) / updateArrow(table) / resize() / destroy().

import { WebGLScatter } from "./scatter.js";
import { WebGLLine } from "./line.js";
import { WebGLArea } from "./area.js";

const RENDERERS = {
  scatter: WebGLScatter,
  line: WebGLLine,
  area: WebGLArea
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

export { WebGLScatter, WebGLLine, WebGLArea };

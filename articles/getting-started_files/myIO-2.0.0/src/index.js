import { myIOchart } from "./Chart.js";
import { registerBuiltInRenderers } from "./registry.js";
import { Coordinator, bootCoordinator } from "./coordinator/index.js";
import {
  createCoordinatorResultHandler,
  installWebGLBridge,
  installSVGCoordinatorPath,
  normalizeCoordinatorBatches,
  isWebGLEligible
} from "./coordinator/webgl-bridge.js";
import { CrosstalkAdapter } from "./crosstalk-adapter/index.js";
import { createEngine } from "./engines/index.js";
import {
  createWebGLRenderer,
  createBeeswarmPipeline,
  WebGLScatter,
  WebGLLine,
  WebGLArea
} from "./renderers/webgl/index.js";

// Expose on the global namespace that the htmlwidget entry (myIO.js) consults.
if (typeof window !== "undefined") {
  window.myIO = window.myIO || {};
  window.myIO.Coordinator = Coordinator;
  window.myIO.bootCoordinator = bootCoordinator;
  window.myIO.CrosstalkAdapter = CrosstalkAdapter;
  window.myIO.createEngine = createEngine;
  window.myIO.createCoordinatorResultHandler = createCoordinatorResultHandler;
  window.myIO.installWebGLBridge = installWebGLBridge;
  window.myIO.installSVGCoordinatorPath = installSVGCoordinatorPath;
  window.myIO.normalizeCoordinatorBatches = normalizeCoordinatorBatches;
  window.myIO.isWebGLEligible = isWebGLEligible;
  window.myIO.getCoordinator = function() { return globalThis.__myioCoordinator || null; };
  window.myIO.webglRenderers = {
    createWebGLRenderer,
    createBeeswarmPipeline,
    WebGLScatter,
    WebGLLine,
    WebGLArea
  };
}

registerBuiltInRenderers();

window.myIOchart = myIOchart;

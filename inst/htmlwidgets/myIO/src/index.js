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

  // myIOProxy() partial-update support. The htmlwidget binding registers each
  // live chart here by outputId; a single Shiny custom-message handler routes
  // R-side myIOProxy() data swaps to the matching chart's updateData().
  window.myIO._instances = window.myIO._instances || {};
  window.myIO.registerInstance = function(id, chart) {
    if (id) window.myIO._instances[id] = chart;
  };
  window.myIO.unregisterInstance = function(id) {
    if (id && window.myIO._instances) delete window.myIO._instances[id];
  };
  window.myIO.installProxyHandler = function() {
    if (window.myIO._proxyHandlerInstalled) return;
    if (!window.Shiny || typeof window.Shiny.addCustomMessageHandler !== "function") return;
    window.Shiny.addCustomMessageHandler("myio:proxy-update", function(msg) {
      if (!msg || !msg.id) return;
      var chart = window.myIO._instances[msg.id];
      if (chart && typeof chart.updateData === "function") {
        chart.updateData(msg.layers || []);
      }
    });
    window.myIO._proxyHandlerInstalled = true;
  };
  window.myIO.webglRenderers = {
    createWebGLRenderer,
    WebGLScatter,
    WebGLLine,
    WebGLArea
  };
}

registerBuiltInRenderers();

window.myIOchart = myIOchart;

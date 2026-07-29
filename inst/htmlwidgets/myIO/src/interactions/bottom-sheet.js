import { BUTTON_LABELS, handleAction, iconDownload, iconImage, iconLayers, iconLegend, iconPercent, iconPDF, iconClipboard } from "./buttons.js";
import { buildLegendData } from "../layout/legend-data.js";
import {
  legendAvailableWidth,
  legendItemLabel,
  resolveLegendPlacement,
  uniqueLegendItems
} from "../layout/legend-placement.js";
import {
  resetLegendVisibility as resetLegendVisibilityShared,
  toggleLayerVisibility,
  toggleOrdinalSegment
} from "./legend-toggles.js";
import { isMobile } from "../utils/responsive.js";

const PANEL_OPEN_CLASS = "myIO-panel--open";
const BACKDROP_OPEN_CLASS = "myIO-sheet-backdrop--open";
const PANEL_LAYOUT_BOTTOM_CLASS = "myIO-panel--bottom";
const PANEL_LAYOUT_SIDE_CLASS = "myIO-panel--side";

export function addFAB(chart) {
  if (!chart || !chart.element) {
    return null;
  }

  d3.select(chart.element).select(".myIO-fab").remove();

  if (isEmptyChart(chart)) {
    return null;
  }

  chart.dom = chart.dom || {};
  var fab = d3.select(chart.element)
    .append("button")
    .attr("type", "button")
    .attr("class", "myIO-fab")
    .attr("aria-label", "Legend and actions")
    .attr("aria-expanded", "false")
    .html(iconLegend());

  fab.on("click", function() {
    openPanel(chart);
  });

  fab.on("keydown", function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPanel(chart);
    }
  });

  chart.dom.fab = fab;
  syncFABState(chart);
  return fab;
}

export function openPanel(chart) {
  if (!chart || !chart.element) {
    return null;
  }

  chart.dom = chart.dom || {};
  chart.runtime = chart.runtime || {};

  if (chart.runtime._sheetCloseTimer) {
    clearTimeout(chart.runtime._sheetCloseTimer);
    chart.runtime._sheetCloseTimer = null;
  }

  if (chart.runtime._sheetOpen) {
    return chart.dom.panel || null;
  }

  cleanupPanelNodes(chart);

  var backdrop = d3.select(chart.element)
    .append("div")
    .attr("class", "myIO-sheet-backdrop")
    .attr("aria-hidden", "true")
    .on("click", function() {
      closePanel(chart);
    });

  var panel = d3.select(chart.element)
    .append("div")
    .attr("class", "myIO-panel " + (isMobile(chart) ? PANEL_LAYOUT_BOTTOM_CLASS : PANEL_LAYOUT_SIDE_CLASS))
    .attr("role", "dialog")
    .attr("aria-modal", "true")
    .attr("aria-label", getDialogLabel(chart))
    .attr("tabindex", "-1");

  var header = panel.append("div")
    .attr("class", "myIO-sheet-header");

  header.append("div")
    .attr("class", "myIO-sheet-handle");

  header.append("button")
    .attr("type", "button")
    .attr("class", "myIO-sheet-close")
    .attr("aria-label", "Close")
    .html(iconClose())
    .on("click", function() {
      closePanel(chart);
    })
    .on("keydown", function(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        closePanel(chart);
      }
    });

  chart.dom.backdrop = backdrop;
  chart.dom.panel = panel;
  chart.dom.sheetLegendSection = null;
  chart.dom.sheetLegendBody = null;
  chart.dom.sheetActionsBody = null;

  if (sheetLegendPlacement(chart).panel) {
    var legendSection = panel.append("div")
      .attr("class", "myIO-sheet-legend-section")
      .attr("data-sheet-section", "legend");

    chart.dom.sheetLegendSection = legendSection;
    chart.dom.sheetLegendBody = legendSection.append("div")
      .attr("class", "myIO-sheet-legend");

    legendSection.append("hr")
      .attr("class", "myIO-sheet-divider");
  }

  chart.dom.sheetActionsBody = panel.append("div")
    .attr("class", "myIO-sheet-actions")
    .attr("data-sheet-section", "actions");

  renderSheetLegend(chart);
  renderSheetActions(chart);

  chart.runtime._sheetOpen = true;
  attachSheetKeydown(chart);
  attachVisibilityWatch(chart);
  syncFABState(chart);

  window.requestAnimationFrame(function() {
    backdrop.classed(BACKDROP_OPEN_CLASS, true);
    panel.classed(PANEL_OPEN_CLASS, true);
    focusFirstInteractive(panel.node());
  });

  attachSwipeDismiss(chart);

  return panel;
}

export function closePanel(chart, opts) {
  if (!chart || !chart.dom) {
    return;
  }

  var options = opts || {};

  if (!chart.runtime) {
    chart.runtime = {};
  }

  if (chart.runtime._sheetCloseTimer) {
    clearTimeout(chart.runtime._sheetCloseTimer);
    chart.runtime._sheetCloseTimer = null;
  }

  if (chart.dom.backdrop) {
    chart.dom.backdrop.classed(BACKDROP_OPEN_CLASS, false);
  }

  if (chart.dom.panel) {
    chart.dom.panel.classed(PANEL_OPEN_CLASS, false);
  }

  detachSheetKeydown(chart);
  detachVisibilityWatch(chart);
  chart.runtime._sheetOpen = false;
  syncFABState(chart);

  var finalize = function() {
    cleanupPanelNodes(chart);
    chart.runtime._sheetCloseTimer = null;
    syncFABState(chart);

    if (options.returnFocus !== false && chart.dom.fab && typeof chart.dom.fab.node === "function" && chart.dom.fab.node()) {
      chart.dom.fab.node().focus();
    }
  };

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finalize();
    return;
  }

  var panelNode = chart.dom.panel && chart.dom.panel.node ? chart.dom.panel.node() : null;
  var backdropNode = chart.dom.backdrop && chart.dom.backdrop.node ? chart.dom.backdrop.node() : null;
  if (!panelNode || !backdropNode) {
    finalize();
    return;
  }

  var finalized = false;
  var cleanup = function() {
    if (finalized) {
      return;
    }
    finalized = true;
    finalize();
  };

  panelNode.addEventListener("transitionend", cleanup, { once: true });
  backdropNode.addEventListener("transitionend", cleanup, { once: true });
  chart.runtime._sheetCloseTimer = window.setTimeout(cleanup, 350);
}

export function renderSheetLegend(chart) {
  if (!chart || !chart.dom || !chart.dom.panel) {
    return;
  }

  var legendBody = chart.dom.sheetLegendBody;
  var legendSection = chart.dom.sheetLegendSection;
  if (!legendBody) {
    return;
  }

  var panelNode = chart.dom.panel.node();
  var scrollTop = panelNode ? panelNode.scrollTop : 0;
  var legendData = getLegendData(chart);

  legendBody.selectAll("*").remove();
  if (legendSection) {
    legendSection.selectAll(".myIO-sheet-legend-reset").remove();
  }

  if (!sheetLegendPlacement(chart).panel) {
    if (legendSection) {
      legendSection.style("display", "none");
    }
    if (panelNode) {
      panelNode.scrollTop = scrollTop;
    }
    return;
  }

  if (legendSection) {
    legendSection.style("display", null);
  }

  if (legendData.type === "continuous") {
    renderContinuousLegend(chart, legendBody, legendData);
  } else if (legendData.type === "ordinal") {
    renderOrdinalLegend(chart, legendBody, legendData);
  } else {
    renderLayerLegend(chart, legendBody, legendData);
  }

  if (panelNode) {
    panelNode.scrollTop = scrollTop;
  }
}

function renderSheetActions(chart) {
  if (!chart.dom || !chart.dom.sheetActionsBody) {
    return;
  }

  var actions = buildActionData(chart);
  var body = chart.dom.sheetActionsBody;
  body.selectAll("*").remove();

  actions.forEach(function(action) {
    var button = body.append("button")
      .attr("type", "button")
      .attr("class", "myIO-sheet-action")
      .attr("data-action", action.name)
      .on("click", function() {
        handleAction(chart, chart.currentLayers || (chart.derived && chart.derived.currentLayers) || chart.plotLayers || [], action.name);
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleAction(chart, chart.currentLayers || (chart.derived && chart.derived.currentLayers) || chart.plotLayers || [], action.name);
        }
      });

    button.append("span")
      .attr("class", "myIO-sheet-action-icon")
      .attr("aria-hidden", "true")
      .html(action.icon);

    button.append("span")
      .attr("class", "myIO-sheet-action-label")
      .text(action.label);
  });
}

function renderLayerLegend(chart, container, legendData) {
  var useGrid = legendData.items.length > 4;
  container.classed("myIO-sheet-legend--grid", useGrid);

  legendData.items.forEach(function(item) {
    var button = container.append("button")
      .attr("type", "button")
      .attr("class", "myIO-sheet-legend-item")
      .attr("role", "switch")
      .attr("aria-checked", item.visible ? "true" : "false")
      .attr("data-key", item.key)
      .on("click", function() {
        toggleLayerVisibility(chart, item);
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleLayerVisibility(chart, item);
        }
      });

    button.append("span")
      .attr("class", "myIO-sheet-swatch")
      .style("background-color", item.color);

    button.append("span")
      .attr("class", "myIO-sheet-legend-label")
      .text(item.label);
  });

  appendShowAllButton(chart, legendData);
}

function renderOrdinalLegend(chart, container, legendData) {
  var useGrid = legendData.items.length > 4;
  container.classed("myIO-sheet-legend--grid", useGrid);

  legendData.items.forEach(function(item) {
    var button = container.append("button")
      .attr("type", "button")
      .attr("class", "myIO-sheet-legend-item")
      .attr("role", "switch")
      .attr("aria-checked", item.visible ? "true" : "false")
      .attr("data-key", item.key)
      .on("click", function() {
        toggleOrdinalSegment(chart, item, renderSheetLegend);
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleOrdinalSegment(chart, item, renderSheetLegend);
        }
      });

    button.append("span")
      .attr("class", "myIO-sheet-swatch")
      .style("background-color", item.color);

    button.append("span")
      .attr("class", "myIO-sheet-legend-label")
      .text(item.label);
  });

  appendShowAllButton(chart, legendData);
}

function renderContinuousLegend(chart, container, legendData) {
  var scale = legendData.colorScale || chart.colorContinuous;
  if (!scale) {
    return;
  }

  var domain = legendData.domain || scale.domain();
  var stops = buildGradientStops(scale, domain);
  var ticks = buildContinuousTicks(scale, domain);

  container.append("div")
    .attr("class", "myIO-sheet-gradient")
    .style("background", "linear-gradient(90deg, " + stops + ")");

  var tickRow = container.append("div")
    .attr("class", "myIO-sheet-gradient-ticks");

  ticks.forEach(function(tick) {
    tickRow.append("span").text(tick);
  });
}

function buildActionData(chart) {
  var layers = chart.currentLayers || (chart.derived && chart.derived.currentLayers) || chart.plotLayers || [];
  var primaryType = layers[0] ? layers[0].type : null;
  var exportConfig = chart.config && chart.config.export;
  var data = [];

  if (!exportConfig || exportConfig.csv !== false) {
    data.push({ name: "chart", label: BUTTON_LABELS.chart, icon: iconDownload() });
  }

  if (!exportConfig || exportConfig.png !== false) {
    data.push({ name: "image", label: BUTTON_LABELS.image, icon: iconImage() });
  }

  if (!exportConfig || exportConfig.svg !== false) {
    data.push({ name: "svg", label: BUTTON_LABELS.svg, icon: iconDownload() });
  }

  if (!exportConfig || exportConfig.pdf !== false) {
    data.push({ name: "pdf", label: BUTTON_LABELS.pdf, icon: iconPDF() });
  }

  if (!exportConfig || exportConfig.clipboard !== false) {
    data.push({ name: "clipboard-png", label: BUTTON_LABELS["clipboard-png"], icon: iconClipboard() });
    data.push({ name: "clipboard-svg", label: BUTTON_LABELS["clipboard-svg"], icon: iconClipboard() });
  }

  if (chart.options && chart.options.toggleY) {
    data.push({ name: "percent", label: BUTTON_LABELS.percent, icon: iconPercent() });
  }

  if (chart.options && chart.options.toggleY && primaryType === "groupedBar") {
    data.push({ name: "group2stack", label: BUTTON_LABELS.group2stack, icon: iconLayers() });
  }

  return data;
}

function appendShowAllButton(chart, legendData) {
  var hasHidden = legendData.items.some(function(item) { return !item.visible; });
  if (hasHidden && chart.dom.sheetLegendSection) {
    chart.dom.sheetLegendSection.selectAll(".myIO-sheet-legend-reset").remove();
    chart.dom.sheetLegendSection.append("button")
      .attr("type", "button")
      .attr("class", "myIO-sheet-legend-reset")
      .text("Show All")
      .on("click", function() {
        resetLegendVisibility(chart, legendData.type);
      });
  }
}

export function resetLegendVisibility(chart, type) {
  resetLegendVisibilityShared(chart, type, renderSheetLegend);
}

function sheetLegendPlacement(chart) {
  var legendData = getLegendData(chart);
  var items = legendData && Array.isArray(legendData.items) ? uniqueLegendItems(legendData.items) : [];

  return resolveLegendPlacement({
    type: legendData && legendData.type,
    labels: items.map(legendItemLabel),
    suppressLegend: !!(chart.options && chart.options.suppressLegend === true),
    availableWidth: legendAvailableWidth(chart)
  });
}

function attachSwipeDismiss(chart) {
  var panel = chart.dom.panel;
  if (!panel || !isMobile(chart)) return;

  var node = panel.node();
  var startY = 0;
  var currentY = 0;
  var dragging = false;

  node.addEventListener("touchstart", function(e) {
    var rect = node.getBoundingClientRect();
    var touch = e.touches[0];
    if (touch.clientY - rect.top > 40) return;
    startY = touch.clientY;
    currentY = touch.clientY;
    dragging = true;
    node.style.transition = "none";
  }, { passive: true });

  node.addEventListener("touchmove", function(e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    var dy = Math.max(0, currentY - startY);
    node.style.transform = "translateY(" + dy + "px)";
  }, { passive: true });

  node.addEventListener("touchend", function() {
    if (!dragging) return;
    dragging = false;
    node.style.transition = "";
    var dy = currentY - startY;
    if (dy > 80) {
      closePanel(chart);
    } else {
      node.style.transform = "";
    }
  });
}

function getLegendData(chart) {
  if (chart.runtime && chart.runtime._legendData) {
    return chart.runtime._legendData;
  }

  return buildLegendData(chart, chart.runtime && chart.runtime._legendState);
}

function syncFABState(chart) {
  if (!chart || !chart.dom || !chart.dom.fab) {
    return;
  }

  var isOpen = chart.runtime && chart.runtime._sheetOpen === true;
  chart.dom.fab
    .attr("aria-expanded", isOpen ? "true" : "false")
    .attr("aria-label", isOpen ? "Close legend and actions" : "Legend and actions")
    .html(isOpen ? iconClose() : iconLegend());
}

function attachSheetKeydown(chart) {
  detachSheetKeydown(chart);

  var handler = function(event) {
    if (!chart.runtime || !chart.runtime._sheetOpen || !chart.dom || !chart.dom.panel) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closePanel(chart);
      return;
    }

    if (event.key !== "Tab") {
      return;
    }

    var focusables = getFocusableElements(chart.dom.panel.node());
    if (focusables.length === 0) {
      event.preventDefault();
      chart.dom.panel.node().focus();
      return;
    }

    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    var active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  chart.runtime._sheetEscHandler = handler;
  document.addEventListener("keydown", handler);
}

function detachSheetKeydown(chart) {
  if (!chart || !chart.runtime || !chart.runtime._sheetEscHandler) {
    return;
  }

  document.removeEventListener("keydown", chart.runtime._sheetEscHandler);
  chart.runtime._sheetEscHandler = null;
}

// A Shiny navbarPage tab switch does NOT destroy the widget - Bootstrap only sets
// display:none on the pane - so nothing else closes an open panel. An
// IntersectionObserver on the widget root is the reliable, framework-agnostic
// signal: a display:none ancestor collapses the element to a zero-area box, which
// is exactly what distinguishes "hidden" from "merely scrolled out of view" (that
// keeps a non-zero box). Only observed while a panel is open.
function attachVisibilityWatch(chart) {
  detachVisibilityWatch(chart);

  if (!chart.element || typeof window.IntersectionObserver !== "function") {
    return;
  }

  var observer = new window.IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      var box = entry.boundingClientRect;
      if (box && box.width === 0 && box.height === 0) {
        closePanel(chart, { returnFocus: false });
      }
    });
  });

  observer.observe(chart.element);
  chart.runtime._sheetVisibilityObserver = observer;
}

function detachVisibilityWatch(chart) {
  if (chart && chart.runtime && chart.runtime._sheetVisibilityObserver) {
    chart.runtime._sheetVisibilityObserver.disconnect();
    chart.runtime._sheetVisibilityObserver = null;
  }
}

function cleanupPanelNodes(chart) {
  if (chart.dom && chart.dom.panel && typeof chart.dom.panel.remove === "function") {
    chart.dom.panel.remove();
  }

  if (chart.dom && chart.dom.backdrop && typeof chart.dom.backdrop.remove === "function") {
    chart.dom.backdrop.remove();
  }

  if (chart.dom) {
    chart.dom.panel = null;
    chart.dom.backdrop = null;
    chart.dom.sheetLegendSection = null;
    chart.dom.sheetLegendBody = null;
    chart.dom.sheetActionsBody = null;
  }
}

function isEmptyChart(chart) {
  var layers = chart && (chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || []);
  return !layers || layers.length === 0;
}

function getDialogLabel(chart) {
  if (chart && chart.svg && typeof chart.svg.attr === "function") {
    var baseLabel = chart.svg.attr("aria-label");
    if (baseLabel) {
      return baseLabel + " controls";
    }
  }

  return "Chart controls";
}

function focusFirstInteractive(rootNode) {
  if (!rootNode) {
    return;
  }

  var focusables = getFocusableElements(rootNode);
  if (focusables.length > 0) {
    focusables[0].focus();
    return;
  }

  rootNode.focus();
}

function getFocusableElements(rootNode) {
  if (!rootNode) {
    return [];
  }

  return Array.from(rootNode.querySelectorAll([
    "button:not([disabled])",
    "[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",")));
}

function buildGradientStops(scale, domain) {
  var min = domain[0];
  var max = domain[domain.length - 1];
  var steps = 8;

  return Array.from({ length: steps }, function(_, index) {
    var t = steps === 1 ? 0 : index / (steps - 1);
    var value = min + (max - min) * t;
    return scale(value) + " " + Math.round(t * 100) + "%";
  }).join(", ");
}

function buildContinuousTicks(scale, domain) {
  if (typeof scale.ticks === "function") {
    return scale.ticks(5).map(function(tick) {
      return String(tick);
    });
  }

  return [String(domain[0]), String(domain[domain.length - 1])];
}

function iconWrapper(paths) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">' + paths + "</svg>";
}

function iconClose() {
  return iconWrapper('<path d="M6 6 18 18"></path><path d="M18 6 6 18"></path>');
}

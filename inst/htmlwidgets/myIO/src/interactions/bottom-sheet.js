import { BUTTON_LABELS, handleAction, iconCamera, iconFileDown, iconLayers, iconPercent } from "./buttons.js";
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
    .attr("aria-label", "Open chart controls")
    .attr("aria-expanded", "false")
    .html(iconMore());

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

  panel.append("div")
    .attr("class", "myIO-sheet-handle");

  chart.dom.backdrop = backdrop;
  chart.dom.panel = panel;
  chart.dom.sheetLegendSection = null;
  chart.dom.sheetLegendBody = null;
  chart.dom.sheetActionsSection = null;
  chart.dom.sheetActionsBody = null;

  if (!chart.options || chart.options.suppressLegend !== true) {
    var legendSection = panel.append("section")
      .attr("class", "myIO-sheet-section myIO-sheet-legend-section")
      .attr("data-sheet-section", "legend");

    legendSection.append("h2")
      .attr("class", "myIO-sheet-section-title")
      .text("Legend");

    chart.dom.sheetLegendSection = legendSection;
    chart.dom.sheetLegendBody = legendSection.append("div")
      .attr("class", "myIO-sheet-legend");
  }

  var actionSection = panel.append("section")
    .attr("class", "myIO-sheet-section myIO-sheet-actions-section")
    .attr("data-sheet-section", "actions");

  actionSection.append("h2")
    .attr("class", "myIO-sheet-section-title")
    .text("Actions");

  chart.dom.sheetActionsSection = actionSection;
  chart.dom.sheetActionsBody = actionSection.append("div")
    .attr("class", "myIO-sheet-actions");

  renderSheetLegend(chart);
  renderSheetActions(chart);

  chart.runtime._sheetOpen = true;
  attachSheetKeydown(chart);
  syncFABState(chart);

  window.requestAnimationFrame(function() {
    backdrop.classed(BACKDROP_OPEN_CLASS, true);
    panel.classed(PANEL_OPEN_CLASS, true);
    focusFirstInteractive(panel.node());
  });

  return panel;
}

export function closePanel(chart) {
  if (!chart || !chart.dom) {
    return;
  }

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

  var finalize = function() {
    cleanupPanelNodes(chart);
    chart.runtime._sheetOpen = false;
    chart.runtime._sheetCloseTimer = null;
    syncFABState(chart);

    if (chart.dom.fab && typeof chart.dom.fab.node === "function" && chart.dom.fab.node()) {
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

  var legendSection = chart.dom.sheetLegendSection;
  var legendBody = chart.dom.sheetLegendBody;
  if (!legendSection || !legendBody) {
    return;
  }

  var panelNode = chart.dom.panel.node();
  var scrollTop = panelNode ? panelNode.scrollTop : 0;
  var legendData = getLegendData(chart);

  legendBody.selectAll("*").remove();

  if (!legendData || !legendData.type) {
    legendSection.style("display", "none");
    if (panelNode) {
      panelNode.scrollTop = scrollTop;
    }
    return;
  }

  legendSection.style("display", null);

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
      .attr("class", "button myIO-sheet-action")
      .attr("data-action", action.name)
      .attr("aria-label", action.label)
      .on("click", function() {
        handleAction(chart, chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || [], action.name);
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
      .style("background-color", item.color)
      .style("border", "1px solid " + item.color);

    button.append("span")
      .attr("class", "myIO-sheet-legend-label")
      .text(item.label);

    button.append("span")
      .attr("class", "myIO-sheet-legend-state")
      .text(item.visible ? "On" : "Off");
  });
}

function renderOrdinalLegend(chart, container, legendData) {
  legendData.items.forEach(function(item) {
    var button = container.append("button")
      .attr("type", "button")
      .attr("class", "myIO-sheet-legend-item")
      .attr("role", "switch")
      .attr("aria-checked", item.visible ? "true" : "false")
      .attr("data-key", item.key)
      .on("click", function() {
        toggleOrdinalSegment(chart, item);
      })
      .on("keydown", function(event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleOrdinalSegment(chart, item);
        }
      });

    button.append("span")
      .attr("class", "myIO-sheet-swatch")
      .style("background-color", item.color)
      .style("border", "1px solid " + item.color);

    button.append("span")
      .attr("class", "myIO-sheet-legend-label")
      .text(item.label);

    button.append("span")
      .attr("class", "myIO-sheet-legend-state")
      .text(item.visible ? "On" : "Off");
  });
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
  var layers = chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers || [];
  var primaryType = layers[0] ? layers[0].type : null;
  var data = [
    { name: "image", label: BUTTON_LABELS.image, icon: iconCamera() },
    { name: "chart", label: BUTTON_LABELS.chart, icon: iconFileDown() }
  ];

  if (chart.options && chart.options.toggleY) {
    data.push({ name: "percent", label: BUTTON_LABELS.percent, icon: iconPercent() });
  }

  if (chart.options && chart.options.toggleY && primaryType === "groupedBar") {
    data.push({ name: "group2stack", label: BUTTON_LABELS.group2stack, icon: iconLayers() });
  }

  return data;
}

function toggleLayerVisibility(chart, item) {
  if (!chart.runtime) {
    chart.runtime = {};
  }

  var hiddenKeys = Array.isArray(chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys.slice() : [];
  var index = hiddenKeys.indexOf(item.key);
  if (index === -1) {
    hiddenKeys.push(item.key);
  } else {
    hiddenKeys.splice(index, 1);
  }

  chart.runtime._hiddenLayerKeys = hiddenKeys;
  chart.derived = chart.derived || {};
  chart.derived.currentLayers = (chart.plotLayers || []).filter(function(layer) {
    return hiddenKeys.indexOf(layer._composite || layer.label) === -1;
  });
  chart.syncLegacyAliases();
  chart.renderCurrentLayers();
}

function toggleOrdinalSegment(chart, item) {
  if (!chart.runtime) {
    chart.runtime = {};
  }

  if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
    chart.runtime._hiddenOrdinalSegments = [];
  }

  var hidden = chart.runtime._hiddenOrdinalSegments;
  var index = hidden.indexOf(item.key);
  if (index === -1) {
    hidden.push(item.key);
  } else {
    hidden.splice(index, 1);
  }

  chart.runtime._suppressOrdinalLegendRebuild = true;
  chart.routeLayers(chart.currentLayers || chart.derived && chart.derived.currentLayers || []);
  chart.runtime._suppressOrdinalLegendRebuild = false;
}

function buildLegendData(chart) {
  if (!chart || !chart.plotLayers || chart.plotLayers.length === 0) {
    return null;
  }

  var layers = chart.currentLayers || chart.derived && chart.derived.currentLayers || chart.plotLayers;
  var primaryLayer = layers[0] || chart.plotLayers[0];
  var primaryType = primaryLayer ? primaryLayer.type : null;

  if (primaryType === "donut" || primaryType === "treemap") {
    return buildOrdinalLegendData(chart, primaryLayer);
  }

  if (primaryType === "hexbin") {
    return buildContinuousLegendData(chart);
  }

  return buildLayerLegendData(chart);
}

function buildLayerLegendData(chart) {
  var currentLayers = chart.currentLayers || chart.derived && chart.derived.currentLayers || [];
  var visibleKeys = currentLayers.map(function(layer) {
    return layer._composite || layer.label;
  });
  var hiddenKeys = Array.isArray(chart.runtime && chart.runtime._hiddenLayerKeys) ? chart.runtime._hiddenLayerKeys : [];

  return {
    type: "layer",
    items: (chart.plotLayers || []).map(function(layer) {
      var key = layer._composite || layer.label;
      return {
        key: key,
        label: layer.label,
        color: layer.color || "#6b7280",
        visible: visibleKeys.indexOf(key) > -1 && hiddenKeys.indexOf(key) === -1,
        kind: layer.type
      };
    })
  };
}

function buildOrdinalLegendData(chart, layer) {
  if (!layer) {
    return null;
  }

  if (!chart.runtime) {
    chart.runtime = {};
  }

  if (!Array.isArray(chart.runtime._hiddenOrdinalSegments)) {
    chart.runtime._hiddenOrdinalSegments = [];
  }

  var hidden = chart.runtime._hiddenOrdinalSegments;
  var keys = [];

  if (layer.type === "treemap" && layer.data && layer.data.children) {
    keys = layer.data.children.map(function(d) {
      return d.name;
    });
  } else if (layer.type === "donut" && Array.isArray(layer.data)) {
    keys = layer.data.map(function(d) {
      return d[layer.mapping.x_var];
    });
  }

  return {
    type: "ordinal",
    items: keys.map(function(key) {
      var swatchColor = "#6b7280";
      if (typeof chart.colorDiscrete === "function") {
        swatchColor = layer.type === "treemap" ? chart.colorDiscrete("treemap." + key) : chart.colorDiscrete(key);
      }
      if (!swatchColor) {
        swatchColor = "#6b7280";
      }
      return {
        key: key,
        label: key,
        color: swatchColor,
        visible: hidden.indexOf(key) === -1,
        kind: "segment"
      };
    })
  };
}

function buildContinuousLegendData(chart) {
  return {
    type: "continuous",
    items: [],
    colorScale: chart.colorContinuous || null,
    domain: chart.colorContinuous && typeof chart.colorContinuous.domain === "function"
      ? chart.colorContinuous.domain()
      : null
  };
}

function getLegendData(chart) {
  if (chart.runtime && chart.runtime._legendData) {
    return chart.runtime._legendData;
  }

  return buildLegendData(chart);
}

function syncFABState(chart) {
  if (!chart || !chart.dom || !chart.dom.fab) {
    return;
  }

  var isOpen = chart.runtime && chart.runtime._sheetOpen === true;
  chart.dom.fab
    .attr("aria-expanded", isOpen ? "true" : "false")
    .attr("aria-label", isOpen ? "Close chart controls" : "Open chart controls")
    .html(isOpen ? iconClose() : iconMore());
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
    chart.dom.sheetActionsSection = null;
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

function iconMore() {
  return iconWrapper('<circle cx="12" cy="5" r="1.75"></circle><circle cx="12" cy="12" r="1.75"></circle><circle cx="12" cy="19" r="1.75"></circle>');
}

function iconClose() {
  return iconWrapper('<path d="M6 6 18 18"></path><path d="M18 6 6 18"></path>');
}

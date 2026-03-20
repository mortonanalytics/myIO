const rendererRegistry = new Map();

import { LineRenderer } from "./renderers/LineRenderer.js";
import { PointRenderer } from "./renderers/PointRenderer.js";
import { AreaRenderer } from "./renderers/AreaRenderer.js";
import { BarRenderer } from "./renderers/BarRenderer.js";
import { GroupedBarRenderer } from "./renderers/GroupedBarRenderer.js";
import { HistogramRenderer } from "./renderers/HistogramRenderer.js";
import { HexbinRenderer } from "./renderers/HexbinRenderer.js";
import { TreemapRenderer } from "./renderers/TreemapRenderer.js";
import { DonutRenderer } from "./renderers/DonutRenderer.js";
import { GaugeRenderer } from "./renderers/GaugeRenderer.js";
import { HeatmapRenderer } from "./renderers/HeatmapRenderer.js";
import { CandlestickRenderer } from "./renderers/CandlestickRenderer.js";

export function registerRenderer(type, RendererClass) {
  if (rendererRegistry.has(type)) {
    throw new Error("Renderer already registered for type: " + type);
  }

  var traits = RendererClass && RendererClass.constructor ? RendererClass.constructor.traits : null;
  var requiredTraitKeys = ["hasAxes", "referenceLines", "legendType", "binning", "rolloverStyle"];
  if (!traits) {
    throw new Error("Renderer missing static traits: " + type);
  }
  requiredTraitKeys.forEach(function(key) {
    if (!(key in traits)) {
      throw new Error("Renderer trait missing '" + key + "': " + type);
    }
  });

  rendererRegistry.set(type, RendererClass);
}

export function getRenderer(type) {
  if (!rendererRegistry.has(type)) {
    throw new Error("Unknown renderer type: " + type);
  }

  return rendererRegistry.get(type);
}

export function getRendererForLayer(layer) {
  return getRenderer(layer.type);
}

export function registerBuiltInRenderers() {
  if (!rendererRegistry.has(LineRenderer.type)) {
    registerRenderer(LineRenderer.type, new LineRenderer());
  }
  if (!rendererRegistry.has(PointRenderer.type)) {
    registerRenderer(PointRenderer.type, new PointRenderer());
  }
  if (!rendererRegistry.has(AreaRenderer.type)) {
    registerRenderer(AreaRenderer.type, new AreaRenderer());
  }
  if (!rendererRegistry.has(BarRenderer.type)) {
    registerRenderer(BarRenderer.type, new BarRenderer());
  }
  if (!rendererRegistry.has(GroupedBarRenderer.type)) {
    registerRenderer(GroupedBarRenderer.type, new GroupedBarRenderer());
  }
  if (!rendererRegistry.has(HistogramRenderer.type)) {
    registerRenderer(HistogramRenderer.type, new HistogramRenderer());
  }
  if (!rendererRegistry.has(HexbinRenderer.type)) {
    registerRenderer(HexbinRenderer.type, new HexbinRenderer());
  }
  if (!rendererRegistry.has(TreemapRenderer.type)) {
    registerRenderer(TreemapRenderer.type, new TreemapRenderer());
  }
  if (!rendererRegistry.has(DonutRenderer.type)) {
    registerRenderer(DonutRenderer.type, new DonutRenderer());
  }
  if (!rendererRegistry.has(GaugeRenderer.type)) {
    registerRenderer(GaugeRenderer.type, new GaugeRenderer());
  }
  if (!rendererRegistry.has(HeatmapRenderer.type)) {
    registerRenderer(HeatmapRenderer.type, new HeatmapRenderer());
  }
  if (!rendererRegistry.has(CandlestickRenderer.type)) {
    registerRenderer(CandlestickRenderer.type, new CandlestickRenderer());
  }

  return rendererRegistry;
}

export function listRenderers() {
  return Array.from(rendererRegistry.values());
}

const rendererRegistry = new Map();

import { LineRenderer } from "./renderers/LineRenderer.js";
import { PointRenderer } from "./renderers/PointRenderer.js";
import { RegressionRenderer } from "./renderers/RegressionRenderer.js";
import { AreaRenderer } from "./renderers/AreaRenderer.js";
import { BarRenderer } from "./renderers/BarRenderer.js";
import { GroupedBarRenderer } from "./renderers/GroupedBarRenderer.js";
import { HistogramRenderer } from "./renderers/HistogramRenderer.js";
import { HexbinRenderer } from "./renderers/HexbinRenderer.js";
import { TreemapRenderer } from "./renderers/TreemapRenderer.js";
import { DonutRenderer } from "./renderers/DonutRenderer.js";
import { GaugeRenderer } from "./renderers/GaugeRenderer.js";
import { StatLineRenderer } from "./renderers/StatLineRenderer.js";

export function registerRenderer(type, RendererClass) {
  if (rendererRegistry.has(type)) {
    throw new Error("Renderer already registered for type: " + type);
  }

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
  if (!rendererRegistry.has(StatLineRenderer.type)) {
    registerRenderer(StatLineRenderer.type, new StatLineRenderer());
  }
  if (!rendererRegistry.has(PointRenderer.type)) {
    registerRenderer(PointRenderer.type, new PointRenderer());
  }
  if (!rendererRegistry.has(RegressionRenderer.type)) {
    registerRenderer(RegressionRenderer.type, new RegressionRenderer());
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

  return rendererRegistry;
}

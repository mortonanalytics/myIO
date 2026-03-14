import { LineRenderer } from "./LineRenderer.js";

export class StatLineRenderer extends LineRenderer {
  static type = "stat_line";
  static traits = { hasAxes: true, referenceLines: true, legendType: "layer", binning: false, rolloverStyle: "overlay", scaleCapabilities: { invertX: true } };
  static dataContract = { x_var: { required: true, numeric: true, sorted: true }, y_var: { required: true, numeric: true } };
}

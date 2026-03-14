import { myIOchart } from "./Chart.js";
import { registerBuiltInRenderers } from "./registry.js";

registerBuiltInRenderers();

window.myIOchart = myIOchart;

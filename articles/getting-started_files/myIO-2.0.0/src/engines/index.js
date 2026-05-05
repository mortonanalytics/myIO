// Engine adapter factory. Returns an instance implementing the contract's
// five-verb interface: init(), query(), applyPredicateCache()?, cancel(),
// close(). Callers pass the resolved engine name ("wasm" | "server" |
// "svg" | "memory") and any config the adapter needs.
//
// WasmEngineAdapter and ShinyEngineAdapter provide the production big-data
// engines; MemoryEngine is a browser-only test double.
//
// Contract reference: md/design/large-dataset-virtualization-contract.md
//   §JS engine adapter interface, §Symbols.

import { SvgNullAdapter } from "./svg-null.js";
import { MemoryEngine } from "./memory.js";
import { ShinyEngineAdapter } from "./shiny.js";
import { WasmEngineAdapter } from "./wasm.js";

/**
 * @param {"wasm"|"server"|"svg"|"memory"} name
 * @param {object} config
 */
export function createEngine(name, config = {}) {
  switch (name) {
    case "svg":
      return new SvgNullAdapter(config);
    case "memory":
      return new MemoryEngine(config);
    case "wasm":
      return new WasmEngineAdapter(config);
    case "server":
      return new ShinyEngineAdapter(config);
    default:
      throw new Error("createEngine: unknown engine '" + name + "'");
  }
}

export { SvgNullAdapter, MemoryEngine, ShinyEngineAdapter, WasmEngineAdapter };

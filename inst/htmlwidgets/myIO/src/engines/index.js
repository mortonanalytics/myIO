// Engine adapter factory. Returns an instance implementing the contract's
// five-verb interface: init(), query(), applyPredicateCache()?, cancel(),
// close(). Callers pass the resolved engine name ("wasm" | "server" |
// "svg" | "memory") and any config the adapter needs.
//
// The real WasmEngineAdapter lands in T2.3 and ShinyEngineAdapter in T1.5.
// Until then, `createEngine("wasm")` and `createEngine("server")` raise
// "not yet implemented" so callers see a clear error in incomplete builds.
//
// Contract reference: md/design/large-dataset-virtualization-contract.md
//   §JS engine adapter interface, §Symbols.

import { SvgNullAdapter } from "./svg-null.js";
import { MemoryEngine } from "./memory.js";

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
      throw new Error(
        "createEngine('wasm'): WasmEngineAdapter lands in T2.3. This build " +
        "does not yet include the WASM engine."
      );
    case "server":
      throw new Error(
        "createEngine('server'): ShinyEngineAdapter lands in T1.5. This build " +
        "does not yet include the Shiny engine."
      );
    default:
      throw new Error("createEngine: unknown engine '" + name + "'");
  }
}

export { SvgNullAdapter, MemoryEngine };

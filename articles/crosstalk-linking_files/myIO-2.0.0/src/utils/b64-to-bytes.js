// Decode a base64 string to a Uint8Array. Shared by the in-memory and
// duckdb-wasm engine adapters for inline Arrow IPC payloads.
//
// Uses the native Uint8Array.fromBase64 when available (Baseline 2024-25;
// Firefox 133+), which avoids the per-character JS callback of the legacy
// atob loop on large payloads. Falls back to a tight indexed atob loop on
// engines that have not shipped fromBase64 yet.
export function b64ToBytes(b64) {
  if (typeof Uint8Array.fromBase64 === "function") {
    return Uint8Array.fromBase64(b64);
  }
  const bin = atob(b64);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

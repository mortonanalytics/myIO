import { describe, expect, test, afterEach } from "vitest";
import { b64ToBytes } from "../../inst/htmlwidgets/myIO/src/utils/b64-to-bytes.js";

// "myIO" -> bytes [109,121,73,79], base64 "bXlJTw=="
const SAMPLE_B64 = "bXlJTw==";
const SAMPLE_BYTES = [109, 121, 73, 79];

describe("b64ToBytes", () => {
  const orig = Uint8Array.fromBase64;

  afterEach(() => {
    if (orig === undefined) {
      delete Uint8Array.fromBase64;
    } else {
      Uint8Array.fromBase64 = orig;
    }
  });

  test("decodes via the atob fallback when fromBase64 is unavailable", () => {
    delete Uint8Array.fromBase64;
    const out = b64ToBytes(SAMPLE_B64);
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual(SAMPLE_BYTES);
  });

  test("uses native Uint8Array.fromBase64 when present", () => {
    let called = false;
    Uint8Array.fromBase64 = (s) => {
      called = true;
      return new Uint8Array(SAMPLE_BYTES);
    };
    const out = b64ToBytes(SAMPLE_B64);
    expect(called).toBe(true);
    expect(Array.from(out)).toEqual(SAMPLE_BYTES);
  });

  test("native and fallback paths agree on a larger payload", () => {
    const bytes = Array.from({ length: 1024 }, (_, i) => i % 256);
    const b64 = btoa(String.fromCharCode(...bytes));

    delete Uint8Array.fromBase64;
    const fallback = b64ToBytes(b64);

    Uint8Array.fromBase64 = (s) => {
      const bin = atob(s);
      const u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      return u;
    };
    const native = b64ToBytes(b64);

    expect(Array.from(native)).toEqual(Array.from(fallback));
    expect(Array.from(fallback)).toEqual(bytes);
  });

  test("decodes empty input to an empty array", () => {
    delete Uint8Array.fromBase64;
    expect(Array.from(b64ToBytes(""))).toEqual([]);
  });
});

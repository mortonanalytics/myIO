import { test, expect } from "@playwright/test";

// AC-7a: WebGL scatter at ~1M points renders without errors and draws
// visible pixels to the canvas. NO performance assertions - those live
// in webgl-scatter-1M-perf.spec.ts (AC-7b, gated on PLAYWRIGHT_BENCH=1).

test("WebGL scatter renders a 1M-point canvas without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Serve a tiny fixture page that imports WebGLScatter and feeds it 1M
  // synthetic points. The fixture lives at tests/playwright/fixtures/
  // scatter-1M.html and is served by playwright's webServer config.
  await page.goto("/fixtures/scatter-1M.html");
  // Wait for the fixture to signal readiness via window.__myioTestReady.
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 15000 });

  // Assert canvas has drawn pixels (not all transparent).
  const hasPixels = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return false;
    const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
    if (!gl) return false;
    const px = new Uint8Array(4);
    (gl as any).readPixels(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height / 2),
      1, 1,
      (gl as any).RGBA,
      (gl as any).UNSIGNED_BYTE,
      px
    );
    return px[3] !== 0 || px[0] !== 0 || px[1] !== 0 || px[2] !== 0;
  });
  expect(hasPixels).toBe(true);
  expect(errors).toEqual([]);
});

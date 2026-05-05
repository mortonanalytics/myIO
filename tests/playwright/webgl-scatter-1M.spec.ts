import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// AC-7a: WebGL scatter at ~1M points renders without errors and draws
// visible pixels to the canvas. NO performance assertions - those live
// in webgl-scatter-1M-perf.spec.ts (AC-7b, gated on PLAYWRIGHT_BENCH=1).

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative);
    try {
      const body = await readFile(filePath);
      const type = extname(filePath) === ".js" ? "text/javascript" : "text/html";
      res.writeHead(200, { "content-type": type });
      res.end(body);
    } catch (_) {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not bind");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("WebGL scatter renders a 1M-point canvas without errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // Serve a tiny fixture page that imports WebGLScatter and feeds it 1M
  // synthetic points. The fixture lives at tests/playwright/fixtures/
  // scatter-1M.html and is served by playwright's webServer config.
  await page.goto(`${baseUrl}/tests/playwright/fixtures/scatter-1M.html`);
  // Wait for the fixture to signal readiness via window.__myioTestReady.
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 15000 });

  // Assert canvas has drawn pixels (not all transparent).
  const hasPixels = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return false;
    const probe = document.createElement("canvas");
    probe.width = canvas.width;
    probe.height = canvas.height;
    const ctx = probe.getContext("2d");
    if (!ctx) return false;
    ctx.drawImage(canvas, 0, 0);
    const pixels = ctx.getImageData(0, 0, probe.width, probe.height).data;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] || pixels[i + 1] || pixels[i + 2] || pixels[i + 3]) return true;
    }
    return false;
  });
  expect(hasPixels).toBe(true);
  expect(errors).toEqual([]);
});

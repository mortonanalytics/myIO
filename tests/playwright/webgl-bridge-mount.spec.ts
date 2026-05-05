import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/webgl-bridge.html");
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

const fixtureUrl = () => `${baseUrl}/tests/playwright/fixtures/webgl-bridge.html`;

test("WebGL bridge mounts a plot-area canvas without taking SVG pointer events", async ({ page }) => {
  await page.goto(fixtureUrl());
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  const canvasCount = await page.locator("canvas").count();
  expect(canvasCount).toBe(1);

  const geometry = await page.evaluate(() => {
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    const svg = document.querySelector("svg") as SVGSVGElement;
    const c = canvas.getBoundingClientRect();
    const s = svg.getBoundingClientRect();
    const expected = {
      left: s.left + 50,
      top: s.top + 30,
      width: 730,
      height: 530
    };
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const px = new Uint8Array(4);
    if (gl) {
      (gl as any).readPixels(1, 1, 1, 1, (gl as any).RGBA, (gl as any).UNSIGNED_BYTE, px);
    }
    return {
      leftDelta: Math.abs(c.left - expected.left),
      topDelta: Math.abs(c.top - expected.top),
      widthDelta: Math.abs(c.width - expected.width),
      heightDelta: Math.abs(c.height - expected.height),
      hasContext: Boolean(gl),
      nonBlank: px[3] !== 0 || px[0] !== 0 || px[1] !== 0 || px[2] !== 0,
      pointCount: (window as any).__pointCount
    };
  });
  expect(geometry.leftDelta).toBeLessThanOrEqual(1);
  expect(geometry.topDelta).toBeLessThanOrEqual(1);
  expect(geometry.widthDelta).toBeLessThanOrEqual(1);
  expect(geometry.heightDelta).toBeLessThanOrEqual(1);
  expect(geometry.hasContext).toBe(true);
  expect(geometry.nonBlank).toBe(true);
  expect(geometry.pointCount).toBe(2);

  await page.mouse.click(100, 100);
  const target = await page.evaluate(() => (window as any).__lastPointerTarget);
  expect(target).toBe("svg");
});

test("WebGL bridge respects Inf threshold sentinel", async ({ page }) => {
  await page.goto(fixtureUrl());
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });
  await page.evaluate(() => (window as any).__runInf());
  await expect(page.locator("canvas")).toHaveCount(0);
  const rows = await page.evaluate(() => (window as any).__svgFastPathRows);
  expect(rows).toBe(1);
});

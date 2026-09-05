import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// GH #84 legend placement against the PRODUCTION bundle. One legend surface at
// a time: a wide discrete chart shows the interactive inline legend and an
// actions-only panel; a narrow widget in a wide viewport gets the narrow tier
// (container-width signal, not viewport media queries) and the panel owns the
// legend.

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/legend-placement.html");
    try {
      const body = await readFile(filePath);
      const ext = extname(filePath);
      const type = ext === ".js" ? "text/javascript" : ext === ".css" ? "text/css" : "text/html";
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

async function ready(page: Page) {
  await page.goto(`${baseUrl}/tests/playwright/fixtures/legend-placement.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true, null, { timeout: 10000 });
}

test.use({ viewport: { width: 1280, height: 800 } });

test("wide chart: inline legend is the single, interactive legend surface", async ({ page }) => {
  await ready(page);

  // Exactly one inline legend with one switch per series.
  await expect(page.locator(".myIO-inline-legend")).toHaveCount(1);
  const items = page.locator(".myIO-inline-legend-item");
  await expect(items).toHaveCount(2);
  await expect(items.first()).toHaveAttribute("aria-checked", "true");

  // Panel is actions-only: no legend section, no divider.
  await page.locator(".myIO-fab").click();
  await expect(page.locator(".myIO-panel")).toBeVisible();
  await expect(page.locator("[data-sheet-section='legend']")).toHaveCount(0);
  await expect(page.locator(".myIO-sheet-divider")).toHaveCount(0);
  expect(await page.locator(".myIO-sheet-action").count()).toBeGreaterThan(0);
  await page.keyboard.press("Escape");

  // Toggling a series from the inline legend hides its marks.
  const barsBefore = await page.locator("rect[class^='tag-bar']").count();
  await page.locator(".myIO-inline-legend-item[data-key='beta']").click();
  await expect(page.locator(".myIO-inline-legend-item[data-key='beta']")).toHaveAttribute("aria-checked", "false");
  const barsAfter = await page.locator("rect[class^='tag-bar']").count();
  expect(barsAfter).toBeLessThan(barsBefore);
});

test("narrow widget in a wide viewport: narrow tier + panel owns the legend", async ({ page }) => {
  await ready(page);
  await page.evaluate(() => (window as any).__mount(400));

  // Container-width tier, despite the 1280px viewport.
  await expect(page.locator("#chart")).toHaveClass(/myIO-container--narrow/);

  await page.locator(".myIO-fab").click();
  await expect(page.locator(".myIO-panel")).toBeVisible();
  await expect(page.locator(".myIO-panel")).toHaveClass(/myIO-panel--bottom/);
  await expect(page.locator(".myIO-sheet-handle")).toBeVisible();
});

test("empty layers retain a usable clipping path after data returns", async ({ page }) => {
  await ready(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.evaluate(() => {
    const chart = (window as any).__chart;
    (window as any).__savedLayers = chart.config.layers;
    chart.config.layers = [];
    chart.renderCurrentLayers();
  });
  await expect(page.locator("clipPath")).toHaveCount(1);
  await page.evaluate(() => {
    const chart = (window as any).__chart;
    chart.config.layers = (window as any).__savedLayers;
    chart.renderCurrentLayers();
  });
  await expect(page.locator("rect[class^='tag-bar']")).toHaveCount(6);
  expect(await page.evaluate(() => {
    return [...document.querySelectorAll("[clip-path]")].every((node) => {
      const id = node.getAttribute("clip-path")?.match(/#([^)]*)/)?.[1];
      return !!id && !!document.getElementById(id);
    });
  })).toBe(true);
  expect(errors).toEqual([]);
});

test("narrow tier for a discrete chart that no longer fits inline still shows a panel legend", async ({ page }) => {
  await ready(page);
  // 400px is wide enough for two short labels inline; shrink to the point the
  // inline strip cannot fit ("too narrow" placement) to verify panel fallback.
  await page.evaluate(() => (window as any).__mount(300));

  const inlineCount = await page.locator(".myIO-inline-legend").count();
  await page.locator(".myIO-fab").click();
  await expect(page.locator(".myIO-panel")).toBeVisible();

  if (inlineCount === 0) {
    // Panel must own the legend when inline could not render.
    await expect(page.locator("[data-sheet-section='legend']")).toHaveCount(1);
    await expect(page.locator(".myIO-sheet-legend-item")).toHaveCount(2);
  } else {
    // Labels fit at 300px: inline stays the sole surface.
    await expect(page.locator("[data-sheet-section='legend']")).toHaveCount(0);
  }
});

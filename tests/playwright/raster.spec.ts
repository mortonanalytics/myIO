import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// The raster chart type in the production bundle: one image over the grid's
// cell edges, a tooltip with the cell value on hover, none over an empty cell.

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    try {
      const body = await readFile(join(process.cwd(), relative));
      const extension = extname(relative);
      res.writeHead(200, { "content-type": extension === ".js" ? "text/javascript" : extension === ".css" ? "text/css" : "text/html" });
      res.end(body);
    } catch (_) {
      res.writeHead(404);
      res.end("not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("test server did not bind");
  baseUrl = "http://127.0.0.1:" + address.port;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("raster draws one image and shows the hovered cell's value", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/raster.html");
  await page.waitForFunction(() => (window as any).ready);

  const image = page.locator("#raster image");
  await expect(image).toHaveCount(1);
  expect(await image.getAttribute("href")).toMatch(/^data:image\/png;base64,/);

  // Pixel position of a data coordinate, through the chart's own scales.
  const at = (x: number, y: number) => page.evaluate(([x, y]) => {
    const c = (window as any).chart;
    const box = c.dom.chartArea.node().getBoundingClientRect();
    return { x: box.left + c.xScale(x), y: box.top + c.yScale(y) };
  }, [x, y]);

  const cell = await at(12, 4);
  await page.mouse.move(cell.x, cell.y);
  const tooltip = page.locator("#raster .toolTip");
  await expect(tooltip).toBeVisible();
  await expect(tooltip.locator(".toolTipValue")).toHaveText("52.00");

  const gap = await at(6, 4);
  await page.mouse.move(gap.x, gap.y);
  await expect(tooltip).toBeHidden();
});

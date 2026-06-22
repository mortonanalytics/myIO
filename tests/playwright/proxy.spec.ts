import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// B5 myIOProxy partial-update e2e against the PRODUCTION bundle. chart.updateData
// (the path the Shiny "myio:proxy-update" handler drives) must swap an existing
// layer's data and re-render IN PLACE — same <svg> element, no destroy — adding
// the new marks. Verified in Chromium (jsdom lacks SVG transform.baseVal for the
// d3 axis-update interpolation this exercises).

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/transition.html");
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

async function ready(page: Page) {
  await page.goto(`${baseUrl}/tests/playwright/fixtures/transition.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true, null, { timeout: 10000 });
}

test("updateData swaps layer data in place and re-renders (same svg, no destroy)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await ready(page);

  await page.evaluate(() => (window as any).__mount({ speed: 0 }));
  expect(await page.locator("circle[class^='tag-point']").count()).toBe(2);

  // Capture the svg node identity to prove the chart was NOT destroyed/recreated.
  const svgBefore = await page.evaluate(() => {
    (window as any).__svgRef = document.querySelector("svg");
    return !!(window as any).__svgRef;
  });
  expect(svgBefore).toBe(true);

  await page.evaluate(() =>
    (window as any).__proxyUpdate([
      { x: 2, y: 10 }, { x: 4, y: 40 }, { x: 6, y: 60 }, { x: 8, y: 90 }
    ])
  );
  await page.waitForTimeout(50);

  expect(await page.locator("circle[class^='tag-point']").count()).toBe(4);
  const sameSvg = await page.evaluate(() => (window as any).__svgRef === document.querySelector("svg"));
  expect(sameSvg).toBe(true);
  expect(errors, errors.join("\n")).toHaveLength(0);
});

test("a proxy update immediately after a re-mount is not lost", async ({ page }) => {
  // Guards the destroy->reconstruct registry window: a Shiny reactive re-render
  // followed at once by a proxy update must still reach the new chart.
  await ready(page);
  await page.evaluate(() => {
    (window as any).__mount({ speed: 0 });        // re-render in place
    (window as any).__proxyUpdate([{ x: 2, y: 10 }, { x: 5, y: 50 }, { x: 8, y: 90 }]);
  });
  await page.waitForTimeout(50);
  expect(await page.locator("circle[class^='tag-point']").count()).toBe(3);
});

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

test("cancel mid-query retains last good frame and no partial render", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto(`${baseUrl}/tests/playwright/fixtures/query-cancel.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  // Simulate a user brush that fires a query, then cancels before it
  // completes. The fixture exposes window.__fireQuery(id) and
  // window.__cancelQuery(id).
  await page.evaluate(() => (window as any).__fireQuery("q1"));
  await page.waitForTimeout(50);  // let the query start
  await page.evaluate(() => (window as any).__cancelQuery("q1"));
  await page.waitForTimeout(100);

  // Assert the chart did NOT show a partial-Arrow render or JS error.
  expect(consoleErrors).toEqual([]);

  // Assert window.__lastRenderedQuery is either the prior committed query
  // or unset - NOT q1 (which was cancelled).
  const lastRendered = await page.evaluate(() => (window as any).__lastRenderedQuery);
  expect(lastRendered).not.toBe("q1");
});

import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// AC-8 + AC-9: crosstalk threshold transition
// Below threshold: myIO brush broadcasts row-keys; sibling plotly reacts.
// Above threshold: no broadcast; one-shot console info; badge reads
// "linked: predicate-only"; sibling plotly does not react; myIO->myIO
// linking still works via predicate.
//
// Self-contained: serves the repo over http so the fixtures' relative
// `../../../inst/.../src` ES-module imports resolve. No external web server.

let server: Server;
let baseUrl: string;

const MIME: Record<string, string> = {
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".html": "text/html",
};

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    try {
      const body = await readFile(join(process.cwd(), relative));
      res.writeHead(200, { "content-type": MIME[extname(relative)] || "text/html" });
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

test("below threshold: row-key broadcast reaches sibling htmlwidget", async ({ page }) => {
  const consoleInfos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "info") consoleInfos.push(msg.text());
  });

  await page.goto(`${baseUrl}/tests/playwright/fixtures/crosstalk-below-threshold.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  // Fixture exposes window.__brush(predicate, rowCount).
  await page.evaluate(() => (window as any).__brush("x > 1", 50));
  await page.waitForTimeout(200);

  const siblingReacted = await page.evaluate(() =>
    (window as any).__siblingLastKeys ?? null);
  expect(siblingReacted).not.toBeNull();
  expect(Array.isArray(siblingReacted)).toBe(true);
  expect(siblingReacted.length).toBeGreaterThan(0);
  // No suppression info should fire below threshold:
  expect(consoleInfos.some(m => m.includes("crosstalk_threshold"))).toBe(false);
});

test("above threshold: broadcast suppressed + badge + one-shot info", async ({ page }) => {
  const consoleInfos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "info") consoleInfos.push(msg.text());
  });

  await page.goto(`${baseUrl}/tests/playwright/fixtures/crosstalk-above-threshold.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  await page.evaluate(() => (window as any).__brush("x > 1", 500000));
  await page.waitForTimeout(200);

  const siblingReacted = await page.evaluate(() =>
    (window as any).__siblingLastKeys ?? null);
  expect(siblingReacted).toBeNull();  // sibling should NOT have received keys

  const badgeText = await page.evaluate(() =>
    (document.querySelector(".myio-footer") as HTMLElement | null)?.textContent || "");
  expect(badgeText).toMatch(/predicate-only/);

  const suppressionInfos = consoleInfos.filter(m => m.includes("crosstalk_threshold"));
  expect(suppressionInfos.length).toBe(1);  // one-shot

  // Second brush above threshold should NOT re-fire the info:
  await page.evaluate(() => (window as any).__brush("x > 2", 500000));
  await page.waitForTimeout(200);
  const suppressionInfos2 = consoleInfos.filter(m => m.includes("crosstalk_threshold"));
  expect(suppressionInfos2.length).toBe(1);
});

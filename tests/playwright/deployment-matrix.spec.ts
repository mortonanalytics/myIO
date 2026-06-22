import { test, expect } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { pathToFileURL } from "node:url";

// T5.4: Browser deployment matrix. Validates that the coordinator boot +
// file-protocol override behave correctly across representative contexts.
// Uses simple static HTML fixtures; a real Shiny / Posit Connect simulation
// is out of scope for CI.
//
// Self-contained: serves the repo over http (correct .js/.mjs/.wasm mime
// types) so the http-served fixtures and their src imports resolve.

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

test("http-served HTML: coordinator boots, no file-protocol override", async ({ page }) => {
  const consoleInfos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "info") consoleInfos.push(msg.text());
  });

  await page.goto(`${baseUrl}/tests/playwright/fixtures/deployment-http.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  const engineActive = await page.evaluate(() =>
    (window as any).__resolvedEngine ?? null);
  expect(engineActive).toBe("svg");
  // In the fixture, engine is pre-set to 'svg' for determinism (no WASM
  // boot), but the crucial check is: NO file-protocol override fired.
  expect(consoleInfos.some((m) => m.includes("file://"))).toBe(false);
});

// FIXME: the deployment-file.html fixture loads myIO via `<script type="module">`
// + dynamic `import()`, which Chromium refuses to execute over the file://
// protocol (ES modules require an http(s) origin; classic scripts do not).
// Re-author the fixture to load the built IIFE bundle (myIOapi.js) via a
// classic <script src> so the file-protocol override can be exercised under
// file://. Tracked in md/intake/phase4-coordinated-update-recommendations.md.
test.fixme("file:// protocol: override forces svg engine + one-shot info", async ({ page }) => {
  const consoleInfos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "info") consoleInfos.push(msg.text());
  });

  // Open via file:// - Playwright's browser context supports this.
  const fileUrl = pathToFileURL(
    join(process.cwd(), "tests/playwright/fixtures/deployment-file.html")
  ).toString();
  await page.goto(fileUrl);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  expect(consoleInfos.some((m) => m.includes("file://"))).toBe(true);
  const engine = await page.evaluate(() => (window as any).__resolvedEngine ?? null);
  expect(engine).toBe("svg");
});

test("http CSP headers: .mjs / .wasm / workers all load without violation", async ({ page }) => {
  const cspViolations: string[] = [];
  page.on("console", (msg) => {
    if (msg.text().toLowerCase().includes("content security policy")) {
      cspViolations.push(msg.text());
    }
  });

  await page.goto(`${baseUrl}/tests/playwright/fixtures/deployment-http.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });
  expect(cspViolations).toEqual([]);
});

test("quarto self-contained render: works under relaxed CSP", async ({ page }) => {
  // Fixture simulates Quarto's self-contained output by inlining all JS.
  // If the entry correctly defers coordinator boot until DOM ready, this
  // passes; otherwise Quarto-self-contained rendering breaks.
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await page.goto(`${baseUrl}/tests/playwright/fixtures/deployment-quarto-selfcontained.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  expect(errors).toEqual([]);
});

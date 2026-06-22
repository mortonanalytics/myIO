import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// P4-1 transition API e2e. Proves the public setTransition() contract end-to-end
// against the PRODUCTION IIFE bundle:
//   (a) elements animate when duration > 0,
//   (b) NO animation when duration = 0,
//   (c) NO animation under prefers-reduced-motion: reduce.
// The moving point travels yScale(10) -> yScale(90) on updateChart(); we sample
// its cy mid-flight vs settled to distinguish animated from instant.

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

// Settled cy of the moving point with animation disabled — the geometric target.
async function settledTarget(page: Page): Promise<{ idx: number; start: number; final: number }> {
  return page.evaluate(async () => {
    (window as any).__mount({ speed: 0 });
    const before = (window as any).__movingCy() as number[];
    (window as any).__update();
    await new Promise((r) => setTimeout(r, 60));
    const after = (window as any).__movingCy() as number[];
    let idx = 0, best = -1;
    for (let i = 0; i < after.length; i++) {
      const travel = Math.abs(after[i] - before[i]);
      if (travel > best) { best = travel; idx = i; }
    }
    return { idx, start: before[idx], final: after[idx] };
  });
}

test("duration > 0 animates the moving point (mid-flight, then settles)", async ({ page }) => {
  await ready(page);
  const { idx, start, final } = await settledTarget(page);
  expect(Math.abs(final - start)).toBeGreaterThan(50); // sanity: it really moves

  const mid = await page.evaluate(async (i) => {
    (window as any).__mount({ speed: 1000 });
    (window as any).__update();
    await new Promise((r) => setTimeout(r, 120));
    return ((window as any).__movingCy() as number[])[i];
  }, idx);

  // Mid-flight: strictly between start and final (still interpolating).
  const lo = Math.min(start, final), hi = Math.max(start, final);
  expect(mid).toBeGreaterThan(lo + 2);
  expect(mid).toBeLessThan(hi - 2);

  const settled = await page.evaluate(async (i) => {
    await new Promise((r) => setTimeout(r, 1300));
    return ((window as any).__movingCy() as number[])[i];
  }, idx);
  expect(Math.abs(settled - final)).toBeLessThan(2);
});

test("duration = 0 does not animate (instant jump to target)", async ({ page }) => {
  await ready(page);
  const { idx, start, final } = await settledTarget(page);

  const at30 = await page.evaluate(async (i) => {
    (window as any).__mount({ speed: 0 });
    (window as any).__update();
    await new Promise((r) => setTimeout(r, 30));
    return ((window as any).__movingCy() as number[])[i];
  }, idx);
  expect(Math.abs(at30 - final)).toBeLessThan(2);
  expect(Math.abs(at30 - start)).toBeGreaterThan(50);
});

test("grouped/stacked bar transition path resolves easingFor/staggerDelay (no throw)", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await ready(page);
  await page.evaluate(() => {
    (window as any).__mountGrouped({ speed: 300, stagger: 15 });
    (window as any).__toggleLayout(); // -> transitionStacked
    (window as any).__toggleLayout(); // -> transitionGrouped
  });
  await page.waitForTimeout(400);
  // The contract under test is "no ReferenceError from the wired transition
  // helpers"; toggleGroupedLayout must complete cleanly with stagger configured.
  expect(errors, errors.join("\n")).toHaveLength(0);
  expect(await page.locator("svg").count()).toBeGreaterThan(0);
});

test("prefers-reduced-motion: reduce forces no animation even when duration > 0", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const { idx, start, final } = await settledTarget(page);

  const at40 = await page.evaluate(async (i) => {
    (window as any).__mount({ speed: 1000 }); // requested, but reduced-motion overrides to 0
    (window as any).__update();
    await new Promise((r) => setTimeout(r, 40));
    return ((window as any).__movingCy() as number[])[i];
  }, idx);
  expect(Math.abs(at40 - final)).toBeLessThan(2);
  expect(Math.abs(at40 - start)).toBeGreaterThan(50);
});

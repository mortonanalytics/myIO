import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// P4-4 mobile/touch verification. Touch handlers are wired in rollover.js
// (touchstart/move/end -> showElementHover -> tooltip) and tooltip.js. This
// drives them on touch-enabled mobile viewports against the PRODUCTION bundle:
// a touchstart over a bar must surface the tooltip (aria-hidden -> "false") with
// the datum's content, and lifting must hide it again.

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/touch.html");
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
  await page.goto(`${baseUrl}/tests/playwright/fixtures/touch.html`);
  await page.waitForFunction(() => (window as any).__myioTestReady === true, null, { timeout: 10000 });
}

// Center of the first bar rect, in viewport coordinates, for touchscreen.tap.
async function firstBarCenter(page: Page) {
  const box = await page.locator("rect[class^='tag-bar']").first().boundingBox();
  if (!box) throw new Error("no bar rect found");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

const viewports = [
  { name: "iOS (iPhone-class viewport)", viewport: { width: 390, height: 844 } },
  { name: "Android (Pixel-class viewport)", viewport: { width: 393, height: 851 } }
];

for (const v of viewports) {
  test.describe(v.name, () => {
    test.use({ viewport: v.viewport, hasTouch: true, isMobile: true });

    test("touchstart on a bar surfaces the tooltip; touchend hides it", async ({ page }) => {
      await ready(page);
      expect(await page.evaluate(() => (window as any).__tooltipVisible())).toBe(false);

      const c = await firstBarCenter(page);

      // Dispatch a real touchstart only, so we can observe the visible state
      // before touchend schedules the 300ms hide (tap couples both events).
      await page.evaluate(({ x, y }) => {
        const bar = document.querySelector("rect[class^='tag-bar']") as Element;
        const touch = new Touch({ identifier: 1, target: bar, clientX: x, clientY: y });
        bar.dispatchEvent(new TouchEvent("touchstart", {
          bubbles: true, cancelable: true, touches: [touch], changedTouches: [touch], targetTouches: [touch]
        }));
      }, c);

      expect(await page.evaluate(() => (window as any).__tooltipVisible())).toBe(true);
      const text = await page.evaluate(() => (window as any).__tooltipText());
      expect(text).toContain("alpha"); // x_var value
      expect(text).toContain("30");    // y_var value

      // touchend hides it after the 300ms hide timer.
      await page.evaluate(({ x, y }) => {
        const bar = document.querySelector("rect[class^='tag-bar']") as Element;
        const touch = new Touch({ identifier: 1, target: bar, clientX: x, clientY: y });
        bar.dispatchEvent(new TouchEvent("touchend", {
          bubbles: true, cancelable: true, touches: [], changedTouches: [touch], targetTouches: []
        }));
      }, c);
      await page.waitForFunction(() => (window as any).__tooltipVisible() === false, null, { timeout: 5000 });
    });

    test("hasTouch context is active (no pointer-only fallback)", async ({ page }) => {
      await ready(page);
      const touchPoints = await page.evaluate(() => navigator.maxTouchPoints);
      expect(touchPoints).toBeGreaterThan(0);
    });
  });
}

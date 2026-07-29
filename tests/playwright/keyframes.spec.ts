import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    const filePath = join(process.cwd(), relative || "tests/playwright/fixtures/keyframes.html");
    try {
      const body = await readFile(filePath);
      const extension = extname(filePath);
      const type = extension === ".js" ? "text/javascript" :
        extension === ".css" ? "text/css" : "text/html";
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
  baseUrl = "http://127.0.0.1:" + address.port;
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function ready(page: Page) {
  await page.goto(baseUrl + "/tests/playwright/fixtures/keyframes.html");
  await page.waitForFunction(() => (window as any).__myioTestReady === true);
  await page.evaluate(() => (window as any).__mountKeyframes());
}

test("renders the first frame and supports keyboard stepping", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  await ready(page);

  await expect(page.locator(".myIO-keyframe-label")).toHaveText("Start");
  await expect(page.locator("circle[class^='tag-point']")).toHaveCount(2);
  const next = page.getByRole("button", { name: "Next keyframe" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".myIO-keyframe-label")).toHaveText("Middle");
  await expect(page.locator("circle[class^='tag-point']")).toHaveCount(3);
  expect(errors).toEqual([]);
});

test("plays once, stops at the final frame, and restarts", async ({ page }) => {
  await ready(page);
  const play = page.getByRole("button", { name: "Play keyframes" });
  await play.click();
  await expect(page.locator(".myIO-keyframe-label")).toHaveText("End", { timeout: 3000 });
  await expect(page.getByRole("button", { name: "Play keyframes" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("circle[class^='tag-point']")).toHaveCount(4);

  await page.getByRole("button", { name: "Play keyframes" }).click();
  await expect(page.locator(".myIO-keyframe-label")).toHaveText("Start");
  await expect(page.getByRole("button", { name: "Pause keyframe playback" })).toHaveAttribute("aria-pressed", "true");
});

test("reduced motion keeps playback functional with zero-duration updates", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  await page.getByRole("button", { name: "Next keyframe" }).click();
  await expect(page.locator(".myIO-keyframe-label")).toHaveText("Middle");
  await expect(page.locator("circle[class^='tag-point']")).toHaveCount(3);
  expect(await page.evaluate(() => (window as any).__chart.config.transitions.speed)).toBe(0);
});

import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

// The pointcloud chart type in the production bundle: 600,000 points draw on
// a WebGL canvas, orbiting changes the picture, and the 2D button switches to
// a top-down plan with a scale bar.

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

// Share of canvas pixels that differ from the background, and a coarse
// signature of the picture, read through a 2D copy of the WebGL canvas.
async function picture(page: Page) {
  return page.evaluate(() => {
    const gl = document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement;
    const copy = document.createElement("canvas");
    copy.width = 120; copy.height = 75;
    const ctx = copy.getContext("2d")!;
    ctx.drawImage(gl, 0, 0, copy.width, copy.height);
    const px = ctx.getImageData(0, 0, copy.width, copy.height).data;
    let painted = 0;
    const signature: number[] = [];
    for (let i = 0; i < px.length; i += 4) {
      const differs = Math.abs(px[i] - 247) + Math.abs(px[i + 1] - 248) + Math.abs(px[i + 2] - 250) > 30;
      if (differs) painted++;
      signature.push(differs ? 1 : 0);
    }
    return { painted: painted / (px.length / 4), signature: signature.join("") };
  });
}

test("pointcloud draws 600k points and orbiting changes the view", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html");
  await page.waitForFunction(() => (window as any).ready);
  const canvas = page.locator("canvas.myIO-pointcloud-canvas");
  await expect(canvas).toHaveCount(1);
  await page.waitForFunction(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames >= 1);

  const before = await picture(page);
  expect(before.painted).toBeGreaterThan(0.05);

  await expect(page.locator(".myIO-pc-figure-value").first()).toHaveText("±2.4 cm");
  await expect(page.locator(".myIO-pc-figure-label").nth(1)).toHaveText("Map position");

  const box = (await canvas.boundingBox())!;
  const frames0 = await canvas.evaluate((c: HTMLCanvasElement) => +c.dataset.frames!);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 220, box.y + box.height / 2 + 40, { steps: 6 });
  await page.mouse.up();
  await page.waitForFunction((f) => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames! > f, frames0);
  const after = await picture(page);
  expect(after.painted).toBeGreaterThan(0.05);
  expect(after.signature).not.toBe(before.signature);

  await page.getByRole("button", { name: "2D" }).click();
  await expect(page.locator(".myIO-pc-scale")).toBeVisible();
  await page.getByRole("button", { name: "Classes" }).click();
  await expect(page.locator(".myIO-pc-legend-item")).toHaveText(["Ground", "Building"]);
});

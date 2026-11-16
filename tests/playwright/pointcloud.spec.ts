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
  // No camera points and a withheld note: the Camera chip is off, with its reason.
  await expect(page.getByRole("button", { name: "Camera" })).toBeDisabled();
  await expect(page.locator(".myIO-pc-chip-note")).toHaveText("Camera: withheld, its 95% error is over 15 cm.");

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
});

// Clicks a viewer button and waits for the redraw it causes.
async function press(page: Page, name: string) {
  const f = await page.evaluate(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames!);
  await page.getByRole("button", { name, exact: true }).click();
  await page.waitForFunction((n) => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames! > n, f);
}

test("one canvas switches between 3D and the 2D plan, and drapes the orthophoto in 3D", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html");
  await page.waitForFunction(() => (window as any).ready);
  const canvas = page.locator("canvas.myIO-pointcloud-canvas");
  await page.waitForFunction(() => (document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.drape === "ready");
  await expect(canvas).toHaveAttribute("data-mode", "3d");
  await expect(page.locator(".myIO-pc-scale")).toBeHidden();

  // LiDAR off leaves the draped orthophoto and the band; Ortho off removes the drape.
  await press(page, "LiDAR");
  const draped = await picture(page);
  expect(draped.painted).toBeGreaterThan(0.05);
  await press(page, "Ortho");
  const bare = await picture(page);
  expect(bare.painted).toBeLessThan(draped.painted * 0.5);
  await press(page, "Ortho");
  await press(page, "LiDAR");

  // The mesh replaces the points in 3D.
  const points3d = await picture(page);
  await press(page, "Mesh");
  await expect(canvas).toHaveAttribute("data-surface", "mesh");
  expect((await picture(page)).signature).not.toBe(points3d.signature);
  await press(page, "Points");

  // Same canvas in 2D: the plan with its scale bar, no Points / Mesh switch.
  await press(page, "2D");
  await expect(canvas).toHaveAttribute("data-mode", "plan");
  await expect(canvas).toHaveCount(1);
  await expect(page.locator(".myIO-pc-scale")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mesh" })).toBeHidden();
  const plan = await picture(page);
  expect(plan.painted).toBeGreaterThan(0.05);
  expect(plan.signature).not.toBe(points3d.signature);

  await page.getByRole("button", { name: "Classes" }).click();
  await expect(page.locator(".myIO-pc-legend-item").first()).toHaveText("Ground");

  // Back to 3D on the same canvas.
  await page.getByRole("button", { name: "3D" }).click();
  await expect(canvas).toHaveAttribute("data-mode", "3d");
  await expect(page.locator(".myIO-pc-scale")).toBeHidden();
});

test("the 2D Select tool sends the keys inside its rectangle", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html");
  await page.waitForFunction(() => (window as any).ready);
  await page.waitForFunction(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames >= 1);
  await page.getByRole("button", { name: "2D" }).click();
  await page.getByRole("button", { name: "Select" }).click();
  const box = (await page.locator("canvas.myIO-pointcloud-canvas").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.8, { steps: 5 });
  await page.mouse.up();
  const brushed = await page.waitForFunction(() => (window as any).__brushed, null, { timeout: 5000 });
  const e = await brushed.jsonValue() as any;
  expect(e.active).toBe(true);
  expect(e.data.length).toBeGreaterThan(0);
  expect(e.data.length).toBeLessThan(2000);
  expect(Object.keys(e.data[0])).toEqual(["point_id"]);
});

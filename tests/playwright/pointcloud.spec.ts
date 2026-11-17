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
      // Background is light in 2D and dark (#14121e) in 3D.
      const offLight = Math.abs(px[i] - 247) + Math.abs(px[i + 1] - 248) + Math.abs(px[i + 2] - 250) > 30;
      const offDark = Math.abs(px[i] - 20) + Math.abs(px[i + 1] - 18) + Math.abs(px[i + 2] - 30) > 30;
      const differs = offLight && offDark;
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

// Average color of the canvas's top-left corner (the scene background there).
async function cornerColor(page: Page) {
  return page.evaluate(() => {
    const gl = document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement;
    const copy = document.createElement("canvas");
    copy.width = 40; copy.height = 25;
    const ctx = copy.getContext("2d")!;
    ctx.drawImage(gl, 0, 0, 40, 25);
    const px = ctx.getImageData(0, 0, 4, 4).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < px.length; i += 4) { r += px[i]; g += px[i + 1]; b += px[i + 2]; }
    const n = px.length / 4;
    return [r / n, g / n, b / n];
  });
}

test("3D is drawn on a dark background and 2D on the page theme's, with the phone path only in 2D", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html");
  await page.waitForFunction(() => (window as any).ready);
  const canvas = page.locator("canvas.myIO-pointcloud-canvas");
  await page.waitForFunction(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames >= 1);
  const dark = await cornerColor(page);
  expect(Math.max(...dark)).toBeLessThan(60);
  await expect(page.locator(".myIO-pointcloud")).toHaveClass(/is-3d/);
  // In 3D the ground band carries the track; the hand-height path is left out.
  await expect(canvas).toHaveAttribute("data-phone-path", "0");
  // Controls stay readable: the card keeps its light panel.
  const cardBg = await page.locator(".myIO-pc-card").evaluate((e) => getComputedStyle(e).backgroundColor);
  expect(cardBg).toBe("rgb(255, 255, 255)");

  await press(page, "2D");
  // Clear the imagery and points so the corner shows the background.
  await press(page, "Ortho");
  await press(page, "LiDAR");
  const light = await cornerColor(page);
  expect(Math.min(...light)).toBeGreaterThan(200);
  await expect(canvas).toHaveAttribute("data-phone-path", "1");

  // A dark page theme (--chart-bg) carries into the 2D plan.
  await page.evaluate(() => { (document.querySelector("#cloud") as HTMLElement).style.setProperty("--chart-bg", "#1a1a2e"); });
  await press(page, "3D");
  await press(page, "2D");
  const themed = await cornerColor(page);
  expect(Math.max(...themed)).toBeLessThan(60);
});

test("the slider along the walk focuses and cuts away in 3D, marks the point in 2D, and Whole walk resets", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html");
  await page.waitForFunction(() => (window as any).ready);
  const canvas = page.locator("canvas.myIO-pointcloud-canvas");
  await page.waitForFunction(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames! >= 1);
  const slider = page.getByRole("slider", { name: "Position along the walk" });
  const whole = page.getByRole("button", { name: "Whole walk" });
  await expect(slider).toBeVisible();
  await expect(whole).toBeHidden();
  await expect(canvas).toHaveAttribute("data-cut", "0");
  const full = await picture(page);

  // The fixture's track runs 6 m east and 20 m north from (2, 0): 20.9 m.
  await slider.fill("0.5");
  await expect(slider).toHaveAttribute("aria-valuetext", "10 of 21 meters");
  await expect(canvas).toHaveAttribute("data-cut", "1");
  await expect(whole).toBeVisible();
  const target = await page.evaluate(() => (window as any).chart.runtime.pointcloud.getView().target);
  expect(target[0]).toBeCloseTo(5, 1);
  expect(target[1]).toBeCloseTo(10, 1);
  await page.waitForFunction(() => (window as any).chart.runtime.pointcloud.getView().target[1] > 9);
  const focused = await picture(page);
  expect(focused.signature).not.toBe(full.signature);

  // Keyboard: the arrow keys move along the walk.
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  expect(+(await slider.inputValue())).toBeGreaterThan(0.5);

  await whole.click();
  await expect(whole).toBeHidden();
  await expect(canvas).toHaveAttribute("data-cut", "0");

  // 2D: the plan centers on the point and marks it; no cut-away.
  await press(page, "2D");
  await slider.fill("0.25");
  await expect(page.locator(".myIO-pc-focus")).toBeVisible();
  await expect(canvas).toHaveAttribute("data-cut", "0");
  const plan = await page.evaluate(() => (window as any).chart.runtime.pointcloud.getView().target);
  expect(plan[1]).toBeCloseTo(5, 0);
  await whole.click();
  await expect(page.locator(".myIO-pc-focus")).toBeHidden();
});

test("slider = false hides the slider along the walk", async ({ page }) => {
  await page.goto(baseUrl + "/tests/playwright/fixtures/pointcloud.html?slider=0");
  await page.waitForFunction(() => (window as any).ready);
  await page.waitForFunction(() => +(document.querySelector("canvas.myIO-pointcloud-canvas") as HTMLCanvasElement).dataset.frames! >= 1);
  await expect(page.getByRole("slider", { name: "Position along the walk" })).toBeHidden();
});

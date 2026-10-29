import { test, expect, type Page, type Locator } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";

// Expected values: tests/js/fixtures/field_metrics_reference.py (independent of myIO JS).
const reference = JSON.parse(readFileSync("tests/js/fixtures/field-metrics-reference.json", "utf8"));
const instant = (name: string) => reference.instants.find((c: any) => c.name === name);
const PASS = instant("pass at 7.64 s (interpolated)");
const GAP = instant("home-2 inside a 1.2 s tracking gap");
const TENTH = instant("sampled frame 10.04 s");

let server: Server;
let baseUrl: string;

test.beforeAll(async () => {
  server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    const relative = normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]/, "");
    try {
      const body = await readFile(join(process.cwd(), relative));
      const extension = extname(relative);
      res.writeHead(200, { "content-type": extension === ".js" ? "text/javascript" : extension === ".css" ? "text/css" : extension === ".json" ? "application/json" : "text/html" });
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
  await page.goto(baseUrl + "/tests/playwright/fixtures/field-tracking.html");
  await page.waitForFunction(() => (window as any).ready);
}

// Public API only: updateChart with new layer options, and the chart's event emitter.
async function enable(page: Page, index: number, options: Record<string, unknown>, gapped = false) {
  await page.evaluate(({ index, options, gapped, gap }) => {
    const w = window as any, chart = w.charts[index], layer = chart.config.layers[0];
    w.metrics = w.metrics || [];
    if (!chart._overlayListener) { chart._overlayListener = true; chart.on("fieldMetrics", (e: any) => { w.metrics[index] = e; }); }
    const data = gapped ? w.clip.tracking.filter((r: any) => !(r.entity_id === gap.entity && r.time > gap.removedAfter && r.time < gap.removedBefore)) : layer.data;
    chart.updateChart({ ...chart.config, layers: [{ ...layer, data, options: { ...layer.options, ...options } }] });
  }, { index, options, gapped, gap: reference.gap });
}

async function seek(card: Locator, time: number) {
  await card.getByLabel("Timeline", { exact: true }).evaluate((el: HTMLInputElement, t) => { el.value = String(t); el.dispatchEvent(new Event("input", { bubbles: true })); }, time);
}

// Rendered geometry converted from screen pixels back to pitch meters.
async function boxMeters(card: Locator, team: string) {
  return card.locator(`rect.field-shape-box[data-team="${team}"]`).evaluate((el: SVGGraphicsElement) => {
    const ctm = el.ownerSVGElement!.getScreenCTM()!, r = el.getBoundingClientRect();
    return { minX: (r.left - ctm.e) / ctm.a, maxX: (r.right - ctm.e) / ctm.a, minY: (r.top - ctm.f) / ctm.d, maxY: (r.bottom - ctm.f) / ctm.d, scale: ctm.a };
  });
}
async function lineMeters(card: Locator) {
  return card.locator(".field-separation-link line").evaluate((el: SVGGraphicsElement) => {
    const ctm = el.ownerSVGElement!.getScreenCTM()!, r = el.getBoundingClientRect();
    return Math.hypot(r.width / ctm.a, r.height / ctm.d);
  });
}
async function expectBox(card: Locator, team: string, width: number, depth: number) {
  const box = await boxMeters(card, team);
  expect(Math.abs(box.maxY - box.minY - width)).toBeLessThan(0.01);
  expect(Math.abs(box.maxX - box.minX - depth)).toBeLessThan(0.01);
  return box;
}
const cell = (card: Locator, table: string, team: string, metric: string) => card.locator(`.${table} tr[data-team="${team}"] td[data-metric="${metric}"]`);

test("overlays are off by default", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".field-metrics, .field-overlays, .field-separation")).toHaveCount(0);
});

test("seeking to an event shows shape and separation values that match the drawn geometry", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(String(e)));
  await ready(page);
  await enable(page, 0, { overlays: { shape: true, separation: true } });
  const a = page.locator("#field-one");
  await a.getByLabel("Player", { exact: true }).selectOption(PASS.selected);
  await a.locator(".field-events button", { hasText: "7.64s" }).click();
  await expect(a.locator(".field-time")).toHaveText("7.64 / 20.04 s");
  for (const team of ["home", "away"]) {
    const expected = PASS.shape[team];
    await expect(cell(a, "field-shape-table", team, "n")).toHaveText(String(expected.n));
    await expect(cell(a, "field-shape-table", team, "width")).toHaveText(expected.width.toFixed(2));
    await expect(cell(a, "field-shape-table", team, "depth")).toHaveText(expected.depth.toFixed(2));
    await expectBox(a, team, expected.width, expected.depth);
  }
  const sep = a.locator(".field-separation-text");
  await expect(sep).toHaveAttribute("data-opponent", PASS.separation.opponent.entity);
  await expect(sep).toHaveAttribute("data-teammate", PASS.separation.teammate.entity);
  await expect(sep).toContainText(`${PASS.separation.opponent.distance.toFixed(2)} m`);
  await expect(a.locator(".field-separation-link text")).toHaveText(`${PASS.separation.opponent.distance.toFixed(2)} m`);
  expect(Math.abs(await lineMeters(a) - PASS.separation.opponent.distance)).toBeLessThan(0.01);
  const event = await page.evaluate(() => (window as any).metrics[0]);
  expect(event.time).toBe(7.64);
  expect(event.separation.opponent.distance).toBeCloseTo(PASS.separation.opponent.distance, 9);
  expect(event.teams.find((t: any) => t.team === "home").width).toBeCloseTo(PASS.shape.home.width, 9);
  expect(event.window.teams.find((t: any) => t.team === "home").frames).toBe(101);
  expect(errors).toEqual([]);
});

test("tracking gaps, minPlayers and the metric window exclude missing frames", async ({ page }) => {
  await ready(page);
  const a = page.locator("#field-one");
  await enable(page, 0, { overlays: { shape: true, separation: true }, metricWindow: [4.5, 6.5] }, true);
  await a.getByLabel("Player", { exact: true }).selectOption(GAP.selected);
  await seek(a, GAP.time);
  await expect(cell(a, "field-shape-table", "home", "n")).toHaveText("10");
  await expect(cell(a, "field-shape-table", "home", "width")).toHaveText(GAP.shape.home.width.toFixed(2));
  await expectBox(a, "home", GAP.shape.home.width, GAP.shape.home.depth);
  await expect(a.locator(".field-separation-text")).toContainText("no valid position");
  await expect(a.locator(".field-separation-link")).toHaveCount(0);

  const windowCase = reference.windows.find((w: any) => w.name === "gap window, minPlayers 11");
  await enable(page, 0, { overlays: { shape: true }, minPlayers: 11, metricWindow: windowCase.window }, true);
  await seek(a, GAP.time);
  await expect(cell(a, "field-shape-table", "home", "width")).toHaveText("—");
  await expect(a.locator('rect.field-shape-box[data-team="home"]')).toHaveCount(0);
  await expect(a.locator('rect.field-shape-box[data-team="away"]')).toHaveCount(1);
  await expect(a.locator(".field-window")).toContainText(`${windowCase.sampled} sampled frames`);
  for (const team of ["home", "away"]) {
    await expect(a.locator(`.field-window-table tr[data-team="${team}"] td[data-metric="frames"]`)).toHaveText(String(windowCase.teams[team].frames));
    const w = windowCase.teams[team].width;
    await expect(cell(a, "field-window-table", team, "width")).toHaveText([w.mean, w.min, w.max].map((v: number) => v.toFixed(2)).join(" / "));
  }
});

test("window controls set the interval from the current time", async ({ page }) => {
  await ready(page);
  const a = page.locator("#field-one");
  await enable(page, 0, { overlays: { shape: true } });
  await expect(a.locator(".field-window")).toHaveText("Window 0.04–20.04 s · 101 sampled frames");
  await seek(a, 10.04); await a.getByRole("button", { name: "Set window start" }).click();
  await seek(a, 12.04); await a.getByRole("button", { name: "Set window end" }).click();
  await expect(a.locator(".field-window")).toHaveText("Window 10.04–12.04 s · 11 sampled frames");
  await expect(a.locator('.field-window-table tr[data-team="home"] td[data-metric="frames"]')).toHaveText("11");
  await seek(a, 8); await a.getByRole("button", { name: "Set window end" }).click();
  await expect(a.locator(".field-window")).toHaveText("Window 8.00–8.00 s · 0 sampled frames");
  await expect(a.locator('.field-window-table tr[data-team="home"] td[data-metric="frames"]')).toHaveText("0");
});

test("team toggle, resize, reduced motion and data replacement keep overlays coherent", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await ready(page);
  const a = page.locator("#field-one");
  await enable(page, 0, { overlays: { shape: true, separation: true } });
  await a.getByLabel("Player", { exact: true }).selectOption(TENTH.selected);
  await seek(a, TENTH.time);
  await a.getByLabel("Show away", { exact: true }).uncheck();
  await expect(a.locator('rect.field-shape-box[data-team="away"]')).toHaveCount(0);
  await expect(a.locator(".field-separation-link")).toHaveCount(0);
  await expect(cell(a, "field-shape-table", "away", "width")).toHaveText(TENTH.shape.away.width.toFixed(2));
  await a.getByLabel("Show away", { exact: true }).check();
  await expect(a.locator(".field-separation-link")).toHaveCount(1);

  const before = await expectBox(a, "home", TENTH.shape.home.width, TENTH.shape.home.depth);
  await page.evaluate(() => { const chart = (window as any).charts[0]; chart.dom.element.style.width = "420px"; chart.resize(420, 900); });
  await page.waitForTimeout(150);
  const after = await expectBox(a, "home", TENTH.shape.home.width, TENTH.shape.home.depth);
  expect(after.scale).toBeLessThan(before.scale);
  const home = await page.evaluate(() => (window as any).metrics[0].teams.find((t: any) => t.team === "home"));
  expect(Math.abs(after.minX - home.minX)).toBeLessThan(0.01);
  expect(Math.abs(after.minY - home.minY)).toBeLessThan(0.01);
  expect(Math.abs(await lineMeters(a) - TENTH.separation.opponent.distance)).toBeLessThan(0.01);
  await expect(a.getByLabel("Player", { exact: true })).toHaveValue(TENTH.selected);

  await page.evaluate((gap) => {
    const w = window as any;
    w.charts[0].updateData([{ label: "Match view", data: w.clip.tracking.filter((r: any) => !(r.entity_id === gap.entity && r.time > gap.removedAfter && r.time < gap.removedBefore)) }]);
  }, reference.gap);
  await expect(a.locator(".field-time")).toHaveText("0.04 / 20.04 s");
  await expect(a.locator(".field-separation-text")).toHaveText("Select a player to measure separation.");
  await seek(a, GAP.time);
  await expect(cell(a, "field-shape-table", "home", "n")).toHaveText("10");
  await expectBox(a, "home", GAP.shape.home.width, GAP.shape.home.depth);
});

test("two charts keep independent overlay state", async ({ page }) => {
  await ready(page);
  const a = page.locator("#field-one"), b = page.locator("#field-two");
  await enable(page, 0, { overlays: { shape: true, separation: true } });
  await enable(page, 1, { overlays: { shape: true }, excludeEntities: ["home-11", "away-25"] });
  await seek(a, PASS.time);
  await seek(b, 15.12);
  const keepers = instant("recovery at 15.12 s excluding goalkeepers");
  await expect(cell(a, "field-shape-table", "home", "width")).toHaveText(PASS.shape.home.width.toFixed(2));
  await expect(cell(b, "field-shape-table", "home", "n")).toHaveText("10");
  await expect(cell(b, "field-shape-table", "home", "depth")).toHaveText(keepers.shape.home.depth.toFixed(2));
  await expectBox(a, "home", PASS.shape.home.width, PASS.shape.home.depth);
  await expectBox(b, "home", keepers.shape.home.width, keepers.shape.home.depth);
  await expect(b.locator(".field-separation-text, .field-separation")).toHaveCount(0);
  const times = await page.evaluate(() => (window as any).metrics.map((m: any) => m.time));
  expect(times).toEqual([PASS.time, 15.12]);
});

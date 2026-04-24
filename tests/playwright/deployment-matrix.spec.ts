import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// T5.4: Browser deployment matrix. Validates that the coordinator boot +
// file-protocol override behave correctly across representative contexts.
// Uses simple static HTML fixtures; a real Shiny / Posit Connect simulation
// is out of scope for CI.

test("http-served HTML: coordinator boots, no file-protocol override", async ({ page }) => {
  const consoleInfos: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "info") consoleInfos.push(msg.text());
  });

  await page.goto("/fixtures/deployment-http.html");
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  const engineActive = await page.evaluate(() =>
    (window as any).__resolvedEngine ?? null);
  expect(engineActive).toBe("svg");
  // In the fixture, engine is pre-set to 'svg' for determinism (no WASM
  // boot), but the crucial check is: NO file-protocol override fired.
  expect(consoleInfos.some((m) => m.includes("file://"))).toBe(false);
});

test("file:// protocol: override forces svg engine + one-shot info", async ({ page }) => {
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

  await page.goto("/fixtures/deployment-http.html");
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

  await page.goto("/fixtures/deployment-quarto-selfcontained.html");
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  expect(errors).toEqual([]);
});

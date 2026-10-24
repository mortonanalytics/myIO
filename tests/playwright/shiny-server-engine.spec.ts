import { test, expect } from "@playwright/test";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { join } from "node:path";

// Issue #123: in a running Shiny app, a server-engine big-data chart sends its
// query to R, R answers from the session's source registry, and the chart
// renders the rows R streamed back. Needs Rscript with shiny, pkgload, arrow,
// base64enc, duckdb, DBI and later; skipped locally without them, required in CI.
const R_PACKAGES = ["shiny", "pkgload", "arrow", "base64enc", "duckdb", "DBI", "later"];

function rReady(): boolean {
  const check = spawnSync("Rscript", ["-e",
    `quit(status = !all(vapply(c(${R_PACKAGES.map((p) => `"${p}"`).join(",")}), requireNamespace, logical(1), quietly = TRUE)))`]);
  return check.status === 0;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      srv.close(() => (address && typeof address !== "string" ? resolve(address.port) : reject()));
    });
  });
}

let app: ChildProcess | null = null;
let baseUrl = "";

test.beforeAll(async () => {
  test.setTimeout(180_000);
  const ready = rReady();
  if (!ready && process.env.CI) throw new Error("Rscript with the server-engine packages is required in CI");
  test.skip(!ready, "Rscript with shiny/pkgload/arrow/duckdb not available");
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const appFile = join(process.cwd(), "tests/playwright/fixtures/shiny-server-engine/app.R");
  app = spawn("Rscript", [appFile, process.cwd(), String(port)], { stdio: ["ignore", "inherit", "inherit"] });
  const deadline = Date.now() + 150_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch (_) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Shiny app did not start");
});

test.afterAll(() => {
  if (app) app.kill();
});

test("server-engine chart queries R and renders the streamed rows", async ({ page }) => {
  const sentToR: string[] = [];
  const fromR: string[] = [];
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("websocket", (ws) => {
    ws.on("framesent", (f) => { if (typeof f.payload === "string") sentToR.push(f.payload); });
    ws.on("framereceived", (f) => { if (typeof f.payload === "string") fromR.push(f.payload); });
  });

  await page.goto(baseUrl);

  // The placeholder layer has one row; R holds 250.
  await expect(page.locator("#chart svg circle.tag-point-chart-pts")).toHaveCount(250, { timeout: 30_000 });
  expect(sentToR.some((p) => p.includes("myio_query:myio.query") && p.includes("mark_xy"))).toBe(true);
  expect(fromR.some((p) => p.includes("myio:batch"))).toBe(true);
  expect(fromR.some((p) => p.includes("myio:error"))).toBe(false);
  expect(pageErrors).toEqual([]);
});

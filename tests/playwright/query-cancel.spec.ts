import { test, expect } from "@playwright/test";

test("cancel mid-query retains last good frame and no partial render", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => consoleErrors.push(err.message));

  await page.goto("/fixtures/query-cancel.html");
  await page.waitForFunction(() => (window as any).__myioTestReady === true,
    null, { timeout: 10000 });

  // Simulate a user brush that fires a query, then cancels before it
  // completes. The fixture exposes window.__fireQuery(id) and
  // window.__cancelQuery(id).
  await page.evaluate(() => (window as any).__fireQuery("q1"));
  await page.waitForTimeout(50);  // let the query start
  await page.evaluate(() => (window as any).__cancelQuery("q1"));
  await page.waitForTimeout(100);

  // Assert the chart did NOT show a partial-Arrow render or JS error.
  expect(consoleErrors).toEqual([]);

  // Assert window.__lastRenderedQuery is either the prior committed query
  // or unset - NOT q1 (which was cancelled).
  const lastRendered = await page.evaluate(() => (window as any).__lastRenderedQuery);
  expect(lastRendered).not.toBe("q1");
});

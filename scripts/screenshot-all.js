// Capture a screenshot of every chart tab in the demo app.
//
// The tab structure is enumerated from the live DOM rather than hard-coded, so
// the script stays correct as tabs are added, renamed, or re-nested. Three
// shapes are handled: navbar dropdown menus, plain top-level tabs, and plain
// top-level tabs that contain a nested tabset.
//
// Usage:
//   node scripts/screenshot-all.js [outDir] [baseUrl]
// Run with NODE_PATH pointing at this repo's node_modules if invoked from
// outside the repo root.

const fs = require('fs');
const path = require('path');

const outDir = process.argv[2] || 'screenshots-review';
const baseUrl = process.argv[3] || 'http://127.0.0.1:7842';
const RENDER_WAIT = 2500;

function slug(parts) {
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Top-level navbar entries. Dropdown toggles expose their menu items; plain
// links are followed and probed for a nested tabset once active. Serialized
// into the page by page.evaluate, so it must not close over module scope.
function navbarFromDocument() {
  const navs = document.querySelectorAll('ul.navbar-nav, ul.nav.navbar-nav');
  const items = [];
  navs.forEach((nav) => {
    nav.querySelectorAll(':scope > li').forEach((li) => {
      const a = li.querySelector(':scope > a');
      if (!a) return;
      const label = a.textContent.trim();
      if (!label) return;
      if (a.classList.contains('dropdown-toggle')) {
        const children = [...li.querySelectorAll('ul.dropdown-menu > li > a')]
          .map((x) => x.textContent.trim())
          .filter(Boolean);
        items.push({ label, kind: 'dropdown', children });
      } else {
        items.push({ label, kind: 'tab', children: [] });
      }
    });
  });
  return items;
}

// Sub-tabs of whichever pane is currently active. Shiny keeps every pane in the
// DOM and marks the shown one `.active`, so the class is the selector; the
// navbar is excluded so a top-level tab is never mistaken for its own child.
function subTabsFromDocument() {
  const panes = [...document.querySelectorAll('.tab-pane.active, .tab-pane.show.active')];
  const labels = [];
  panes.forEach((pane) => {
    pane.querySelectorAll('ul.nav-tabs > li > a, ul.nav-pills > li > a').forEach((a) => {
      if (a.closest('ul.navbar-nav')) return;
      const t = a.textContent.trim();
      if (t) labels.push(t);
    });
  });
  return [...new Set(labels)];
}

async function clickNavLink(page, label) {
  const link = page
    .locator('ul.navbar-nav > li > a')
    .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await link.click();
}

async function openDropdownItem(page, menu, item) {
  const toggle = page.locator('a.nav-link.dropdown-toggle, a.dropdown-toggle').filter({ hasText: menu }).first();
  const expanded = await toggle.getAttribute('aria-expanded');
  if (expanded !== 'true') {
    await toggle.click();
    await page.waitForTimeout(250);
  }
  const entry = page
    .locator('ul.dropdown-menu > li > a')
    .filter({ hasText: new RegExp(`^\\s*${item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await entry.click();
}

async function clickSubTab(page, label) {
  const tab = page
    .locator('.tab-pane.active ul.nav-tabs > li > a, .tab-pane.active ul.nav-pills > li > a')
    .filter({ hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) })
    .first();
  await tab.click();
}

async function shoot(page, name, log) {
  await page.waitForTimeout(RENDER_WAIT);
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  log.push(name);
  console.log(name);
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Console diagnostics are attributed to whichever chart is on screen when
  // they fire, so a failure points at a tab rather than at the whole run.
  let current = 'startup';
  const diagnostics = [];
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      diagnostics.push({ chart: current, type, text: msg.text() });
    }
  });
  page.on('pageerror', (err) => {
    diagnostics.push({ chart: current, type: 'pageerror', text: String(err) });
  });

  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(RENDER_WAIT);

  const captured = [];
  const navbar = await page.evaluate(navbarFromDocument);
  console.log(`Enumerated ${navbar.length} navbar entries`);

  let index = 0;
  const next = () => String(++index).padStart(2, '0');

  for (const entry of navbar) {
    if (entry.kind === 'dropdown') {
      for (const child of entry.children) {
        current = `${entry.label} / ${child}`;
        await openDropdownItem(page, entry.label, child);
        await shoot(page, `${next()}-${slug([entry.label, child])}`, captured);
      }
      continue;
    }

    current = entry.label;
    await clickNavLink(page, entry.label);
    await page.waitForTimeout(600);

    const subTabs = await page.evaluate(subTabsFromDocument);
    if (subTabs.length === 0) {
      await shoot(page, `${next()}-${slug([entry.label])}`, captured);
      continue;
    }
    for (const sub of subTabs) {
      current = `${entry.label} / ${sub}`;
      await clickSubTab(page, sub);
      await shoot(page, `${next()}-${slug([entry.label, sub])}`, captured);
    }
  }

  await browser.close();

  const report = { baseUrl, outDir, captured, diagnostics };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`\nCaptured ${captured.length} screenshots into ${outDir}`);
  if (diagnostics.length) {
    console.log(`Console diagnostics: ${diagnostics.length}`);
    diagnostics.forEach((d) => console.log(`  [${d.type}] ${d.chart}: ${d.text}`));
    process.exitCode = 1;
  } else {
    console.log('Console diagnostics: 0');
  }
}

module.exports = { navbarFromDocument, subTabsFromDocument, slug };

if (require.main === module) {
  main();
}

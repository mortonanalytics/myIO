import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { WebR } from "webr";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const repo = resolve(process.argv[2] || "_webr-repo");
const testedWebR = "0.6.0";

function contentType(path) {
  return ({
    ".css": "text/css; charset=utf-8",
    ".gz": "application/gzip",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".rds": "application/octet-stream",
    ".wasm": "application/wasm"
  })[extname(path).toLowerCase()] || "application/octet-stream";
}

function safePath(base, relative) {
  const target = resolve(base, relative);
  if (target !== base && !target.startsWith(base + sep)) {
    throw new Error("Path escapes test root");
  }
  return target;
}

function verificationPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>myIO WebR verification</title>
  <script src="/assets/inst/htmlwidgets/lib/d3.min.js"></script>
  <script src="/assets/inst/htmlwidgets/myIO/myIOapi.js"></script>
  <link rel="stylesheet" href="/assets/inst/htmlwidgets/myIO/style.css">
</head>
<body>
  <main><div id="chart" style="width:640px;height:400px"></div></main>
  <script>
    window.__myioWebRReady = false;
    fetch("/payload.json")
      .then(function(response) {
        if (!response.ok) throw new Error("payload request failed: " + response.status);
        return response.json();
      })
      .then(function(payload) {
        window.__myioWebRChart = new myIOchart({
          element: document.getElementById("chart"),
          width: 640,
          height: 400,
          config: payload.config
        });
        window.__myioWebRReady = true;
      })
      .catch(function(error) {
        window.__myioWebRError = String(error && (error.stack || error));
        throw error;
      });
  </script>
</body>
</html>`;
}

async function listen(payload) {
  const server = createServer(async (request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      if (url.pathname === "/payload.json") {
        response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        response.end(payload);
        return;
      }
      if (url.pathname === "/verify.html" || url.pathname === "/") {
        response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
        response.end(verificationPage());
        return;
      }

      let file;
      if (url.pathname.startsWith("/repo/")) {
        file = safePath(repo, decodeURIComponent(url.pathname.slice("/repo/".length)));
      } else if (url.pathname.startsWith("/assets/")) {
        file = safePath(root, decodeURIComponent(url.pathname.slice("/assets/".length)));
      } else {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const body = await readFile(file);
      response.writeHead(200, { "content-type": contentType(file) });
      response.end(body);
    } catch (error) {
      response.writeHead(404);
      response.end(String(error));
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("WebR test server did not bind");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

let browser;
let server;
let webR;
try {
  const bootstrap = await listen("null");
  server = bootstrap.server;
  const baseUrl = bootstrap.url;

  webR = new WebR();
  await webR.init();
  if (webR.version !== testedWebR) {
    throw new Error(`Expected WebR ${testedWebR}, received ${webR.version}`);
  }
  await webR.installPackages("myIO", {
    repos: [`${baseUrl}/repo`, "https://repo.r-wasm.org"],
    quiet: true
  });
  const payload = await webR.evalRString(`
    suppressPackageStartupMessages(library(myIO))
    widget <- myIO(data.frame(x = c(1, 2, 3), y = c(2, 4, 8))) |>
      addIoLayer(
        type = "point",
        label = "WebR points",
        mapping = list(x_var = "x", y_var = "y")
      )
    jsonlite::toJSON(
      widget$x,
      auto_unbox = TRUE,
      dataframe = "rows",
      null = "null",
      na = "null",
      digits = NA
    )
  `);
  const parsed = JSON.parse(payload);
  if (parsed.config.specVersion !== 2 || parsed.config.layers.length !== 1) {
    throw new Error("WebR produced an invalid myIO widget payload");
  }

  await new Promise((resolveClose) => server.close(resolveClose));
  const render = await listen(payload);
  server = render.server;

  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`page: ${error}`));
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(`console: ${message.text()}`);
  });
  await page.goto(`${render.url}/verify.html`);
  await page.waitForFunction(() => window.__myioWebRReady === true || window.__myioWebRError, null, {
    timeout: 15_000
  });
  const pageFailure = await page.evaluate(() => window.__myioWebRError || null);
  if (pageFailure) runtimeErrors.push(pageFailure);
  const svgVisible = await page.locator("#chart svg.myIO-svg").isVisible();
  const pointCount = await page.locator("#chart circle[class^='tag-point']").count();
  if (!svgVisible) runtimeErrors.push("production bundle did not render a visible SVG");
  if (pointCount !== 3) runtimeErrors.push(`expected 3 point marks, received ${pointCount}`);
  if (runtimeErrors.length) throw new Error(runtimeErrors.join("\n"));

  console.log(`WebR ${testedWebR}: library load, payload transfer, and Chromium render passed`);
} finally {
  if (browser) await browser.close();
  if (webR) webR.close();
  if (server?.listening) await new Promise((resolveClose) => server.close(resolveClose));
}

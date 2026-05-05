# Large-data linking with myIO

## When to use this

myIO’s default SVG path handles up to about 20,000 rendered marks
comfortably. Beyond that, the big-data tier uses a coordinator, an
engine adapter, and optional Canvas or WebGL rendering so charts can
respond to brush and zoom interactions over millions of rows. Opt in per
chart by calling `setBigData(widget, source)`.

## Installation

Big-data features require two optional components.

First, install the Suggested R packages used for Arrow encoding, DuckDB
queries, downloads, checksums, and status output:

``` r

install.packages(c("arrow", "duckdb", "DBI", "base64enc", "cli", "curl", "openssl"))
```

Second, install the DuckDB-WASM runtime when you plan to use the browser
engine. The runtime is downloaded on demand by
[`myIO::install_duckdb_wasm()`](https://mortonanalytics.github.io/myIO/reference/install_duckdb_wasm.md)
and is not bundled in the CRAN tarball. It is cached under
`tools::R_user_dir("myIO", "cache")`. For airgapped machines, place
`duckdb-mvp.wasm` and `duckdb-browser-mvp.worker.js` in a local
directory and call `install_duckdb_wasm(from = "/path/to/dir")`.

``` r

install.packages(c("arrow", "duckdb", "DBI", "base64enc", "cli", "curl", "openssl"))
myIO::install_duckdb_wasm()
myIO::duckdb_wasm_status()
```

## Attaching big data

[`setBigData()`](https://mortonanalytics.github.io/myIO/reference/setBigData.md)
accepts several source types. A `data.frame` is encoded as inline Arrow
IPC. This is convenient for portable HTML, but it warns above 50 MB and
hard-errors above 200 MB.

``` r
\dontrun{
library(myIO)

big <- data.frame(
  id = seq_len(1e6),
  x = rnorm(1e6),
  y = rnorm(1e6)
)

myIO(engine = "wasm") |>
  addIoLayer(type = "point", label = "points",
             mapping = list(x_var = "x", y_var = "y")) |>
  setBigData(big, rowkey_col = "id")
}
```

An
[`arrow::Table`](https://arrow.apache.org/docs/r/reference/Table-class.html)
uses the same inline IPC path.

``` r
\dontrun{
library(arrow)
library(myIO)

tab <- arrow_table(big)

myIO(engine = "wasm") |>
  addIoLayer(type = "point", label = "points",
             mapping = list(x_var = "x", y_var = "y")) |>
  setBigData(tab, rowkey_col = "id")
}
```

For larger static assets, pass a local path or URL ending in `.parquet`,
`.csv`, `.arrow`, or `.feather`.

``` r
\dontrun{
myIO(engine = "wasm") |>
  addIoLayer(type = "histogram", label = "x",
             mapping = list(x_var = "x")) |>
  setBigData("data/observations.parquet", rowkey_col = "id")

myIO(engine = "wasm") |>
  addIoLayer(type = "point", label = "remote",
             mapping = list(x_var = "x", y_var = "y")) |>
  setBigData("https://example.org/observations.csv", rowkey_col = "id")
}
```

A `DBI` connection is server-engine-only. Provide `table = "..."` so
myIO can read the schema.

``` r
\dontrun{
library(DBI)
library(duckdb)
library(myIO)

con <- dbConnect(duckdb())
dbWriteTable(con, "observations", big)

myIO(engine = "server") |>
  addIoLayer(type = "point", label = "points",
             mapping = list(x_var = "x", y_var = "y")) |>
  setBigData(con, table = "observations", rowkey_col = "id")
}
```

## The engine argument

Use `engine = "auto"`, `"server"`, `"wasm"`, or `"svg"` on
[`myIO()`](https://mortonanalytics.github.io/myIO/reference/myIO.md).
`"auto"` is the default: a Shiny session resolves to `"server"`;
otherwise it resolves to `"wasm"`. `"server"` runs queries in R with
`duckdb` and streams Arrow batches to the browser, which is a good fit
when a Shiny server already exists. `"wasm"` runs DuckDB in the browser
from the cached WASM runtime, which fits static Quarto or R Markdown
HTML. `"svg"` forces the legacy SVG path without the coordinator and is
mainly useful for testing.

## Crosstalk threshold

By default, myIO broadcasts row keys to
[`crosstalk::SharedData`](https://rdrr.io/pkg/crosstalk/man/SharedData.html)
only when the selected row count is at or below 100,000. Below the
threshold, sibling htmlwidgets such as plotly, leaflet, and reactable
can react to myIO brushes. Above it, upward broadcast is suppressed;
myIO-to-myIO linking still works through predicates, a one-shot console
info is emitted, and the footer badge reads `linked: predicate-only`.

Tune the limit with:

``` r

options(myIO.crosstalk_threshold = 50000L)
```

The threshold is per selection, not per chart. A narrow brush on a
million-row source can still broadcast if it matches few rows.

## File-protocol limitation

When a Quarto or R Markdown HTML file is opened directly from the file
manager with the `file://` protocol, Chromium blocks dynamic module
imports. myIO detects this and falls back to the SVG path with a
one-shot console info. To use the WASM engine on a local static HTML,
serve it with `servr::httd()` or `quarto preview`.

## Performance expectations

| Input rows | Engine | Renderer | Interaction |
|----|----|----|----|
| \<= 20k | `svg` (default) | D3 SVG | Full brush/zoom, publication-quality |
| 20k-100k | `svg` + aggregation | D3 SVG | Smooth; tooltips on pre-aggregated data |
| 100k-1M | `wasm` or `server` | Canvas or WebGL | Sub-200ms brush re-aggregation (WASM), sub-500ms (server Shiny) |
| 1M-10M | `wasm` or `server` | WebGL | Target: 60fps pan/zoom; brush re-agg \< 300ms |

## Limits and gotchas

Inline IPC above 200 MB hard-errors; use file paths or a `DBI`
connection. The Crosstalk threshold depends on which rows match the
current selection. The WASM binary is about 22 MB, downloads once per
user per version, and is cached indefinitely; clear it with
[`clear_duckdb_wasm_cache()`](https://mortonanalytics.github.io/myIO/reference/clear_duckdb_wasm_cache.md).
On Posit Connect or shinyapps.io, use the `"server"` engine;
[`install_duckdb_wasm()`](https://mortonanalytics.github.io/myIO/reference/install_duckdb_wasm.md)
is not needed on the server.

## Minimal complete example

``` r
\dontrun{
library(myIO)

install.packages(c("arrow", "duckdb", "DBI", "base64enc", "cli", "curl", "openssl"))
myIO::install_duckdb_wasm()

set.seed(1)
events <- data.frame(
  id = seq_len(250000),
  time = as.POSIXct("2026-01-01", tz = "UTC") + seq_len(250000),
  x = rnorm(250000),
  y = rnorm(250000),
  group = sample(LETTERS[1:4], 250000, replace = TRUE)
)

myIO(engine = "wasm") |>
  addIoLayer(type = "point", label = "events",
             mapping = list(x_var = "x", y_var = "y", color = "group")) |>
  setBrush(direction = "xy") |>
  setBigData(events, rowkey_col = "id")
}
```

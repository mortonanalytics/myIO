# Install the DuckDB-WASM binary for large-dataset virtualization

Downloads and verifies the DuckDB-WASM runtime into a user-local cache
so the in-browser big-data engine is available for subsequent widgets.
This follows the keras3 / torch / reticulate pattern: the binary is NOT
bundled with the R package and is not required for small-data use.

## Usage

``` r
install_duckdb_wasm(
  version = NULL,
  from = NULL,
  force = FALSE,
  quiet = !interactive()
)
```

## Arguments

- version:

  Character scalar naming the version to install. Defaults to the latest
  row in \`inst/duckdb-wasm-manifest.csv\`.

- from:

  Optional local directory containing pre-downloaded binaries
  (\`duckdb-mvp.wasm\` and \`duckdb-browser-mvp.worker.js\`). Airgap
  path.

- force:

  Logical. If TRUE, overwrite existing cached binaries.

- quiet:

  Logical. Suppress progress output. Defaults to \`!interactive()\`.

## Value

Invisibly returns the cache path where the binary was installed.

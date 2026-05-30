# DuckDB-WASM cache status

DuckDB-WASM cache status

## Usage

``` r
duckdb_wasm_status()
```

## Value

A list with class \`myIO_duckdb_wasm_status\` and fields \`installed\`
(logical), \`version\` (chr or NA), \`cache_dir\` (chr), \`size_bytes\`
(numeric).

## Examples

``` r
duckdb_wasm_status()
#> myIO DuckDB-WASM status:
#>   installed:  FALSE
#>   version:    (none)
#>   cache_dir:  /home/runner/.cache/R/myIO/duckdb-wasm
#>   size_bytes: 0
```

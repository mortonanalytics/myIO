# Remove DuckDB-WASM cache entries

Remove DuckDB-WASM cache entries

## Usage

``` r
clear_duckdb_wasm_cache(version = NULL)
```

## Arguments

- version:

  Character scalar naming a specific version to remove. If NULL, removes
  all cached versions.

## Value

Number of removed entries, invisibly.

## Examples

``` r
# \donttest{
# Removes cached DuckDB-WASM binaries from the user cache.
clear_duckdb_wasm_cache()
# }
```

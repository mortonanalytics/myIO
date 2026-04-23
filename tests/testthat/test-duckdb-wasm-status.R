local_cache_env <- function() {
  tmp_cache <- tempfile("myio-cache-")
  old_cache <- Sys.getenv("R_USER_CACHE_DIR", unset = NA_character_)
  Sys.setenv(R_USER_CACHE_DIR = tmp_cache)

  list(
    path = tmp_cache,
    cleanup = function() {
      if (is.na(old_cache)) {
        Sys.unsetenv("R_USER_CACHE_DIR")
      } else {
        Sys.setenv(R_USER_CACHE_DIR = old_cache)
      }
      unlink(tmp_cache, recursive = TRUE, force = TRUE)
    }
  )
}

test_that("print.myIO_duckdb_wasm_status emits readable output", {
  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  status <- myIO::duckdb_wasm_status()
  output <- capture.output(print(status))
  text <- paste(output, collapse = "\n")
  expect_match(text, "installed")
  expect_match(text, "cache_dir")
})

test_that("duckdb_wasm_status size_bytes is numeric 0 when no cache", {
  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  status <- myIO::duckdb_wasm_status()
  expect_type(status$size_bytes, "double")
  expect_equal(status$size_bytes, 0)
})

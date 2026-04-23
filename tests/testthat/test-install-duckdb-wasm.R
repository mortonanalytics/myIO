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

test_that("install_duckdb_wasm from= local dir copies files without network", {
  skip_on_cran()
  skip_if_not_installed("openssl")
  if (!dir.exists("/tmp/duckdb-fixture")) {
    skip("Real fixture at /tmp/duckdb-fixture not available")
  }

  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  path <- myIO::install_duckdb_wasm(from = "/tmp/duckdb-fixture", quiet = TRUE)
  expect_true(dir.exists(path))
  expect_true(file.exists(file.path(path, "duckdb-mvp.wasm")))
  expect_true(file.exists(file.path(path, "duckdb-browser-mvp.worker.js")))
})

test_that("install_duckdb_wasm raises checksum error on tampered file", {
  skip_on_cran()
  skip_if_not_installed("openssl")

  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  fake_dir <- tempfile("fake-fixture-")
  dir.create(fake_dir)
  on.exit(unlink(fake_dir, recursive = TRUE, force = TRUE), add = TRUE)
  writeLines("not the wasm", file.path(fake_dir, "duckdb-mvp.wasm"))
  writeLines("not the worker", file.path(fake_dir, "duckdb-browser-mvp.worker.js"))

  err <- tryCatch(
    myIO::install_duckdb_wasm(from = fake_dir, quiet = TRUE),
    error = function(e) e
  )
  expect_s3_class(err, "myIOError_duckdb_wasm_checksum")
})

test_that("duckdb_wasm_status returns installed=FALSE with no cache", {
  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  status <- myIO::duckdb_wasm_status()
  expect_s3_class(status, "myIO_duckdb_wasm_status")
  expect_false(status$installed)
  expect_true(is.na(status$version))
  expect_equal(status$size_bytes, 0)
})

test_that("duckdb_wasm_status reflects an installed cache", {
  skip_on_cran()
  skip_if_not_installed("openssl")
  if (!dir.exists("/tmp/duckdb-fixture")) {
    skip("Real fixture at /tmp/duckdb-fixture not available")
  }

  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  myIO::install_duckdb_wasm(from = "/tmp/duckdb-fixture", quiet = TRUE)
  status <- myIO::duckdb_wasm_status()
  expect_true(status$installed)
  expect_equal(status$version, "1.28.0")
  expect_gt(status$size_bytes, 1e6)
})

test_that("clear_duckdb_wasm_cache removes installed entries", {
  skip_on_cran()
  skip_if_not_installed("openssl")
  if (!dir.exists("/tmp/duckdb-fixture")) {
    skip("Real fixture at /tmp/duckdb-fixture not available")
  }

  cache <- local_cache_env()
  on.exit(cache$cleanup(), add = TRUE)

  myIO::install_duckdb_wasm(from = "/tmp/duckdb-fixture", quiet = TRUE)
  expect_true(myIO::duckdb_wasm_status()$installed)
  myIO::clear_duckdb_wasm_cache()
  expect_false(myIO::duckdb_wasm_status()$installed)
})

test_that("install_duckdb_wasm rejects unknown version", {
  err <- tryCatch(
    myIO::install_duckdb_wasm(version = "9.99.99", quiet = TRUE),
    error = function(e) e
  )
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "unknown version")
})

test_that("resolve_engine returns explicit server/wasm/svg unchanged", {
  expect_equal(myIO:::resolve_engine("server"), "server")
  expect_equal(myIO:::resolve_engine("wasm"), "wasm")
  expect_equal(myIO:::resolve_engine("svg"), "svg")
})

test_that("resolve_engine with 'auto' returns 'server' when Shiny is running", {
  skip_if_not_installed("shiny")
  skip_if_not_installed("mockery")

  mockery::stub(myIO:::resolve_engine, "shiny::isRunning", function() TRUE)
  expect_equal(myIO:::resolve_engine("auto"), "server")
})

test_that("resolve_engine with 'auto' returns 'wasm' when Shiny not running", {
  skip_if_not_installed("shiny")
  skip_if_not_installed("mockery")

  mockery::stub(myIO:::resolve_engine, "shiny::isRunning", function() FALSE)
  expect_equal(myIO:::resolve_engine("auto"), "wasm")
})

test_that("resolve_engine honors options('myIO.engine') override when input is 'auto'", {
  skip_if_not_installed("shiny")
  skip_if_not_installed("mockery")
  skip_if_not_installed("withr")

  withr::local_options(myIO.engine = "wasm")
  mockery::stub(myIO:::resolve_engine, "shiny::isRunning", function() TRUE)
  expect_equal(myIO:::resolve_engine("auto"), "wasm")
})

test_that("resolve_engine rejects unknown engine names", {
  expect_error(myIO:::resolve_engine("nuclear"))
})

test_that("new_source_id and new_chart_id produce 16 hex chars", {
  expect_true(grepl("^[0-9a-f]{16}$", myIO:::new_source_id()))
  expect_true(grepl("^[0-9a-f]{16}$", myIO:::new_chart_id()))
})

test_that("new_source_id produces distinct values across calls", {
  ids <- replicate(100, myIO:::new_source_id())
  expect_equal(length(unique(ids)), 100)
})

test_that("wasm_cache_url_for returns NULL when cache is absent", {
  expect_null(myIO:::wasm_cache_url_for("wasm"))
})

test_that("wasm_cache_url_for returns NULL for non-wasm engines", {
  expect_null(myIO:::wasm_cache_url_for("server"))
  expect_null(myIO:::wasm_cache_url_for("svg"))
})

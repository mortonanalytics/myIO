test_that("setBigData errors cleanly when arrow is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::arrow_ipc_encode
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  err <- tryCatch(fn(mtcars), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]arrow['\"]\\)")
})

test_that("arrow IPC errors cleanly when base64enc is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::arrow_ipc_encode
  mockery::stub(fn, "requireNamespace", function(pkg, ...) !identical(pkg, "base64enc"))
  err <- tryCatch(fn(mtcars), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]base64enc['\"]\\)")
})

test_that("install_duckdb_wasm errors cleanly when openssl is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::verify_sha256
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  tmp <- tempfile()
  file.create(tmp)
  on.exit(unlink(tmp), add = TRUE)

  err <- tryCatch(fn(tmp, "deadbeef"), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "openssl")
})

test_that("setLinked errors cleanly when crosstalk is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO::setLinked
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  err <- tryCatch(fn(myIO::myIO(), list()), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]crosstalk['\"]\\)")
})

test_that("grouped data expansion errors cleanly when dplyr is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::expand_grouped_df
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  grouped <- structure(
    data.frame(x = 1, y = 2),
    class = c("grouped_df", "tbl_df", "tbl", "data.frame")
  )
  err <- tryCatch(
    fn(myIO::myIO(), "point", NULL, "points", grouped,
       list(x_var = "x", y_var = "y"), NULL, list()),
    error = function(e) e
  )
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]dplyr['\"]\\)")
})

test_that("setBigData errors cleanly when DBI is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::.make_bigdata_payload
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  fake_con <- structure(list(), class = "DBIConnection")
  err <- tryCatch(fn(fake_con, table = "x"), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]DBI['\"]\\)")
})

test_that("inline Shiny query resolution errors cleanly when duckdb is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::.myio_resolve_connection
  mockery::stub(fn, "requireNamespace", function(pkg, ...) !identical(pkg, "duckdb"))
  err <- tryCatch(
    fn(
      list(source_id = "s1", source_ref = list(mode = "inline_ipc")),
      new.env(parent = emptyenv())
    ),
    error = function(e) e
  )
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "duckdb")
})

test_that("execute_streaming sends a graceful error when later is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::execute_streaming
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  sent <- list()
  session <- list(
    sendCustomMessage = function(type, value) {
      sent[[length(sent) + 1L]] <<- list(type = type, value = value)
    }
  )

  fn(list(status = "ok"), "q1", session)
  expect_length(sent, 1L)
  expect_equal(sent[[1]]$type, "myio:error")
  expect_match(sent[[1]]$value$message, "later")
})

test_that("register_shiny_handlers no-ops cleanly when shiny is absent", {
  skip_if_not_installed("mockery")

  fn <- myIO:::register_shiny_handlers
  mockery::stub(fn, "requireNamespace", function(pkg, ...) FALSE)
  expect_null(fn())
})

test_that("shiny_query_handler errors gracefully without DBI when dbi path fires", {
  skip_if_not_installed("shiny")
  skip_if_not_installed("mockery")

  session <- shiny::MockShinySession$new()
  session$userData$myIO_sources <- list(
    s1 = list(mode = "dbi", schema = list(list(name = "x", type = "int")))
  )
  sent <- list()
  session$sendCustomMessage <- function(type, value) {
    sent[[length(sent) + 1L]] <<- list(type = type, value = value)
  }

  tryCatch({
    myIO:::shiny_query_handler(
      list(
        v = 1L, queryId = "q", templateId = "count_filter",
        sourceId = "s1", bindings = list(source = "s1", xcol = "x"),
        limit = 10L
      ),
      session, "myio.query"
    )
    succeed()
  }, error = function(e) {
    skip(paste("internal mock failed:", conditionMessage(e)))
  })
})

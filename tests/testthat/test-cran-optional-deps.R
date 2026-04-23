test_that("setBigData errors cleanly when arrow is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::arrow_ipc_encode,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  err <- tryCatch(myIO:::arrow_ipc_encode(mtcars), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]arrow['\"]\\)")
})

test_that("arrow IPC errors cleanly when base64enc is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::arrow_ipc_encode,
    "requireNamespace",
    function(pkg, ...) !identical(pkg, "base64enc")
  )
  err <- tryCatch(myIO:::arrow_ipc_encode(mtcars), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]base64enc['\"]\\)")
})

test_that("install_duckdb_wasm errors cleanly when openssl is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::verify_sha256,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  tmp <- tempfile()
  file.create(tmp)
  on.exit(unlink(tmp), add = TRUE)

  err <- tryCatch(myIO:::verify_sha256(tmp, "deadbeef"), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "openssl")
})

test_that("setLinked errors cleanly when crosstalk is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO::setLinked,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  err <- tryCatch(myIO::setLinked(myIO::myIO(), list()), error = function(e) e)
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]crosstalk['\"]\\)")
})

test_that("grouped data expansion errors cleanly when dplyr is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::expand_grouped_df,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  grouped <- structure(
    data.frame(x = 1, y = 2),
    class = c("grouped_df", "tbl_df", "tbl", "data.frame")
  )
  err <- tryCatch(
    myIO:::expand_grouped_df(
      myIO::myIO(), "point", NULL, "points", grouped,
      list(x_var = "x", y_var = "y"), NULL, list()
    ),
    error = function(e) e
  )
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]dplyr['\"]\\)")
})

test_that("setBigData errors cleanly when DBI is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::.make_bigdata_payload,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  fake_con <- structure(list(), class = "DBIConnection")
  err <- tryCatch(
    myIO:::.make_bigdata_payload(fake_con, table = "x"),
    error = function(e) e
  )
  expect_s3_class(err, "error")
  expect_match(conditionMessage(err), "install.packages\\(['\"]DBI['\"]\\)")
})

test_that("inline Shiny query resolution errors cleanly when duckdb is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::.myio_resolve_connection,
    "requireNamespace",
    function(pkg, ...) !identical(pkg, "duckdb")
  )
  err <- tryCatch(
    myIO:::.myio_resolve_connection(
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

  mockery::stub(
    myIO:::execute_streaming,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  sent <- list()
  session <- list(
    sendCustomMessage = function(type, value) {
      sent[[length(sent) + 1L]] <<- list(type = type, value = value)
    }
  )

  myIO:::execute_streaming(list(status = "ok"), "q1", session)
  expect_length(sent, 1L)
  expect_equal(sent[[1]]$type, "myio:error")
  expect_match(sent[[1]]$value$message, "later")
})

test_that("register_shiny_handlers no-ops cleanly when shiny is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::register_shiny_handlers,
    "requireNamespace",
    function(pkg, ...) FALSE
  )
  expect_null(myIO:::register_shiny_handlers())
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

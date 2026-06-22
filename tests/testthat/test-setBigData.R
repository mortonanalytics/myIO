test_that("setBigData with data.frame emits inline_ipc mode and auto rowkey", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")
  w <- myIO::myIO(data = mtcars) |> myIO:::setBigData(mtcars)
  expect_equal(w$x$bigdata$mode, "inline_ipc")
  expect_true(nchar(w$x$bigdata$ipc_b64) > 100)
  expect_equal(w$x$bigdata$row_count, 32L)
  expect_equal(w$x$bigdata$rowkey_col, "__myio_rowkey__")
  expect_true(w$x$config$coordinator_enabled)
  expect_true(w$x$config$engine %in% c("wasm", "server"))
})

test_that("setBigData with arrow::Table emits inline_ipc", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")
  df <- mtcars
  df$`__myio_rowkey__` <- as.character(seq_len(nrow(df)))
  tbl <- arrow::as_arrow_table(df)
  w <- myIO::myIO() |> myIO:::setBigData(tbl)
  expect_equal(w$x$bigdata$mode, "inline_ipc")
  expect_true(nchar(w$x$bigdata$ipc_b64) > 100)
})

test_that("setBigData with a .parquet URL emits url mode when schema is explicit", {
  w <- myIO::myIO() |>
    myIO:::setBigData("https://example.com/data.parquet", schema = c("x", "y"), row_count = 100)
  expect_equal(w$x$bigdata$mode, "url")
  expect_equal(w$x$bigdata$url, "https://example.com/data.parquet")
  expect_equal(vapply(w$x$bigdata$schema, `[[`, character(1), "name"), c("x", "y"))
  expect_equal(w$x$bigdata$row_count, 100L)
  expect_null(w$x$bigdata$ipc_b64)
})

test_that("setBigData with URL or file source requires explicit schema", {
  expect_error(
    myIO::myIO() |> myIO:::setBigData("https://example.com/data.parquet"),
    "schema"
  )
})

test_that("setBigData with a .csv local path emits url mode", {
  tmp <- tempfile(fileext = ".csv")
  file.create(tmp)
  on.exit(unlink(tmp), add = TRUE)
  w <- myIO::myIO() |> myIO:::setBigData(tmp, schema = c("x", "y"))
  expect_equal(w$x$bigdata$mode, "url")
  expect_equal(w$x$bigdata$url, normalizePath(tmp, winslash = "/", mustWork = FALSE))
})

test_that("setBigData with unsupported source class raises myIOError_engine_unsupported_source", {
  w <- myIO::myIO()
  err <- tryCatch(myIO:::setBigData(w, list(a = 1)), error = function(e) e)
  expect_s3_class(err, "myIOError_engine_unsupported_source")
})

test_that("setBigData preserves rowkey_col when user supplies it", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")
  df <- data.frame(id = 1:5, val = rnorm(5))
  w <- myIO::myIO() |> myIO:::setBigData(df, rowkeyCol = "id")
  expect_equal(w$x$bigdata$rowkey_col, "id")
})

test_that("setBigData rejects rowkey_col that is not in the source schema", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")
  df <- data.frame(a = 1, b = 2)
  err <- tryCatch(myIO:::setBigData(myIO::myIO(), df, rowkeyCol = "nope"),
                  error = function(e) e)
  expect_s3_class(err, "myIOError_engine_unsupported_source")
})

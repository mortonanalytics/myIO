test_that("arrow_ipc_encode round-trips a data.frame through IPC", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")

  b64 <- myIO:::arrow_ipc_encode(mtcars)
  raw_bytes <- base64enc::base64decode(b64)
  con <- rawConnection(raw_bytes)
  on.exit(try(close(con), silent = TRUE), add = TRUE)
  decoded <- arrow::read_ipc_stream(con)

  expect_equal(names(as.data.frame(decoded)), names(mtcars))
  expect_equal(nrow(decoded), nrow(mtcars))
})

test_that("arrow_ipc_schema returns fields matching column names", {
  skip_if_not_installed("arrow")

  schema <- myIO:::arrow_ipc_schema(mtcars)
  expect_length(schema, ncol(mtcars))
  expect_equal(vapply(schema, `[[`, character(1), "name"), names(mtcars))
})

test_that("arrow_ipc_encode accepts an arrow::Table directly", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")

  tbl <- arrow::as_arrow_table(mtcars)
  b64 <- myIO:::arrow_ipc_encode(tbl)
  expect_type(b64, "character")
  expect_length(b64, 1)
  expect_gt(nchar(b64), 0)
})

test_that("arrow_ipc_encode rejects unsupported types", {
  skip_if_not_installed("arrow")
  skip_if_not_installed("base64enc")

  expect_error(
    myIO:::arrow_ipc_encode(list(a = 1)),
    regexp = "unsupported|expected"
  )
})

test_that("arrow_ipc_encode errors with install pointer when arrow is absent", {
  skip_if_not_installed("mockery")

  mockery::stub(
    myIO:::arrow_ipc_encode,
    "requireNamespace",
    function(...) FALSE
  )
  expect_error(
    myIO:::arrow_ipc_encode(mtcars),
    regexp = "install\\.packages\\('arrow'\\)"
  )
})

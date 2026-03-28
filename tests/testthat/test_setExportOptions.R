# Contract tests for export options (v1.2)

test_that("setExportOptions stores config", {
  p <- myIO(iris) |> setExportOptions(pdf = FALSE, title = "My Chart")
  expect_false(p$x$config$export$pdf)
  expect_equal(p$x$config$export$title, "My Chart")
})

test_that("default export config is NULL", {
  p <- myIO(iris)
  expect_null(p$x$config$export)
})

test_that("setExportOptions sets all flags", {
  p <- myIO(iris) |> setExportOptions(
    png = FALSE, svg = TRUE, pdf = FALSE,
    clipboard = TRUE, csv = FALSE, title = "Test"
  )
  expect_false(p$x$config$export$png)
  expect_true(p$x$config$export$svg)
  expect_false(p$x$config$export$pdf)
  expect_true(p$x$config$export$clipboard)
  expect_false(p$x$config$export$csv)
  expect_equal(p$x$config$export$title, "Test")
})

test_that("setExportOptions defaults all to TRUE", {
  p <- myIO(iris) |> setExportOptions()
  expect_true(p$x$config$export$png)
  expect_true(p$x$config$export$svg)
  expect_true(p$x$config$export$clipboard)
  expect_true(p$x$config$export$csv)
})

test_that("setExportOptions title defaults to NULL", {
  p <- myIO(iris) |> setExportOptions()
  expect_null(p$x$config$export$title)
})

test_that("setExportOptions validates myIO object", {
  expect_error(setExportOptions("not_a_widget"))
})

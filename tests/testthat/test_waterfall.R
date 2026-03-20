test_that("waterfall auto-applies cumulative transform", {
  df <- data.frame(step = c("Start", "Add", "Sub"), value = c(100, 30, -20), stringsAsFactors = FALSE)

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "waterfall",
    label = "wf",
    data = df,
    mapping = list(x_var = "step", y_var = "value")
  )

  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "waterfall")
  expect_equal(layer$transform, "cumulative")
  expect_equal(layer$data[[1]][["_base_y"]], 0)
  expect_equal(layer$data[[1]][["_cumulative_y"]], 100)
})

test_that("waterfall total rows render from zero", {
  df <- data.frame(
    step = c("A", "B", "Total"),
    value = c(10, 5, NA),
    is_total = c(FALSE, FALSE, TRUE),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "waterfall",
    label = "wf",
    data = df,
    mapping = list(x_var = "step", y_var = "value", total = "is_total")
  )

  total_row <- w$x$config$layers[[1]]$data[[3]]
  expect_equal(total_row[["_base_y"]], 0)
  expect_equal(total_row[["_cumulative_y"]], 15)
  expect_true(total_row[["_is_total"]])
})

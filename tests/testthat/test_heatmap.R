test_that("addIoLayer accepts heatmap mappings", {
  df <- data.frame(x = c("A", "B"), y = c("C", "D"), value = c(1, 2), stringsAsFactors = FALSE)

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "heatmap",
    label = "heat",
    data = df,
    mapping = list(x_var = "x", y_var = "y", value = "value")
  )

  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "heatmap")
  expect_equal(layer$transform, "identity")
  expect_equal(layer$mapping$value, "value")
})

test_that("addIoLayer rejects missing heatmap value mapping", {
  df <- data.frame(x = c("A", "B"), y = c("C", "D"), value = c(1, 2), stringsAsFactors = FALSE)

  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "heatmap",
      label = "heat",
      data = df,
      mapping = list(x_var = "x", y_var = "y")
    ),
    "Missing required mapping"
  )
})

test_that("addIoLayer rejects non-numeric heatmap value", {
  df <- data.frame(x = c("A", "B"), y = c("C", "D"), value = c("one", "two"), stringsAsFactors = FALSE)

  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "heatmap",
      label = "heat",
      data = df,
      mapping = list(x_var = "x", y_var = "y", value = "value")
    ),
    "must be numeric"
  )
})

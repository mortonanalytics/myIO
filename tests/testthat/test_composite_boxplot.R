test_that("boxplot expands to box, whisker, median, and outlier layers", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12, 13),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "boxplot",
    label = "bp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )

  layers <- w$x$config$layers
  expect_length(layers, 4)
  expect_true(all(vapply(layers, function(layer) identical(layer$`_composite`, "boxplot"), logical(1))))
  expect_true(all(vapply(layers, function(layer) !is.null(layer$`_compositeRole`), logical(1))))
  expect_true(any(vapply(layers, function(layer) layer$type == "area" && layer$`_compositeRole` == "iqr_box", logical(1))))
  expect_true(any(vapply(layers, function(layer) layer$type == "point" && layer$`_compositeRole` == "median", logical(1))))
})

test_that("boxplot can include outliers when enabled", {
  df <- data.frame(
    group = c("A", "A", "A", "A", "B", "B", "B", "B"),
    value = c(1, 2, 3, 100, 10, 11, 12, 13),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "boxplot",
    label = "bp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = TRUE)
  )

  layers <- w$x$config$layers
  expect_equal(length(layers), 5)
  expect_true(any(vapply(layers, function(layer) layer$`_compositeRole` == "outliers", logical(1))))
})

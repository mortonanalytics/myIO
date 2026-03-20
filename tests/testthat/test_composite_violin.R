test_that("violin expands to density, box, and median layers", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "violin",
    label = "vio",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showBox = TRUE, showMedian = TRUE, showPoints = FALSE)
  )

  layers <- w$x$config$layers
  expect_length(layers, 4)
  area_count <- sum(vapply(layers, function(layer) layer$type == "area", logical(1)))
  range_count <- sum(vapply(layers, function(layer) layer$type == "rangeBar", logical(1)))
  expect_true(area_count >= 1)
  expect_true(range_count >= 1)
  expect_true(any(vapply(layers, function(layer) layer$`_compositeRole` == "density_area", logical(1))))
  expect_true(any(vapply(layers, function(layer) layer$`_compositeRole` == "iqr_box", logical(1))))
  expect_true(any(vapply(layers, function(layer) layer$`_compositeRole` == "median", logical(1))))
})

test_that("violin can include jittered raw points", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "violin",
    label = "vio",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showBox = FALSE, showMedian = TRUE, showPoints = TRUE)
  )

  layers <- w$x$config$layers
  expect_true(any(vapply(layers, function(layer) layer$`_compositeRole` == "points", logical(1))))
})

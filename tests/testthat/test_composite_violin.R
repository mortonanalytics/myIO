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
  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B"))
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

test_that("violin median layer carries the range mapping the median marker needs", {
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

  median_layer <- Filter(
    function(layer) identical(layer$`_compositeRole`, "median"),
    w$x$config$layers
  )[[1]]

  expect_equal(median_layer$mapping$low_y, "low_y")
  expect_equal(median_layer$mapping$high_y, "high_y")
  expect_equal(median_layer$data[[1]]$low_y, median_layer$data[[1]]$y_var)
  expect_equal(median_layer$data[[1]]$high_y, median_layer$data[[1]]$y_var)
})

test_that("violin orders groups deterministically and keeps each box and median with its group", {
  df <- data.frame(
    group = c(rep("C", 6), rep("A", 6), rep("B", 6)),
    value = c(1000:1005, 1:6, 100:105),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(), type = "violin", label = "v", data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showBox = TRUE, showMedian = TRUE, showPoints = FALSE)
  )

  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B", `3` = "C"))

  dens <- Filter(function(l) identical(l$`_compositeRole`, "density_area"), w$x$config$layers)
  expect_equal(vapply(dens, function(l) l$data[[1]]$group, character(1)), c("A", "B", "C"))
  expect_equal(vapply(dens, function(l) as.numeric(l$data[[1]]$x_var), numeric(1)), c(1, 2, 3))

  med <- Filter(function(l) identical(l$`_compositeRole`, "median"), w$x$config$layers)[[1]]
  rows <- stats::setNames(med$data, vapply(med$data, function(r) r$group, character(1)))
  expect_equal(as.numeric(rows[["A"]]$x_var), 1); expect_equal(rows[["A"]]$y_var, 3.5)
  expect_equal(as.numeric(rows[["B"]]$x_var), 2); expect_equal(rows[["B"]]$y_var, 102.5)
  expect_equal(as.numeric(rows[["C"]]$x_var), 3); expect_equal(rows[["C"]]$y_var, 1002.5)
})

test_that("ridgeline expands to one density area per group", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  layers <- w$x$config$layers
  expect_length(layers, 2)
  expect_true(all(vapply(layers, function(layer) layer$type == "area", logical(1))))
  expect_true(all(vapply(layers, function(layer) layer$`_compositeRole` == "density_area", logical(1))))
})

test_that("ridgeline offsets later groups vertically", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  first_layer <- w$x$config$layers[[1]]
  second_layer <- w$x$config$layers[[2]]
  offset_diff <- second_layer$data[[1]]$low_y - first_layer$data[[1]]$low_y

  expect_true(all(abs(offset_diff - offset_diff[[1]]) < 1e-8))
  expect_gt(offset_diff[[1]], 0)
})

test_that("ridgeline names each group on the y axis", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  expect_equal(w$x$config$axes$yTickLabels, list(`1` = "A", `2` = "B"))
  expect_equal(w$x$config$axes$yAxisLabel, "group")
  expect_null(w$x$config$axes$xTickLabels)
})

test_that("an explicit y axis label still wins over the ridgeline default", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60),
    group = c("A", "A", "A", "B", "B", "B"),
    stringsAsFactors = FALSE
  )

  w <- myIO::setAxisFormat(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "ridgeline",
      label = "ridge",
      data = df,
      mapping = list(x_var = "value", y_var = "aux", group = "group"),
      options = list(overlap = 0.5, bandwidth = "nrd0")
    ),
    yLabel = "Cylinders"
  )

  expect_equal(w$x$config$axes$yAxisLabel, "Cylinders")
  expect_equal(w$x$config$axes$yTickLabels, list(`1` = "A", `2` = "B"))
})

test_that("ridgeline stacks groups in sorted order, not data-encounter order", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60, 70, 80, 90),
    group = c("6", "6", "6", "4", "4", "4", "8", "8", "8"),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  expect_equal(w$x$config$axes$yTickLabels, list(`1` = "4", `2` = "6", `3` = "8"))
})

test_that("ridgeline honours factor level order over alphabetical order", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60, 70, 80, 90),
    group = factor(
      c("6", "6", "6", "4", "4", "4", "8", "8", "8"),
      levels = c("8", "6", "4")
    ),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  expect_equal(w$x$config$axes$yTickLabels, list(`1` = "8", `2` = "6", `3` = "4"))
})

test_that("ridgeline sorts numeric group columns numerically", {
  df <- data.frame(
    value = c(1, 2, 3, 1, 2, 3, 1, 2, 3),
    aux = c(10, 20, 30, 40, 50, 60, 70, 80, 90),
    group = c(6, 6, 6, 4, 4, 4, 8, 8, 8)
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "ridgeline",
    label = "ridge",
    data = df,
    mapping = list(x_var = "value", y_var = "aux", group = "group"),
    options = list(overlap = 0.5, bandwidth = "nrd0")
  )

  expect_equal(w$x$config$axes$yTickLabels, list(`1` = "4", `2` = "6", `3` = "8"))
})

test_that("ridgeline retains the density for a missing group", {
  df <- myIO:::ensure_source_key(data.frame(x = 1:10, y = 1:10, g = rep(c("a", NA), each = 5)))
  layers <- myIO:::composite_ridgeline(df, list(x_var = "x", y_var = "y", group = "g"), "ridge", NULL, list())
  expect_length(layers, 2L)
  expect_true(all(is.finite(layers[[2]]$data$density)))
  expect_true(all(layers[[2]]$data$low_y == 2))
})

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
  expect_true(any(vapply(layers, function(layer) layer$type == "rangeBar" && layer$`_compositeRole` == "iqr_box", logical(1))))
  expect_true(any(vapply(layers, function(layer) layer$type == "point" && layer$`_compositeRole` == "median", logical(1))))
  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B"))
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

test_that("boxplot orders groups deterministically and keeps every statistic with its own group", {
  df <- data.frame(
    group = c(rep("C", 4), rep("A", 4), rep("B", 4)),
    value = c(1000, 1010, 1020, 1030,  1, 2, 3, 4,  100, 110, 120, 130),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(), type = "boxplot", label = "bp", data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )

  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B", `3` = "C"))

  by_role <- function(role) {
    layer <- Filter(function(l) identical(l$`_compositeRole`, role), w$x$config$layers)[[1]]
    stats::setNames(layer$data, vapply(layer$data, function(r) r$group, character(1)))
  }
  box <- by_role("iqr_box"); med <- by_role("median")
  wlo <- by_role("whisker_low"); whi <- by_role("whisker_high")

  expect_equal(vapply(box[c("A", "B", "C")], function(r) as.numeric(r$x_var), numeric(1)),
               c(A = 1, B = 2, C = 3))

  # each group's statistics must be the ones computed from that group's values
  expect_equal(box[["A"]]$low_y, 1.75);   expect_equal(box[["A"]]$high_y, 3.25)
  expect_equal(box[["B"]]$low_y, 107.5);  expect_equal(box[["B"]]$high_y, 122.5)
  expect_equal(box[["C"]]$low_y, 1007.5); expect_equal(box[["C"]]$high_y, 1022.5)
  expect_equal(med[["A"]]$y_var, 2.5)
  expect_equal(med[["B"]]$y_var, 115)
  expect_equal(med[["C"]]$y_var, 1015)
  expect_equal(wlo[["A"]]$y_var, 1);    expect_equal(whi[["A"]]$y_var, 4)
  expect_equal(wlo[["B"]]$y_var, 100);  expect_equal(whi[["B"]]$y_var, 130)
  expect_equal(wlo[["C"]]$y_var, 1000); expect_equal(whi[["C"]]$y_var, 1030)
})

test_that("boxplot honours factor level order over alphabetical order", {
  df <- data.frame(
    g = factor(rep(c("mid", "low", "high"), each = 4), levels = c("low", "mid", "high")),
    v = c(50, 51, 52, 53,  1, 2, 3, 4,  900, 910, 920, 930)
  )
  w <- myIO::addIoLayer(
    myIO::myIO(), type = "boxplot", label = "bp", data = df,
    mapping = list(x_var = "g", y_var = "v"), options = list(showOutliers = FALSE)
  )
  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "low", `2` = "mid", `3` = "high"))
  med <- Filter(function(l) identical(l$`_compositeRole`, "median"), w$x$config$layers)[[1]]
  rows <- stats::setNames(med$data, vapply(med$data, function(r) r$group, character(1)))
  expect_equal(rows[["low"]]$y_var, 2.5)
  expect_equal(rows[["mid"]]$y_var, 51.5)
  expect_equal(rows[["high"]]$y_var, 915)
})

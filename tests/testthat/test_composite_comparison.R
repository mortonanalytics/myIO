test_that("comparison expands to boxplot layers + bracket", {
  df <- data.frame(
    group = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 10, 11, 12),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )
  layers <- w$x$config$layers
  expect_equal(length(layers), 5)
  bracket_layers <- Filter(function(l) l$type == "bracket", layers)
  expect_equal(length(bracket_layers), 1)
  expect_equal(bracket_layers[[1]]$`_compositeRole`, "significance")
  expect_true(all(c("x1", "x2", "y") %in% names(bracket_layers[[1]]$mapping)))
  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B"))
})

test_that("comparison includes outliers when enabled", {
  df <- data.frame(
    group = c("A", "A", "A", "A", "B", "B", "B", "B"),
    value = c(1, 2, 3, 100, 10, 11, 12, 13),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = TRUE)
  )
  layers <- w$x$config$layers
  # 5 boxplot layers (with outliers) + 1 bracket = 6
  expect_equal(length(layers), 6)
})

test_that("comparison works with 3 groups", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 8),
    value = c(rnorm(8, 1), rnorm(8, 5), rnorm(8, 10)),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "comparison", label = "cmp",
    data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )
  layers <- w$x$config$layers
  bracket <- Filter(function(l) l$type == "bracket", layers)[[1]]
  # Bracket layer data should have 3 comparisons (transformed via pairwise_test)
  expect_equal(length(bracket$data), 3)
})

test_that("comparison brackets span the same positions the boxes are drawn at", {
  set.seed(11)
  df <- data.frame(
    group = c(rep("C", 8), rep("A", 8), rep("B", 8)),
    value = c(rnorm(8, 1000), rnorm(8, 1), rnorm(8, 100)),
    stringsAsFactors = FALSE
  )
  w <- myIO::addIoLayer(
    myIO::myIO(), type = "comparison", label = "cmp", data = df,
    mapping = list(x_var = "group", y_var = "value"),
    options = list(showOutliers = FALSE)
  )

  expect_equal(w$x$config$axes$xTickLabels, list(`1` = "A", `2` = "B", `3` = "C"))

  # every bracket endpoint must land on the tick that carries its own group name
  ticks <- w$x$config$axes$xTickLabels
  bracket <- Filter(function(l) identical(l$type, "bracket"), w$x$config$layers)[[1]]
  expect_length(bracket$data, 3)
  for (row in bracket$data) {
    expect_equal(ticks[[as.character(row$x1)]], row$group1)
    expect_equal(ticks[[as.character(row$x2)]], row$group2)
  }
})

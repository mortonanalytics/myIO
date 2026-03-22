test_that("composite_regression creates 3 sublayers by default (scatter, trend, CI)", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = FALSE)
  )
  expect_equal(length(sublayers), 3)
  expect_equal(sublayers[[1]]$type, "point")
  expect_equal(sublayers[[1]]$role, "scatter")
  expect_equal(sublayers[[2]]$type, "line")
  expect_equal(sublayers[[2]]$role, "trend")
  expect_equal(sublayers[[3]]$type, "area")
  expect_equal(sublayers[[3]]$role, "ci_band")
})

test_that("composite_regression creates 4 sublayers with showStats=TRUE", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 1),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = TRUE)
  )
  expect_equal(length(sublayers), 4)
  expect_equal(sublayers[[4]]$type, "text")
  expect_equal(sublayers[[4]]$role, "annotation")
})

test_that("showCI=FALSE produces 2 sublayers", {
  df <- data.frame(
    x = 1:20, y = 1:20,
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showCI = FALSE, showStats = FALSE)
  )
  expect_equal(length(sublayers), 2)
  expect_equal(sublayers[[1]]$type, "point")
  expect_equal(sublayers[[2]]$type, "line")
})

test_that("trend sublayer uses specified method", {
  df <- data.frame(
    x = 1:20, y = (1:20)^2,
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(method = "loess", showStats = FALSE)
  )
  expect_equal(sublayers[[2]]$transform, "loess")
})

test_that("CI sublayer is type area with ci transform", {
  df <- data.frame(
    x = 1:20, y = 1:20,
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = FALSE)
  )
  ci_layer <- sublayers[[3]]
  expect_equal(ci_layer$type, "area")
  expect_equal(ci_layer$transform, "ci")
  expect_equal(ci_layer$mapping$low_y, "low_y")
  expect_equal(ci_layer$mapping$high_y, "high_y")
})

test_that("grouped data produces N sets of sublayers", {
  df <- data.frame(
    x = rep(1:10, 2),
    y = c(1:10, 2 * (1:10)),
    grp = rep(c("A", "B"), each = 10),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y", group = "grp"), "test", "#333",
    options = list(showStats = FALSE)
  )
  # 2 groups × 3 sublayers (scatter, trend, CI) = 6
  expect_equal(length(sublayers), 6)
})

test_that("annotation sublayer contains R-squared text", {
  set.seed(42)
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 0.5),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sublayers <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = TRUE)
  )
  annotation <- sublayers[[4]]
  expect_true(grepl("R\u00B2", annotation$data$text[1]))
  expect_true(grepl("y =", annotation$data$text[2]))
})

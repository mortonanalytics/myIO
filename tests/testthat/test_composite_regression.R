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

test_that("regression separates data, model and band colors", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sl <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = FALSE)
  )
  expect_equal(sl[[1]]$color, "#333")
  expect_false(identical(sl[[2]]$color, sl[[1]]$color))
  expect_equal(sl[[3]]$color, sl[[2]]$color)
  expect_true(sl[[2]]$color %in% myIO:::OKABE_ITO_PALETTE)
  expect_equal(sl[[3]]$options$areaOpacity, 0.18)
})

test_that("an explicit two-element color controls data and model separately", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sl <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", c("#111111", "#111111"),
    options = list(showStats = FALSE)
  )
  expect_equal(sl[[1]]$color, "#111111")
  expect_equal(sl[[2]]$color, "#111111")
})

test_that("an explicit areaOpacity option still wins for the CI band", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sl <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y"), "test", "#333",
    options = list(showStats = FALSE, areaOpacity = 0.5)
  )
  expect_equal(sl[[3]]$options$areaOpacity, 0.5)
})

test_that("grouped regression sublayer labels use the group value alone", {
  df <- data.frame(
    x = rep(1:10, 2), y = c(1:10, 2 * (1:10)),
    grp = rep(c("A", "B"), each = 10),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  sl <- myIO:::composite_regression(
    df, list(x_var = "x", y_var = "y", group = "grp"), "test", "#333",
    options = list(showStats = FALSE)
  )
  labels <- vapply(sl, function(s) s$label, character(1))
  expect_equal(labels[1], "A (data)")
  expect_equal(labels[4], "B (data)")
  expect_false(any(grepl("—", labels, fixed = TRUE)))
})

test_that("lm fits complete observations and preserves sorted source keys", {
  df <- myIO:::ensure_source_key(data.frame(x = c(4, 2, NA, 1, 3), y = c(8, NA, 2, 2, 6)))
  result <- myIO:::transform_lm(df, list(x_var = "x", y_var = "y"))
  expect_equal(result$data$x, c(1, 3, 4))
  expect_equal(unname(result$data$y), c(2, 6, 8))
  expect_equal(result$data[["_source_key"]], c("row_4", "row_5", "row_1"))
  expect_equal(unlist(result$meta$sourceKeys), result$data[["_source_key"]])
})

test_that("lm returns an empty fit for insufficient observations", {
  for (n in 0:1) {
    df <- myIO:::ensure_source_key(data.frame(x = seq_len(n), y = seq_len(n)))
    expect_warning(result <- myIO:::transform_lm(df, list(x_var = "x", y_var = "y")), "at least 2")
    expect_equal(nrow(result$data), 0L)
    expect_named(result$data, c("x", "y", "_source_key"))
    expect_length(result$meta$sourceKeys, 0L)
  }
})

test_that("polynomial regression includes a confidence band by default", {
  df <- data.frame(x = 1:12, y = (1:12)^2 + sin(1:12))
  chart <- addIoLayer(myIO(df), "regression", label = "fit",
    mapping = list(x_var = "x", y_var = "y"), options = list(method = "polynomial"))
  expect_true("ci_band" %in% vapply(chart$x$config$layers, function(x) x$`_compositeRole`, character(1)))
})

test_that("regression fits actual observations in missing groups", {
  df <- myIO:::ensure_source_key(data.frame(x = rep(1:5, 2), y = c(1:5, 6:10), g = rep(c("a", NA), each = 5)))
  chart <- addIoLayer(myIO(df), "regression", label = "fit", mapping = list(x_var = "x", y_var = "y", group = "g"), options = list(showStats = FALSE))
  points <- Filter(function(x) x$`_compositeRole` == "scatter", chart$x$config$layers)
  expect_length(points, 2L)
  expect_equal(vapply(points[[2]]$data, function(x) x$y, numeric(1)), 6:10)
})

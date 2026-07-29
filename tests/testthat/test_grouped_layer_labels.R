test_that("grouped mapping labels layers with the group value alone", {
  df <- data.frame(x = rep(1:5, 3), y = runif(15),
                   g = rep(c("Core", "Growth", "Support"), each = 5),
                   stringsAsFactors = FALSE)
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "Rankings", data = df,
                     mapping = list(x_var = "x", y_var = "y", group = "g"))
  labels <- vapply(w$x$config$layers, function(l) l$label, character(1))
  expect_equal(labels, c("Core", "Growth", "Support"))
  expect_false(any(grepl("—", labels, fixed = TRUE)))
})

test_that("a second grouped layer over the same levels falls back to the qualified label", {
  df <- data.frame(x = rep(1:5, 2), y = runif(10), z = runif(10),
                   g = rep(c("Core", "Growth"), each = 5),
                   stringsAsFactors = FALSE)
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "A", data = df,
                     mapping = list(x_var = "x", y_var = "y", group = "g")) |>
    myIO::addIoLayer(type = "line", label = "B", data = df,
                     mapping = list(x_var = "x", y_var = "z", group = "g"))
  labels <- vapply(w$x$config$layers, function(l) l$label, character(1))
  expect_equal(labels, c("Core", "Growth", "B — Core", "B — Growth"))
  expect_equal(length(unique(labels)), 4L)
})

test_that("grouped_df expansion labels layers with the group value alone", {
  skip_if_not_installed("dplyr")
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "point", label = "iris",
                     data = dplyr::group_by(iris, Species),
                     mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  labels <- vapply(w$x$config$layers, function(l) l$label, character(1))
  expect_equal(labels, c("setosa", "versicolor", "virginica"))
})

test_that("grouped survfit sublayer labels use the group value alone", {
  set.seed(1)
  df <- data.frame(time = c(1:10, 1:10), status = rep(c(1, 0), 10),
                   arm = rep(c("ctrl", "trt"), each = 10),
                   stringsAsFactors = FALSE)
  sl <- myIO:::composite_survfit(df, list(time = "time", status = "status", group = "arm"),
                                 "KM", "#333", options = list())
  labels <- vapply(sl, function(s) s$label, character(1))
  expect_false(any(grepl("—", labels, fixed = TRUE)))
  expect_true(any(startsWith(labels, "ctrl ")))
  expect_true(any(startsWith(labels, "trt ")))
})

test_that("grouped qq sublayer labels use the group value alone", {
  set.seed(1)
  df <- data.frame(v = rnorm(40), g = rep(c("a", "b"), each = 20),
                   stringsAsFactors = FALSE)
  sl <- myIO:::composite_qq(df, list(y_var = "v", group = "g"), "QQ", NULL, options = list())
  labels <- vapply(sl, function(s) s$label, character(1))
  expect_false(any(grepl("—", labels, fixed = TRUE)))
  expect_true(any(startsWith(labels, "a ")))
  expect_true(any(startsWith(labels, "b ")))
})

test_that("ungrouped layer labels are unchanged", {
  df <- data.frame(x = 1:5, y = runif(5), stringsAsFactors = FALSE)
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "Trend", data = df,
                     mapping = list(x_var = "x", y_var = "y"))
  expect_equal(vapply(w$x$config$layers, function(l) l$label, character(1)), "Trend")
})

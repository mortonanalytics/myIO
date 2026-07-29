test_that("grouped layers record the column whose values name them", {
  df <- data.frame(x = rep(1:5, 3), y = runif(15),
                   Month = rep(c("May", "June", "July"), each = 5),
                   stringsAsFactors = FALSE)
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "Temp", data = df,
                     mapping = list(x_var = "x", y_var = "y", group = "Month"))
  expect_equal(vapply(w$x$config$layers, function(l) l$groupVar, character(1)),
               rep("Month", 3))
})

test_that("ungrouped layers carry no grouping column", {
  df <- data.frame(x = 1:5, y = runif(5))
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "line", label = "Trend", data = df,
                     mapping = list(x_var = "x", y_var = "y"))
  expect_null(w$x$config$layers[[1]]$groupVar)
})

test_that("composite layers are not marked with a grouping column", {
  w <- myIO::myIO(data = iris) |>
    myIO::addIoLayer(type = "boxplot", label = "Sepal",
                     mapping = list(x_var = "Species", y_var = "Sepal.Width"))
  expect_true(all(vapply(w$x$config$layers,
                         function(l) is.null(l$groupVar), logical(1))))
})

test_that("grouped_df expansion records the dplyr grouping variable", {
  skip_if_not_installed("dplyr")
  w <- myIO::myIO() |>
    myIO::addIoLayer(type = "point", label = "iris",
                     data = dplyr::group_by(iris, Species),
                     mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width"))
  expect_equal(vapply(w$x$config$layers, function(l) l$groupVar, character(1)),
               rep("Species", 3))
})

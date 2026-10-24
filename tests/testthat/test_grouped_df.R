test_that("grouped iris creates 3 layers (one per Species)", {
  skip_if_not_installed("dplyr")

  grouped <- dplyr::group_by(iris, Species)
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "point",
      label = "iris",
      data = grouped,
      mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")
    )

  layers <- widget$x$config$layers
  expect_length(layers, 3L)
})

test_that("each layer from grouped df has correct type", {
  skip_if_not_installed("dplyr")

  grouped <- dplyr::group_by(iris, Species)
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "point",
      label = "iris",
      data = grouped,
      mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")
    )

  layers <- widget$x$config$layers
  types <- vapply(layers, function(l) l$type, character(1))
  expect_true(all(types == "point"))
})

test_that("labels include group values", {
  skip_if_not_installed("dplyr")

  grouped <- dplyr::group_by(iris, Species)
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "point",
      label = "iris",
      data = grouped,
      mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")
    )

  layers <- widget$x$config$layers
  labels <- vapply(layers, function(l) l$label, character(1))
  species <- levels(iris$Species)
  for (sp in species) {
    expect_true(any(grepl(sp, labels, fixed = TRUE)),
                info = paste("Expected species", sp, "in layer labels"))
  }
})

test_that("non-grouped data still works normally", {
  widget <- myIO::myIO() |>
    myIO::addIoLayer(
      type = "point",
      label = "plain_iris",
      data = iris,
      mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")
    )

  layers <- widget$x$config$layers
  expect_length(layers, 1L)
  expect_equal(layers[[1]]$label, "plain_iris")
})

test_that("grouped data frames preserve missing keys without phantom rows", {
  skip_if_not_installed("dplyr")
  df <- dplyr::group_by(data.frame(x = 1:4, y = 1:4, g = c("a", NA, "b", NA)), g)
  chart <- addIoLayer(myIO(df), "point", label = "points", mapping = list(x_var = "x", y_var = "y"))
  layers <- chart$x$config$layers
  expect_equal(vapply(layers, function(x) length(x$data), integer(1)), c(1L, 2L, 1L))
  keys <- unlist(lapply(layers, function(x) vapply(x$data, function(row) row[["_source_key"]], character(1))))
  expect_setequal(keys, paste0("row_", 1:4))
  expect_equal(length(keys), 4L)
})

test_that("grouped and mapped missing labels agree without collisions", {
  skip_if_not_installed("dplyr")
  df <- data.frame(x = 1:4, y = 1:4, g = c("NA", NA, "(NA)", "a"))
  mapped <- addIoLayer(myIO(df), "point", label = "points", mapping = list(x_var = "x", y_var = "y", group = "g"))
  grouped <- addIoLayer(myIO(dplyr::group_by(df, g)), "point", label = "points", mapping = list(x_var = "x", y_var = "y"))
  labels <- vapply(mapped$x$config$layers, function(x) x$label, character(1))
  expect_equal(labels, c("NA", "NA (missing)", "(NA)", "a"))
  expect_equal(vapply(grouped$x$config$layers, function(x) x$label, character(1)), labels)
})

test_that("grouped_df radar becomes one layer grouped by the group_by variable (#146)", {
  skip_if_not_installed("dplyr")
  rad <- data.frame(axis = rep(c("S", "P", "R"), 2), value = c(3, 5, 4, 4, 2, 5),
                    g = rep(c("A", "B"), each = 3))
  p <- myIO() |>
    addIoLayer("radar", label = "r", data = dplyr::group_by(rad, g),
               mapping = list(axis = "axis", value = "value"))
  layers <- p$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$mapping$group, "g")
  expect_length(layers[[1]]$data, 6)
})

test_that("grouped_df parallel with two group_by variables groups by their combination (#146)", {
  skip_if_not_installed("dplyr")
  df <- data.frame(a = c(1, 2, 3, 4), b = c(4, 3, 2, 1),
                   g1 = c("x", "x", "y", "y"), g2 = c("p", "q", "p", "q"))
  p <- myIO() |>
    addIoLayer("parallel", label = "par", data = dplyr::group_by(df, g1, g2),
               mapping = list(dimensions = c("a", "b")))
  layers <- p$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$mapping$group, "g1 / g2")
  expect_setequal(vapply(layers[[1]]$data, function(row) row[["g1 / g2"]], character(1)),
                  c("x / p", "x / q", "y / p", "y / q"))
})

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

test_that("ci transform accepts x_var + y_var mapping without low_y/high_y", {
  df <- data.frame(
    x = 1:20, y = 2 * (1:20) + rnorm(20, sd = 1),
    stringsAsFactors = FALSE
  )
  # Should not error — validation should accept x_var + y_var for ci transform
  w <- myIO::myIO(data = df) |>
    myIO::addIoLayer(
      type = "area", label = "CI band", transform = "ci",
      mapping = list(x_var = "x", y_var = "y")
    )
  expect_s3_class(w, "htmlwidget")
  # Verify auto-injected mapping
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$mapping$low_y, "low_y")
  expect_equal(layer$mapping$high_y, "high_y")
})

test_that("mean_ci transform accepts x_var + y_var mapping", {
  df <- data.frame(
    species = c("A", "A", "A", "B", "B", "B"),
    value = c(1, 2, 3, 4, 5, 6),
    stringsAsFactors = FALSE
  )
  w <- myIO::myIO(data = df) |>
    myIO::addIoLayer(
      type = "rangeBar", label = "mean CI", transform = "mean_ci",
      mapping = list(x_var = "species", y_var = "value")
    )
  expect_s3_class(w, "htmlwidget")
  layer <- w$x$config$layers[[1]]
  expect_equal(layer$mapping$low_y, "low_y")
  expect_equal(layer$mapping$high_y, "high_y")
})

test_that("auto-injected mapping does not overwrite user-provided values", {
  df <- data.frame(
    x = 1:20, y = 1:20, my_low = rep(0, 20), my_high = rep(1, 20),
    stringsAsFactors = FALSE
  )
  mapping <- list(x_var = "x", y_var = "y", low_y = "my_low", high_y = "my_high")
  injected <- myIO:::inject_transform_mapping("ci", mapping)
  expect_equal(injected$low_y, "my_low")
  expect_equal(injected$high_y, "my_high")
})

test_that("validation still rejects missing x_var for ci transform", {
  df <- data.frame(y = 1:10, stringsAsFactors = FALSE)
  expect_error(
    myIO::myIO(data = df) |>
      myIO::addIoLayer(type = "area", label = "CI", transform = "ci",
                       mapping = list(y_var = "y")),
    "Missing required mapping"
  )
})

test_that("inject_transform_mapping is no-op for non-contract transforms", {
  mapping <- list(x_var = "x", y_var = "y")
  result <- myIO:::inject_transform_mapping("identity", mapping)
  expect_equal(result, mapping)
})

test_that("parallel coords layer accepts valid inputs", {
  p <- myIO(iris) |>
    addIoLayer("parallel", label = "par",
               mapping = list(dimensions = c("Sepal.Length", "Sepal.Width",
                                             "Petal.Length", "Petal.Width")))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "parallel")
})

test_that("parallel rejects missing dimensions", {
  expect_error(
    myIO(iris) |> addIoLayer("parallel", label = "par", mapping = list()),
    "dimensions"
  )
})

test_that("grouped parallel coords stays one layer with group in its mapping (#146)", {
  p <- myIO(iris) |>
    addIoLayer("parallel", label = "par",
               mapping = list(dimensions = c("Sepal.Length", "Sepal.Width"),
                              group = "Species"))
  layers <- p$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$label, "par")
  expect_equal(layers[[1]]$mapping$group, "Species")
  expect_length(layers[[1]]$data, nrow(iris))
})

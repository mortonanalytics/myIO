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

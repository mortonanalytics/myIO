# Contract tests for dumbbell chart type (v1.2)

test_that("dumbbell layer accepts valid inputs", {
  df <- data.frame(
    category = c("A", "B", "C"),
    low = c(10, 20, 15),
    high = c(30, 40, 25)
  )
  p <- myIO(df) |>
    addIoLayer("dumbbell", label = "db",
               mapping = list(x_var = "category", low_y = "low", high_y = "high"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "dumbbell")
})

test_that("dumbbell rejects missing low_y", {
  df <- data.frame(category = "A", high = 30)
  expect_error(
    myIO(df) |>
      addIoLayer("dumbbell", label = "db",
                 mapping = list(x_var = "category", high_y = "high")),
    "low_y"
  )
})

test_that("dumbbell rejects missing high_y", {
  df <- data.frame(category = "A", low = 10)
  expect_error(
    myIO(df) |>
      addIoLayer("dumbbell", label = "db",
                 mapping = list(x_var = "category", low_y = "low")),
    "high_y"
  )
})

test_that("dumbbell only supports identity transform", {
  df <- data.frame(category = "A", low = 10, high = 30)
  expect_error(
    myIO(df) |>
      addIoLayer("dumbbell", label = "db",
                 mapping = list(x_var = "category", low_y = "low", high_y = "high"),
                 transform = "mean"),
    "not valid"
  )
})

test_that("dumbbell is in axes-categorical group", {
  df <- data.frame(category = c("A", "B"), low = c(10, 20), high = c(30, 40))
  p <- myIO(df) |>
    addIoLayer("dumbbell", label = "db",
               mapping = list(x_var = "category", low_y = "low", high_y = "high"))
  expect_length(p$x$config$layers, 1)
})

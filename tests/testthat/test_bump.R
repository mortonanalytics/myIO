# Contract tests for bump chart type (v1.2)

test_that("bump layer accepts valid inputs", {
  df <- data.frame(
    time = rep(c("Q1", "Q2", "Q3"), each = 3),
    rank = c(1, 2, 3, 2, 1, 3, 3, 2, 1),
    team = rep(c("A", "B", "C"), 3)
  )
  p <- myIO(df) |>
    addIoLayer("bump", label = "bmp",
               mapping = list(x_var = "time", y_var = "rank", group = "team"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "bump")
})

test_that("bump rejects missing group", {
  df <- data.frame(time = "Q1", rank = 1)
  expect_error(
    myIO(df) |>
      addIoLayer("bump", label = "bmp",
                 mapping = list(x_var = "time", y_var = "rank")),
    "group"
  )
})

test_that("bump rejects invalid transform", {
  df <- data.frame(time = "Q1", rank = 1, team = "A")
  expect_error(
    myIO(df) |>
      addIoLayer("bump", label = "bmp",
                 mapping = list(x_var = "time", y_var = "rank", group = "team"),
                 transform = "mean"),
    "not valid"
  )
})

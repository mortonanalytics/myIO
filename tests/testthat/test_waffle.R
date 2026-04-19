# Contract tests for waffle chart type (v1.2)

test_that("waffle layer accepts valid inputs", {
  df <- data.frame(cat = c("A", "B", "C"), val = c(50, 30, 20))
  p <- myIO(df) |>
    addIoLayer("waffle", label = "wf",
               mapping = list(category = "cat", value = "val"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "waffle")
})

test_that("waffle rejects missing category", {
  df <- data.frame(val = c(50, 30))
  expect_error(
    myIO(df) |>
      addIoLayer("waffle", label = "wf",
                 mapping = list(value = "val")),
    "category"
  )
})

test_that("waffle rejects missing value", {
  df <- data.frame(cat = c("A", "B"))
  expect_error(
    myIO(df) |>
      addIoLayer("waffle", label = "wf",
                 mapping = list(category = "cat")),
    "value"
  )
})

test_that("waffle supports custom rows and cols", {
  df <- data.frame(cat = c("A", "B"), val = c(60, 40))
  p <- myIO(df) |>
    addIoLayer("waffle", label = "wf",
               mapping = list(category = "cat", value = "val"),
               options = list(rows = 5, cols = 20))
  expect_equal(p$x$config$layers[[1]]$options$rows, 5)
  expect_equal(p$x$config$layers[[1]]$options$cols, 20)
})

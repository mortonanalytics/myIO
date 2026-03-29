test_that("funnel layer accepts valid inputs", {
  df <- data.frame(stage = c("Visitors", "Leads", "Qualified", "Closed"),
                   value = c(1000, 500, 200, 50))
  p <- myIO(df) |>
    addIoLayer("funnel", label = "sales", mapping = list(stage = "stage", value = "value"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "funnel")
})

test_that("funnel rejects missing stage", {
  df <- data.frame(value = c(1000, 500))
  expect_error(
    myIO(df) |> addIoLayer("funnel", label = "f", mapping = list(value = "value")),
    "stage"
  )
})

test_that("funnel rejects missing value", {
  df <- data.frame(stage = c("A", "B"))
  expect_error(
    myIO(df) |> addIoLayer("funnel", label = "f", mapping = list(stage = "stage")),
    "value"
  )
})

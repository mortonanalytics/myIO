test_that("radar layer accepts valid inputs", {
  df <- data.frame(axis = c("Speed", "Power", "Range", "Armor", "Magic"),
                   value = c(80, 60, 90, 40, 70))
  p <- myIO(df) |>
    addIoLayer("radar", label = "hero", mapping = list(axis = "axis", value = "value"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "radar")
})

test_that("radar rejects missing axis", {
  df <- data.frame(value = c(80, 60))
  expect_error(
    myIO(df) |> addIoLayer("radar", label = "r", mapping = list(value = "value")),
    "axis"
  )
})

test_that("radar rejects missing value", {
  df <- data.frame(axis = c("A", "B"))
  expect_error(
    myIO(df) |> addIoLayer("radar", label = "r", mapping = list(axis = "axis")),
    "value"
  )
})

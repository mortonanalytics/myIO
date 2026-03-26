test_that("addIoLayer suggests close type matches", {
  expect_error(
    myIO() |> addIoLayer(type = "pint", label = "x", data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")),
    "Did you mean 'point'"
  )
})

test_that("addIoLayer suggests close type for 'lines'", {
  expect_error(
    myIO() |> addIoLayer(type = "lines", label = "x", data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")),
    "Did you mean 'line'"
  )
})

test_that("addIoLayer no suggestion for unrelated type", {
  err <- tryCatch(
    myIO() |> addIoLayer(type = "zzzzz", label = "x", data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")),
    error = conditionMessage
  )
  expect_false(grepl("Did you mean", err))
  expect_true(grepl("addIoLayer\\(\\)", err))
})

test_that("column not found lists available columns", {
  expect_error(
    myIO() |> addIoLayer(type = "point", label = "x", data = mtcars,
      mapping = list(x_var = "weight", y_var = "mpg")),
    "Available columns:.*mpg.*cyl"
  )
})

test_that("all public setter errors include function name", {
  # setBrush
  expect_error(myIO() |> setBrush(direction = "z"), "setBrush\\(\\)")
  # setAnnotation
  expect_error(myIO() |> setAnnotation(mode = "x"), "setAnnotation\\(\\)")
  # setSlider
  expect_error(myIO() |> setSlider(123, "l", 0, 1, 0.5), "setSlider\\(\\)")
  # setLinked
  skip_if_not_installed("crosstalk")
  expect_error(myIO() |> setLinked(mtcars), "setLinked\\(\\)")
})

test_that("addIoLayer errors include function name", {
  # Bad type
  expect_error(
    myIO() |> addIoLayer(type = "nope", label = "x", data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg")),
    "addIoLayer\\(\\)"
  )
  # Bad column
  expect_error(
    myIO() |> addIoLayer(type = "point", label = "x", data = mtcars,
      mapping = list(x_var = "bad", y_var = "mpg")),
    "addIoLayer\\(\\)"
  )
  # Bad transform
  expect_error(
    myIO() |> addIoLayer(type = "point", label = "x", data = mtcars,
      mapping = list(x_var = "wt", y_var = "mpg"), transform = "nope"),
    "addIoLayer\\(\\)"
  )
  # Duplicate label
  expect_error(
    myIO() |>
      addIoLayer(type = "point", label = "x", data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")) |>
      addIoLayer(type = "point", label = "x", data = mtcars,
        mapping = list(x_var = "wt", y_var = "mpg")),
    "addIoLayer\\(\\).*already exists"
  )
})

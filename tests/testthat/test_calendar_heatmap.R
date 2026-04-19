test_that("AC-R1: missing date mapping key errors", {
  df <- data.frame(d = as.Date("2026-01-01") + 0:9, v = 1:10)
  expect_error(
    myIO() |> addIoLayer(type = "calendarHeatmap",
      data = df, mapping = list(value = "v"), label = "x"),
    regexp = "Missing required mapping.*date"
  )
})

test_that("AC-R2: non-numeric value errors", {
  df <- data.frame(d = as.Date("2026-01-01") + 0:9, v = letters[1:10],
                   stringsAsFactors = FALSE)
  expect_error(
    myIO() |> addIoLayer(type = "calendarHeatmap",
      data = df, mapping = list(date = "d", value = "v"), label = "x"),
    regexp = "must be numeric"
  )
})

test_that("AC-R3: character dates coerce to ISO strings in serialized layer", {
  df <- data.frame(
    d = format(as.Date("2026-01-01") + 0:9),
    v = 1:10,
    stringsAsFactors = FALSE
  )
  w <- myIO() |> addIoLayer(type = "calendarHeatmap",
    data = df, mapping = list(date = "d", value = "v"), label = "x")
  first_row <- w$x$config$layers[[1]]$data[[1]]
  expect_match(first_row$d, "^\\d{4}-\\d{2}-\\d{2}$")
  expect_equal(first_row$d, "2026-01-01")
})

test_that("AC-R4: multi-year errors", {
  df <- data.frame(d = as.Date(c("2025-12-31", "2026-01-02")), v = c(1, 2))
  expect_error(
    myIO() |> addIoLayer(type = "calendarHeatmap",
      data = df, mapping = list(date = "d", value = "v"), label = "x"),
    regexp = "spans multiple calendar years"
  )
})

test_that("AC-R5: empty data errors", {
  df <- data.frame(d = as.Date(character(0)), v = numeric(0))
  expect_error(
    myIO() |> addIoLayer(type = "calendarHeatmap",
      data = df, mapping = list(date = "d", value = "v"), label = "x"),
    regexp = "no rows|at least 1 row"
  )
})

test_that("AC-R6: cannot compose calendarHeatmap with point", {
  df <- data.frame(d = as.Date("2026-01-01") + 0:9, v = 1:10,
                   x = 1:10, y = 1:10)
  expect_error(
    myIO() |>
      addIoLayer(type = "calendarHeatmap",
        data = df, mapping = list(date = "d", value = "v"), label = "cal") |>
      addIoLayer(type = "point",
        data = df, mapping = list(x_var = "x", y_var = "y"), label = "pts"),
    regexp = "incompatible|compatibility|cannot be combined"
  )
})

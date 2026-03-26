test_that("setBrush sets config correctly", {
  w <- myIO() |> setBrush()
  expect_true(w$x$config$interactions$brush$enabled)
  expect_equal(w$x$config$interactions$brush$direction, "xy")
  expect_equal(w$x$config$interactions$brush$onSelect, "highlight")
})

test_that("setBrush validates direction", {
  expect_error(myIO() |> setBrush(direction = "z"), "'arg' should be one of")
})

test_that("setBrush rejects non-myIO input", {
  expect_error(setBrush(list()), "Expected a myIO widget")
})

test_that("setBrush with x direction and export", {
  w <- myIO() |> setBrush(direction = "x", on_select = "export")
  expect_equal(w$x$config$interactions$brush$direction, "x")
  expect_equal(w$x$config$interactions$brush$onSelect, "export")
})

test_that("setBrush with y direction", {
  w <- myIO() |> setBrush(direction = "y")
  expect_equal(w$x$config$interactions$brush$direction, "y")
})

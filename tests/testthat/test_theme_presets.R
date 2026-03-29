test_that("setTheme with preset stores preset name", {
  p <- myIO(iris) |> setTheme(preset = "midnight")
  expect_equal(p$x$config$theme$preset, "midnight")
})

test_that("preset + mode combine", {
  p <- myIO(iris) |> setTheme(mode = "dark", preset = "ocean")
  expect_equal(p$x$config$theme$mode, "dark")
  expect_equal(p$x$config$theme$preset, "ocean")
})

test_that("preset + overrides combine", {
  p <- myIO(iris) |> setTheme(preset = "forest", bg = "#000")
  expect_equal(p$x$config$theme$preset, "forest")
  expect_equal(p$x$config$theme$values[["--chart-bg"]], "#000")
})

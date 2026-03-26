test_that("setAnnotation sets config correctly", {
  w <- myIO() |> setAnnotation()
  expect_true(w$x$config$interactions$annotation$enabled)
  expect_null(w$x$config$interactions$annotation$presetLabels)
  expect_null(w$x$config$interactions$annotation$categoryColors)
  expect_equal(w$x$config$interactions$annotation$mode, "click")
})

test_that("setAnnotation with presets and colors", {
  w <- myIO() |> setAnnotation(
    labels = c("outlier", "normal"),
    colors = c(outlier = "#E63946", normal = "#2A9D8F")
  )
  expect_equal(w$x$config$interactions$annotation$presetLabels,
               c("outlier", "normal"))
  expect_equal(w$x$config$interactions$annotation$categoryColors[["outlier"]],
               "#E63946")
})

test_that("setAnnotation validates mode", {
  expect_error(myIO() |> setAnnotation(mode = "hover"), 'setAnnotation\\(\\): `mode`')
  expect_error(myIO() |> setAnnotation(mode = "brush"), 'setAnnotation\\(\\): `mode`')
})

test_that("setAnnotation rejects non-myIO input", {
  expect_error(setAnnotation(list()), "Expected a myIO widget")
})

test_that("setAnnotation rejects non-character labels", {
  expect_error(myIO() |> setAnnotation(labels = 123),
               "setAnnotation\\(\\): `labels` must be a non-empty character vector")
})

test_that("setAnnotation rejects unnamed colors", {
  expect_error(myIO() |> setAnnotation(colors = c("#E63946", "#2A9D8F")),
               "setAnnotation\\(\\): `colors`.*names are missing")
})

test_that("myIO() widget carries a fill-aware sizingPolicy", {
  w <- myIO(data = mtcars) |>
    addIoLayer(type = "point", label = "s",
               mapping = list(x_var = "wt", y_var = "mpg"))
  sp <- w$sizingPolicy
  expect_false(is.null(sp))
  expect_true(isTRUE(sp$browser$fill))
  expect_true(isTRUE(sp$viewer$fill))
  expect_true(isTRUE(sp$fill))
  expect_false(isTRUE(sp$knitr$figure))
})

test_that("myIO() widget HTML is marked as a bslib fill item", {
  w <- myIO(data = mtcars) |>
    addIoLayer(type = "point", label = "s",
               mapping = list(x_var = "wt", y_var = "mpg"))
  html <- as.character(htmltools::renderTags(w)$html)
  expect_true(grepl("html-fill-item", html, fixed = TRUE))
})

test_that("myIO() renders at default dimensions outside fill contexts", {
  w <- myIO(data = mtcars)
  expect_equal(w$width,  "100%")
  expect_equal(w$height, "400px")
})

test_that("myIO() sparkline mode still honors its height override", {
  w <- myIO(data = mtcars, sparkline = TRUE)
  expect_equal(w$height, 20)
})

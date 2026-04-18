test_that("linkCharts(cursor=TRUE) writes cursor flag + default axis to both widgets", {
  w1 <- myIO()
  w2 <- myIO()
  linked <- linkCharts(w1, w2, on = "cyl", cursor = TRUE)

  expect_true(linked[[1]]$x$config$interactions$linked$cursor)
  expect_true(linked[[2]]$x$config$interactions$linked$cursor)
  expect_equal(linked[[1]]$x$config$interactions$linked$cursorAxis, "x")
  expect_equal(linked[[2]]$x$config$interactions$linked$cursorAxis, "x")
})

test_that("linkCharts() default leaves cursor flag unset (backward compat)", {
  linked <- linkCharts(myIO(), myIO(), on = "cyl")
  expect_false(isTRUE(linked[[1]]$x$config$interactions$linked$cursor))
})

test_that("linkCharts() rejects invalid cursorAxis", {
  expect_error(
    linkCharts(myIO(), myIO(), on = "cyl", cursor = TRUE, cursorAxis = "z"),
    "cursorAxis"
  )
})

test_that("setLinked() accepts cursor arg and writes to config", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- setLinked(myIO(), shared, cursor = TRUE)

  expect_true(w$x$config$interactions$linked$cursor)
  expect_equal(w$x$config$interactions$linked$cursorAxis, "x")
})

test_that("setLinkedCursor() toggles cursor on a fresh widget", {
  w <- setLinkedCursor(myIO(), enabled = TRUE)
  expect_true(w$x$config$interactions$linked$cursor)
  expect_equal(w$x$config$interactions$linked$cursorAxis, "x")
})

test_that("setLinkedCursor(enabled=FALSE) sets cursor to FALSE", {
  w <- setLinkedCursor(myIO(), enabled = FALSE)
  expect_false(w$x$config$interactions$linked$cursor)
})

test_that("setLinkedCursor(axis='xy') persists the axis choice", {
  w <- setLinkedCursor(myIO(), enabled = TRUE, axis = "xy")
  expect_equal(w$x$config$interactions$linked$cursorAxis, "xy")
})

test_that("setLinkedCursor() preserves pre-existing linked config", {
  w <- linkCharts(myIO(), myIO(), on = "cyl", group = "g1")[[1]]
  w2 <- setLinkedCursor(w, enabled = TRUE)

  expect_equal(w2$x$config$interactions$linked$group, "g1")
  expect_equal(w2$x$config$interactions$linked$keyColumn, "cyl")
  expect_true(w2$x$config$interactions$linked$cursor)
})

test_that("setLinkedCursor() rejects invalid axis", {
  expect_error(setLinkedCursor(myIO(), enabled = TRUE, axis = "z"), "axis")
})

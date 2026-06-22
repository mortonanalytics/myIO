test_that("setTransition writes duration to transitions$speed", {
  w <- setTransition(myIO(), duration = 1200)
  expect_equal(w$x$config$transitions$speed, 1200)
})

test_that("setTransition writes easing and stagger", {
  w <- setTransition(myIO(), easing = "bounce", stagger = 25)
  expect_equal(w$x$config$transitions$easing, "bounce")
  expect_equal(w$x$config$transitions$stagger, 25)
})

test_that("NULL args leave existing config untouched", {
  w0 <- myIO()
  w0$x$config$transitions$easing <- "cubic"
  w <- setTransition(w0)
  expect_equal(w$x$config$transitions$speed, 1000)
  expect_equal(w$x$config$transitions$easing, "cubic")
  expect_null(w$x$config$transitions$stagger)
})

test_that("invalid easing is rejected", {
  expect_error(setTransition(myIO(), easing = "wobble"), "easing")
})

test_that("negative duration and stagger are rejected", {
  expect_error(setTransition(myIO(), duration = -1), "duration")
  expect_error(setTransition(myIO(), stagger = -5), "stagger")
})

test_that("non-numeric duration/stagger are rejected", {
  expect_error(setTransition(myIO(), duration = "fast"), "duration")
  expect_error(setTransition(myIO(), stagger = "lots"), "stagger")
})

test_that("setTransitionSpeed remains a thin wrapper over duration", {
  w <- setTransitionSpeed(myIO(), 0)
  expect_equal(w$x$config$transitions$speed, 0)
  expect_null(w$x$config$transitions$easing)
})

test_that("setTransitionSpeed inherits duration validation (rejects negative)", {
  expect_error(setTransitionSpeed(myIO(), -1), "duration")
})

test_that("setTransition rejects non-myIO input", {
  expect_error(setTransition(list()), class = "error")
})

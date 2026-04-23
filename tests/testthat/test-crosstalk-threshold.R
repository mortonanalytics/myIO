test_that("setLinked refreshes crosstalk_threshold from option", {
  skip_if_not_installed("crosstalk")
  w <- myIO::myIO()
  default <- w$x$config$crosstalk_threshold
  withr::local_options(myIO.crosstalk_threshold = 12345L)
  w2 <- myIO::myIO()
  expect_equal(w2$x$config$crosstalk_threshold, 12345L)
})

test_that("crosstalk_threshold default is 100000", {
  withr::local_options(myIO.crosstalk_threshold = NULL)
  w <- myIO::myIO()
  expect_equal(w$x$config$crosstalk_threshold, 100000L)
})

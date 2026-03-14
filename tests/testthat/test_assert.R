test_that("widget setters reject plain lists with a clear myIO error", {
  bad_widget <- list()

  expect_error(
    myIO::addIoLayer(bad_widget, type = "line", label = "x", data = datasets::mtcars, mapping = list(x_var = "wt", y_var = "mpg")),
    "Expected a myIO widget, got 'list'\\."
  )
  expect_error(myIO::setAxisFormat(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setAxisLimits(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setColorScheme(bad_widget, colorScheme = list("red")), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setMargin(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setReferenceLines(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setTheme(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setToggle(bad_widget, variable = "x"), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setToolTipOptions(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::setTransitionSpeed(bad_widget, speed = 0), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::defineCategoricalAxis(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::dragPoints(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::flipAxis(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::suppressAxis(bad_widget), "Expected a myIO widget, got 'list'\\.")
  expect_error(myIO::suppressLegend(bad_widget), "Expected a myIO widget, got 'list'\\.")
})

#test option functions
context("option_functions")
test_object <- myIO::addIoLayer(myIO::myIO(),
                                type = "line",
                                label = "test_line",
                                color = "red",
                                data = mtcars,
                                mapping = list(x_var = "wt",
                                               y_var = "mpg")) %>%
              myIO::setAxisFormat(xAxis = ".0f", yAxis = ".1f")

testthat::test_that("axis options get set", {
  expect_output(test_object$x$options$xAxisFormat, ".0f")
  expect_output(test_object$x$options$yAxisFormat, ".1f")
})

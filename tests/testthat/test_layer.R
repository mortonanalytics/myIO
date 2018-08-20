# test IO layer
context("layer_functions")
test_object <- myIO::addIoLayer(myIO::myIO(),
                 type = "line",
                 label = "test_line",
                 color = "red",
                 data = mtcars,
                 mapping = list(x_var = "wt",
                                y_var = "mpg"))

testthat::test_that("add layer creates a list of one", {
  expect_output(str(test_object$x$layers), "List of 1")
})

#test drag points with previous layer
test_object <- myIO::dragPoints(test_object)

testthat::test_that("dragPoints adds option to list", {
  expect_output(str(test_object$x$options$dragPoints), "TRUE")
})

#test IO Stat layer
test_stat_object <- myIO::addIoStatLayer(myIO::myIO(),
                                         type = "lm",
                                         label = "linear_test",
                                         color = "red",
                                         data = mtcars,
                                         mapping = list(x_var = "wt",
                                                        y_var = "mpg"))
testthat::test_that("add stat layer creates a list of one", {
  expect_output(str(test_stat_object$x$layers), "List of 1")
})

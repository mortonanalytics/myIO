#test option functions
context("option_functions")
test_object_opt <- myIO::addIoLayer(myIO::myIO(),
                                type = "point",
                                label = "test_line",
                                color = "red",
                                data = mtcars,
                                mapping = list(x_var = "wt",
                                               y_var = "mpg")) %>%
              myIO::setAxisFormat(xAxis = ".0f", yAxis = ".1f") %>%
              myIO::dragPoints()

testthat::test_that("axis options get set", {
  testthat::equals(test_object_opt$x$options$xAxisFormat, ".0f")
  testthat::equals(test_object_opt$x$options$yAxisFormat, ".1f")
})

testthat::test_that("drag points options get set to TRUE", {
  testthat::equals(test_object_opt$x$options$dragPoints, TRUE)

})

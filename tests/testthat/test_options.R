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
              myIO::dragPoints() %>%
              myIO::flipAxis() %>%
              myIO::defineCategoricalAxis() %>%
              myIO::setmargin(top = 100)

testthat::test_that("axis options get set", {
  testthat::equals(test_object_opt$x$options$xAxisFormat, ".0f")
  testthat::equals(test_object_opt$x$options$yAxisFormat, ".1f")
})

testthat::test_that("drag points options get set to TRUE", {
  testthat::equals(test_object_opt$x$options$dragPoints, TRUE)

})

testthat::test_that("flipAxis options get set to TRUE", {
  testthat::equals(test_object_opt$x$options$flipAxis, TRUE)

})

testthat::test_that("categoricalScale options get set to TRUE", {
  testthat::equals(test_object_opt$x$options$categoricalScale, TRUE)

})

testthat::test_that("categoricalScale options get set to TRUE", {
  testthat::equals(test_object_opt$x$options$margin$top, 100)

})

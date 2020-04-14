#test option functions
context("option_functions")

test_object_opt <- myIO::addIoLayer(myIO::myIO(),
                                type = "point",
                                label = "test_line",
                                color = "red",
                                data = datasets::mtcars,
                                mapping = list(x_var = "wt",
                                               y_var = "mpg")) %>%
  myIO::setAxisFormat(xAxis = ".0f", yAxis = ".1f") %>%
  myIO::dragPoints() %>%
  myIO::flipAxis() %>%
  myIO::defineCategoricalAxis() %>%
  myIO::setmargin(top = 100) %>%
  myIO::setAxisLimits(xlim = list(min = 0)) %>%
  myIO::suppressAxis(xAxis = TRUE, yAxis = TRUE) %>%
  myIO::suppressLegend() %>%
  myIO::setTransitionSpeed(speed = 1500) %>%
  myIO::setColorScheme(colorShceme = list("red")) %>%
  myIO::setToolTipOptions(suppressY = TRUE) %>%
  myIO::setReferenceLines()

testthat::test_that("axis options get set", {
 expect_equal(test_object_opt$x$options$xAxisFormat, ".0f")
  expect_equal(test_object_opt$x$options$yAxisFormat, ".1f")
})

testthat::test_that("drag points options get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$dragPoints, TRUE)

})

testthat::test_that("flipAxis options get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$flipAxis, TRUE)

})

testthat::test_that("suppress xAxis option get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$suppressAxis$xAxis, TRUE)

})

testthat::test_that("suppress yAxis option get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$suppressAxis$yAxis, TRUE)

})

testthat::test_that("suppress legend option get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$suppressLegend, TRUE)

})

testthat::test_that("categoricalScale options get set to TRUE", {
  testthat::expect_equal(test_object_opt$x$options$categoricalScale$xAxis, TRUE)

})

testthat::test_that("margins are set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$margin$top, 100)

})

testthat::test_that("x axis set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$xlim$min, 0)

})

testthat::test_that("transition speed set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$transition$speed, 1500)

})

testthat::test_that("color scheme set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$colorScheme[[3]][1], "on")

})

testthat::test_that("tooltipoptions set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$toolTipFormat, "s")

})

testthat::test_that("reference lines  set to user inputs", {
  testthat::expect_equal(test_object_opt$x$options$referenceLine$x, 0)
  testthat::expect_equal(test_object_opt$x$options$referenceLine$y, 0)

})

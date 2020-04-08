# test IO layer
context("layer_functions")

test_object <- myIO::addIoLayer(myIO::myIO(),
                 type = "line",
                 label = "test_line",
                 color = "red",
                 data = datasets::mtcars,
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

test_toggle_data <- dplyr::ungroup(dplyr::mutate(dplyr::group_by(dplyr::mutate(datasets::airquality, Month = paste0("M", Month),
         Temp_low = Temp * c(0.8,0.9,0.75),
         Temp_high = Temp * c(1.2,1.1,1.3)), Percent = Temp/sum(Temp), Day)))

colors <- c("steelblue", "lightsteelblue", "orange", "green", "purple")

test_toggle_object <- myIO::myIO(elementId = "tester") %>%
  myIO::addIoLayer(type = "line",
             color = colors,
             label = "Month",
             data = test_toggle_data ,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               #low_y = "Temp_low",
               #high_y = "Temp_high",
               group = "Month"
             )) %>%
  myIO::setAxisLimits(xlim = list(min = "1"))%>%
  myIO::setToggle(newY = "Percent", newScaleY = ".0%") %>%
  myIO::setAxisFormat(yAxis = ".0f")

testthat::test_that("add layer with toggle creates a list of five", {
  expect_output(str(test_toggle_object$x$layers), "List of 5")
})

testthat::test_that("set toggle creates a list of 2", {
  expect_output(str(test_toggle_object$x$options$toggleY), "List of 2")
})

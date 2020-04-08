# test IO layer
context("layer_functions")
library(dplyr)
library(myIO)

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

test_toggle_data <- datasets::airquality %>%
  mutate(Month = paste0("M", Month),
         Temp_low = Temp * c(0.8,0.9,0.75),
         Temp_high = Temp * c(1.2,1.1,1.3)) %>%
  group_by(Day) %>%
  mutate(Percent = Temp/sum(Temp)) %>%
  ungroup()

for(i in 1:ncol(test_toggle_data)){
  test_toggle_data[is.na(test_toggle_data[,i]), i] <- mean(test_toggle_data[,i], na.rm = TRUE)
}

colors <- c("steelblue", "lightsteelblue", "orange", "green", "purple")

test_toggle_object <- myIO(elementId = "tester")%>%
  addIoLayer(type = "line",
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
  setAxisLimits(xlim = list(min = "1"))%>%
  setToggle(newY = "Percent", newScaleY = ".0%") %>%
  setAxisFormat(yAxis = ".0f")

testthat::test_that("add layer with toggle creates a list of five", {
  expect_output(str(test_toggle_object$x$layers), "List of 5")
})

testthat::test_that("set toggle creates a list of 2", {
  expect_output(str(test_toggle_object$x$options$toggleY), "List of 2")
})

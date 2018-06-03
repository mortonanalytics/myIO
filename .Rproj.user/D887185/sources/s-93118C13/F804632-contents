library(testthat)
library(myIO)

context("add layer results")
testObject <-  myIO() %>%
  addIoLayer(type = 'point',
           color = "blue",
           label = "testLayer",
           data = mtcars,
           mapping = list(x_var = "wt",
                               y_var = "mpg"))

testthat("add layer creates a list of two", {
  expect_output(str(testObject$x$layers), "List of 1")
})

testObject2 <- testObject %>%
  addIoLayer(type = "point",
           color = "red",
           data = mtcars,
           label = "newLayer",
           mapping = list(x_var = "drat",
                               y_var = "wt"))

testthat("add layer creates a list of two", {
  expect_output(str(testObject2$x$layers), "List of 2")
})

#test option functions
context("util_functions")
library(dplyr)
library(myIO)


test_util_data <- datasets::airquality %>%
  mutate(Month = paste0("M", Month),
         Temp_low = Temp * c(0.8,0.9,0.75),
         Temp_high = Temp * c(1.2,1.1,1.3)) %>%
  group_by(Day) %>%
  mutate(Percent = Temp/sum(Temp)) %>%
  ungroup()

for(i in 1:ncol(test_util_data)){
  test_util_data[is.na(test_util_data[,i]), i] <- mean(test_util_data[,i], na.rm = TRUE)
}

groupList <- unique(test_util_data[["Month"]])
color <- c("#1E90FF","#DC143C","#336292","#070A41", "orange")

layersObject <- buildLayers(x = list(),
                            group = "Month",
                            grouping = groupList,
                            color = color,
                            data = test_util_data,
                            type = "line",
                            mapping = list(x_var = "Day",
                                           y_var = "Temp",
                                           group = "Month"),
                            options = NULL)

newLayers <- lapply(groupList, buildLayers,
                    group = "Month",
                    grouping = groupList,
                    color = color,
                    data = test_util_data,
                    type = "line",
                    mapping = list(x_var = "Day",
                                   y_var = "Temp",
                                   group = "Month"),
                    options = list())

testthat::test_that("buildLayers creates a list of five", {
  expect_output(str(newLayers), "List of 5")
})

treeObject <- build_tree(mtcars, layerLabel = "cars", level_1 = "vs", level_2 = "cyl")

testthat::test_that("build_tree creates two layers", {
  testthat::equals(treeObject$children[[1]]$name, "0")
  testthat::equals(treeObject$children[[1]]$children[[1]]$name, "4")

})

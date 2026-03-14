test_that("buildLayers creates one layer per group", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)
  group_list <- unique(aq[["Month"]])
  colors <- c("#1E90FF", "#DC143C", "#336292", "#070A41", "orange")

  layers <- lapply(group_list, myIO:::buildLayers,
    group = "Month",
    grouping = group_list,
    color = colors,
    data = aq,
    type = "line",
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month"),
    options = list()
  )

  expect_length(layers, length(group_list))
  for (i in seq_along(layers)) {
    expect_equal(layers[[i]]$label, group_list[i])
    expect_equal(layers[[i]]$color, colors[i])
  }
})

test_that("build_tree creates nested tree structure", {
  tree <- myIO:::build_tree(datasets::mtcars, layerLabel = "cars", level_1 = "vs", level_2 = "cyl")
  expect_equal(tree$name, "cars")
  expect_true(length(tree$children) > 0)
})

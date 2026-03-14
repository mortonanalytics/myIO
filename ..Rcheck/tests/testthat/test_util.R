# Tests for utility functions

test_that("buildLayers creates one layer per group", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)
  group_list <- unique(aq[["Month"]])
  colors <- c("#1E90FF", "#DC143C", "#336292", "#070A41", "orange")

  layers <- lapply(group_list, buildLayers,
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
    expect_equal(layers[[i]]$type, "line")
    expect_equal(layers[[i]]$label, group_list[i])
    expect_equal(layers[[i]]$color, colors[i])
  }
})

test_that("buildLayers assigns correct color by group position", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)
  group_list <- unique(aq[["Month"]])
  colors <- c("red", "green", "blue", "yellow", "purple")

  layers <- lapply(group_list, buildLayers,
    group = "Month",
    grouping = group_list,
    color = colors,
    data = aq,
    type = "point",
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month"),
    options = list()
  )

  for (i in seq_along(layers)) {
    expect_equal(layers[[i]]$color, colors[i])
  }
})

test_that("buildLayers splits data correctly per group", {
  aq <- datasets::airquality
  aq$Month <- paste0("M", aq$Month)
  group_list <- unique(aq[["Month"]])
  colors <- c("#1E90FF", "#DC143C", "#336292", "#070A41", "orange")

  layers <- lapply(group_list, buildLayers,
    group = "Month",
    grouping = group_list,
    color = colors,
    data = aq,
    type = "line",
    mapping = list(x_var = "Day", y_var = "Temp", group = "Month"),
    options = list()
  )

  # each layer's data length should match the group's row count
  for (i in seq_along(layers)) {
    expected_rows <- nrow(aq[aq$Month == group_list[i], ])
    expect_length(layers[[i]]$data, expected_rows)
  }
})

test_that("build_tree creates nested tree structure", {
  tree <- build_tree(datasets::mtcars,
    layerLabel = "cars",
    level_1 = "vs",
    level_2 = "cyl"
  )

  expect_equal(tree$name, "cars")
  expect_true(length(tree$children) > 0)

  # each child should have a name and children

  for (child in tree$children) {
    expect_true(!is.null(child$name))
    expect_true(!is.null(child$children))
    for (grandchild in child$children) {
      expect_true(!is.null(grandchild$name))
      expect_true(!is.null(grandchild$children))
    }
  }
})

test_that("build_tree has correct top-level groups", {
  tree <- build_tree(datasets::mtcars,
    layerLabel = "test",
    level_1 = "vs",
    level_2 = "cyl"
  )
  top_names <- vapply(tree$children, function(x) x$name, character(1))
  expect_true(all(top_names %in% c("0", "1")))
})

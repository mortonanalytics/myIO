test_that("build_tree creates nested tree structure", {
  tree <- myIO:::build_tree(datasets::mtcars, layerLabel = "cars", level_1 = "vs", level_2 = "cyl")
  expect_equal(tree$name, "cars")
  expect_true(length(tree$children) > 0)
})

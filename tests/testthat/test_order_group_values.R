test_that("order_group_values sorts characters in the C locale", {
  expect_equal(myIO:::order_group_values(c("b", "A", "a", "B")), c("A", "B", "a", "b"))
})

test_that("order_group_values honours factor levels, not labels", {
  f <- factor(c("mid", "low", "high"), levels = c("low", "mid", "high"))
  expect_equal(as.character(myIO:::order_group_values(f)), c("low", "mid", "high"))
})

test_that("order_group_values sorts numerics numerically and puts NA last", {
  expect_equal(myIO:::order_group_values(c(10, 2, 33)), c(2, 10, 33))
  expect_equal(myIO:::order_group_values(c("b", NA, "a")), c("a", "b", NA))
})

test_that("missing labels stay distinct from literal NA labels", {
  values <- c("NA", NA, "(NA)", "a")
  expect_equal(myIO:::group_labels(values), c("NA", "NA (missing)", "(NA)", "a"))
})

test_that("NA and NaN groups retain distinct observations and labels", {
  df <- myIO:::ensure_source_key(data.frame(x = c(1, NA_real_, NaN, NA_real_, NaN), y = 1:5))
  expect_equal(myIO:::group_labels(unique(df$x)), c("1", "NA", "NaN"))
  result <- myIO:::transform_mean(df, list(x_var = "x", y_var = "y"))
  expect_equal(result$data$y, c(1, 3, 4))
  expect_equal(result$meta$sourceKeys, list("row_1", c("row_2", "row_4"), c("row_3", "row_5")))
  chart <- addIoLayer(myIO(df), "point", label = "points", mapping = list(x_var = "y", y_var = "y", group = "x"))
  expect_equal(vapply(chart$x$config$layers, function(x) x$label, character(1)), c("1", "NA", "NaN"))
  expect_equal(vapply(chart$x$config$layers, function(x) length(x$data), integer(1)), c(1L, 2L, 2L))
})

test_that("missing labels remain distinct after JavaScript tag sanitization", {
  labels <- myIO:::group_labels(c("N+A", NA, "NA (missing)"))
  expect_equal(labels, c("N+A", "NA (missing 2)", "NA (missing)"))
  tags <- gsub("[^a-zA-Z0-9_-]", "", labels)
  expect_equal(length(unique(tags)), length(tags))
})

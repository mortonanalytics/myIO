test_that("pairwise_test returns correct columns", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = c(rnorm(10, 5), rnorm(10, 10), rnorm(10, 5)),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expected_cols <- c("x1", "x2", "y", "group1", "group2", "p_value", "label", "method", "statistic")
  expect_true(all(expected_cols %in% colnames(result$data)))
})

test_that("3 groups produce 3 comparisons", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = rnorm(30),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_equal(nrow(result$data), 3)
})

test_that("clearly different groups have p < 0.05", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 30),
    value = c(rnorm(30, 0, 1), rnorm(30, 10, 1)),
    `_source_key` = paste0("row_", 1:60),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_true(result$data$p_value[1] < 0.05)
  expect_true(grepl("\\*", result$data$label[1]))
})

test_that("identical groups have p near 1", {
  set.seed(42)
  vals <- rnorm(20)
  df <- data.frame(
    group = rep(c("A", "B"), each = 20),
    value = c(vals, vals),
    `_source_key` = paste0("row_", 1:40),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_true(result$data$p_value[1] > 0.9)
  expect_true(grepl("ns", result$data$label[1]))
})

test_that("wilcox.test method works", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 15),
    value = c(rnorm(15, 0), rnorm(15, 5)),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                            options = list(method = "wilcox.test"))
  expect_true(result$data$p_value[1] < 0.05)
  expect_true(grepl("Wilcoxon", result$data$method[1]))
})

test_that("bonferroni adjustment increases p-values", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 20),
    value = c(rnorm(20, 0), rnorm(20, 2), rnorm(20, 4)),
    `_source_key` = paste0("row_", 1:60),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  raw <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  adj <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(p_adjust = "bonferroni"))
  expect_true(all(adj$data$p_value >= raw$data$p_value - 1e-10))
})

test_that("explicit comparisons limits output rows", {
  df <- data.frame(
    group = rep(c("A", "B", "C"), each = 10),
    value = rnorm(30),
    `_source_key` = paste0("row_", 1:30),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                            options = list(comparisons = list(c("A", "C"))))
  expect_equal(nrow(result$data), 1)
  expect_equal(result$data$group1, "A")
  expect_equal(result$data$group2, "C")
})

test_that("errors on fewer than 2 groups", {
  df <- data.frame(
    group = rep("A", 10), value = rnorm(10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "at least 2"
  )
})

test_that("errors on non-numeric y_var", {
  df <- data.frame(
    group = rep(c("A", "B"), each = 5),
    value = rep("text", 10),
    `_source_key` = paste0("row_", 1:10),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_error(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "numeric"
  )
})

test_that("bracket heights are above data max", {
  df <- data.frame(
    group = rep(c("A", "B", "C", "D"), each = 10),
    value = rnorm(40),
    `_source_key` = paste0("row_", 1:40),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_true(all(result$data$y > max(df$value)))
  expect_equal(length(unique(result$data$y)), nrow(result$data))
})

test_that("metadata has correct name", {
  df <- data.frame(
    group = rep(c("A", "B"), each = 10), value = rnorm(20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  result <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"))
  expect_equal(result$meta$name, "pairwise_test")
  expect_equal(result$meta$derivedFrom, "input_rows")
})

test_that("warns on > 15 comparisons", {
  df <- data.frame(
    group = rep(paste0("G", 1:7), each = 5),
    value = rnorm(35),
    `_source_key` = paste0("row_", 1:35),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  expect_warning(
    myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value")),
    "15"
  )
})

test_that("step_fraction option changes bracket spacing", {
  set.seed(42)
  df <- data.frame(
    group = rep(c("A", "B"), each = 10), value = rnorm(20),
    `_source_key` = paste0("row_", 1:20),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  r1 <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(step_fraction = 0.08))
  r2 <- myIO:::transform_pairwise_test(df, list(x_var = "group", y_var = "value"),
                                         options = list(step_fraction = 0.15))
  expect_true(r2$data$y[1] > r1$data$y[1])
})

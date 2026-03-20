# Extended tests for internal utility functions

# --- ensure_source_key ---

test_that("ensure_source_key adds _source_key column", {
  df <- data.frame(x = 1:3, y = 4:6)
  result <- myIO:::ensure_source_key(df)
  expect_true("_source_key" %in% colnames(result))
  expect_equal(result[["_source_key"]], c("row_1", "row_2", "row_3"))
})

test_that("ensure_source_key preserves existing _source_key", {
  df <- data.frame(x = 1:2, `_source_key` = c("a", "b"), check.names = FALSE)
  result <- myIO:::ensure_source_key(df)
  expect_equal(result[["_source_key"]], c("a", "b"))
})

test_that("ensure_source_key converts existing key to character", {
  df <- data.frame(x = 1:2, `_source_key` = 1:2, check.names = FALSE)
  result <- myIO:::ensure_source_key(df)
  expect_equal(result[["_source_key"]], c("1", "2"))
})

test_that("ensure_source_key handles NULL data", {
  expect_null(myIO:::ensure_source_key(NULL))
})

# --- next_layer_id ---

test_that("next_layer_id generates correct IDs", {
  expect_equal(myIO:::next_layer_id(list()), "layer_001")
  expect_equal(myIO:::next_layer_id(list("a")), "layer_002")
  expect_equal(myIO:::next_layer_id(list("a", "b", "c")), "layer_004")
})

test_that("next_layer_id supports custom prefix", {
  expect_equal(myIO:::next_layer_id(list(), prefix = "sub"), "sub_001")
})

# --- new_transform_meta ---

test_that("new_transform_meta creates proper structure", {
  meta <- myIO:::new_transform_meta("identity")
  expect_equal(meta$name, "identity")
  expect_null(meta$sourceKeys)
  expect_null(meta$derivedFrom)
})

test_that("new_transform_meta merges details", {
  meta <- myIO:::new_transform_meta("lm", list(sourceKeys = list("k1", "k2"), derivedFrom = "input"))
  expect_equal(meta$name, "lm")
  expect_equal(meta$sourceKeys, list("k1", "k2"))
  expect_equal(meta$derivedFrom, "input")
})

# --- as_layer_rows ---

test_that("as_layer_rows converts data frame to list of row-lists", {
  df <- data.frame(a = 1:2, b = c("x", "y"), stringsAsFactors = FALSE)
  result <- myIO:::as_layer_rows(df)
  expect_length(result, 2)
  expect_equal(result[[1]]$a, 1)
  expect_equal(result[[1]]$b, "x")
  expect_equal(result[[2]]$a, 2)
  expect_equal(result[[2]]$b, "y")
})

test_that("as_layer_rows handles single row", {
  df <- data.frame(x = 42)
  result <- myIO:::as_layer_rows(df)
  expect_length(result, 1)
  expect_equal(result[[1]]$x, 42)
})

# --- build_tree ---

test_that("build_tree creates correct hierarchy depth", {
  df <- data.frame(
    dept = c("A", "A", "B"),
    team = c("t1", "t2", "t3"),
    val = c(10, 20, 30),
    stringsAsFactors = FALSE
  )
  tree <- myIO:::build_tree(df, "root", "dept", "team")
  expect_equal(tree$name, "root")
  expect_length(tree$children, 2)  # A and B

  # Check nesting
  dept_a <- tree$children[[1]]
  expect_equal(dept_a$name, "A")
  expect_length(dept_a$children, 2)  # t1 and t2
})

test_that("build_tree leaf nodes contain row data", {
  df <- data.frame(dept = "X", team = "y", val = 99, stringsAsFactors = FALSE)
  tree <- myIO:::build_tree(df, "r", "dept", "team")
  leaf <- tree$children[[1]]$children[[1]]
  expect_equal(leaf$name, "y")
  expect_length(leaf$children, 1)
  expect_equal(leaf$children[[1]]$val, 99)
})

# --- composite_registry ---

test_that("composite_registry returns a list", {
  expect_true(is.list(myIO:::composite_registry()))
})

# --- transform_registry ---

test_that("transform_registry contains identity and lm", {
  reg <- myIO:::transform_registry()
  expect_true("identity" %in% names(reg))
  expect_true("lm" %in% names(reg))
  expect_true("cumulative" %in% names(reg))
  expect_true("quantiles" %in% names(reg))
  expect_true("median" %in% names(reg))
  expect_true("outliers" %in% names(reg))
  expect_true("density" %in% names(reg))
  expect_true(is.function(reg$identity))
  expect_true(is.function(reg$lm))
  expect_true(is.function(reg$cumulative))
  expect_true(is.function(reg$quantiles))
  expect_true(is.function(reg$median))
  expect_true(is.function(reg$outliers))
  expect_true(is.function(reg$density))
})

test_that("assert_myIO accepts widgets and rejects plain lists", {
  widget <- myIO::myIO()
  expect_identical(myIO:::assert_myIO(widget), invisible(widget))
  expect_error(myIO:::assert_myIO(list()), "Expected a myIO widget, got 'list'\\.")
})

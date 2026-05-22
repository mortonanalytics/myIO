test_that("transform_quantile_dots computes equally spaced per-group quantiles", {
  df <- data.frame(
    group = c(rep("A", 5), rep("B", 5)),
    value = c(1, 2, 3, 4, 5, 10, 20, 30, 40, 50),
    `_source_key` = paste0("row_", seq_len(10)),
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  result <- myIO:::transform_quantile_dots(
    df,
    list(x_var = "group", y_var = "value"),
    list(n = 4, source = "empirical", threshold = 3)
  )

  expect_equal(nrow(result$data), 8)
  expect_equal(names(result$data), c("group", "value", "quantile_rank", "threshold_relationship", "_source_key"))
  expect_equal(result$data$quantile_rank, rep(1:4, 2))
  expect_equal(result$data$threshold_relationship[1:4], c("below", "below", "above", "above"))
  expect_equal(result$meta$name, "quantile_dots")
  expect_equal(result$meta$source, "empirical")
  expect_equal(result$meta$n, 4L)
  expect_equal(result$meta$threshold, 3)
  expect_length(result$meta$sourceKeys, 2)
})

test_that("quantile_dots requires a declared source", {
  df <- data.frame(group = "A", value = 1, `_source_key` = "row_1", check.names = FALSE)

  expect_error(
    myIO:::transform_quantile_dots(df, list(x_var = "group", y_var = "value"), list(n = 20)),
    "bootstrap.*posterior.*ensemble.*empirical"
  )
})

test_that("addIoLayer uses quantile_dots as the default transform for quantile dot layers", {
  w <- myIO::myIO(datasets::iris) |>
    myIO::addIoLayer(
      type = "quantile_dots",
      label = "Sepal width dots",
      mapping = list(x_var = "Species", y_var = "Sepal.Width"),
      options = list(n = 20, source = "empirical", threshold = 3)
    )

  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "quantile_dots")
  expect_equal(layer$transform, "quantile_dots")
  expect_equal(layer$mapping$y_var, "value")
  expect_equal(layer$mapping$quantile_rank, "quantile_rank")
  expect_equal(layer$mapping$threshold_relationship, "threshold_relationship")
  expect_equal(length(layer$data), 60)
})

test_that("quantile_dots rejects a separate group aesthetic", {
  df <- data.frame(group = c("A", "A"), subgroup = c("x", "y"), value = c(1, 2))

  expect_error(
    myIO::myIO(df) |>
      myIO::addIoLayer(
        type = "quantile_dots",
        label = "dots",
        mapping = list(x_var = "group", y_var = "value", group = "subgroup"),
        options = list(source = "empirical")
      ),
    "do not supply a separate `group` mapping"
  )
})

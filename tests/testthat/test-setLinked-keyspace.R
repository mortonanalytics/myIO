test_that("setLinked() key vector is positionally parallel to the layer rows", {
  skip_if_not_installed("crosstalk")
  # The browser-side translation from the private "row_<i>" ids to Crosstalk's
  # own key space is a positional lookup: cfg.key[[i]] must describe the same
  # row as layer$data[[i]]. That is Crosstalk's own contract ($data() and
  # $key() are parallel vectors), and this test pins it on the myIO side so a
  # future change to ensure_source_key() or to the row serializer cannot
  # silently mislabel every linked mark.
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
  w <- myIO(data = shared$data()) |>
    addIoLayer(type = "point", label = "scatter",
               mapping = list(x_var = "wt", y_var = "mpg")) |>
    setLinked(shared)

  cfg <- w$x$config$interactions$linked
  rows <- w$x$config$layers[[1]]$data

  expect_equal(length(cfg$key), length(rows))
  expect_identical(cfg$key[[1]], "Mazda RX4")
  expect_identical(cfg$key[[length(cfg$key)]], "Volvo 142E")
  expect_identical(
    vapply(rows, function(r) r[["_source_key"]], character(1)),
    sprintf("row_%d", seq_along(rows))
  )
})

test_that("an explicit key= overrides the SharedData keys but stays parallel", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(head(mtcars, 3), key = ~rownames(head(mtcars, 3)))
  w <- myIO(data = shared$data()) |>
    addIoLayer(type = "point", label = "scatter",
               mapping = list(x_var = "wt", y_var = "mpg")) |>
    setLinked(shared, key = c("a", "b", "c"))

  cfg <- w$x$config$interactions$linked
  expect_equal(unlist(cfg$key), c("a", "b", "c"))
  expect_equal(length(cfg$key), length(w$x$config$layers[[1]]$data))
})

test_that("the linked module reads the serialized key vector", {
  # Source-presence lock, NOT a behavioural test. The R side of the key-space
  # fix is unchanged -- setLinked() already serialized `key`; the defect was
  # that no browser-side module read it. The behavioural coverage lives in
  # tests/js/linked-crosstalk-keys.test.js. This guards against the reader
  # being dropped again in a refactor, following the same source-contract
  # precedent as the LINKABLE_TYPES test in test-linked-coverage.R.
  src_path <- system.file("htmlwidgets/myIO/src/interactions/linked.js",
                          package = "myIO")
  if (!nzchar(src_path)) src_path <- "inst/htmlwidgets/myIO/src/interactions/linked.js"
  src <- paste(readLines(src_path, warn = FALSE), collapse = "\n")

  expect_true(grepl("buildKeyMap", src, fixed = TRUE))
  expect_true(grepl("cfg.key", src, fixed = TRUE))
})

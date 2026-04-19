test_that("setLinked() works with v1.2-expanded layer types", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(iris, key = ~Species)

  mappings <- list(
    waffle   = list(category = "Species", value = "Sepal.Length"),
    beeswarm = list(x_var = "Sepal.Length", y_var = "Species"),
    lollipop = list(x_var = "Species", y_var = "Sepal.Length"),
    dumbbell = list(x_var = "Species", low_y = "Sepal.Length", high_y = "Sepal.Width")
  )

  for (layer_type in names(mappings)) {
    w <- myIO(data = shared$data()) |>
      addIoLayer(type = layer_type, label = "l",
                 mapping = mappings[[layer_type]]) |>
      setLinked(shared)
    expect_true(isTRUE(w$x$config$interactions$linked$enabled),
                info = paste("linked not enabled for", layer_type))
    has_crosstalk_dep <- any(vapply(w$dependencies,
                                    function(d) identical(d$name, "crosstalk"),
                                    logical(1)))
    expect_true(has_crosstalk_dep,
                info = paste("crosstalk dep missing for", layer_type))
  }
})

test_that("v1.1 linkable types continue to participate (regression)", {
  skip_if_not_installed("crosstalk")
  shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))

  v1_1_mappings <- list(
    point      = list(x_var = "wt", y_var = "mpg"),
    bar        = list(x_var = "cyl", y_var = "mpg"),
    histogram  = list(value = "mpg"),
    hexbin     = list(x_var = "wt", y_var = "mpg", radius = "hp"),
    groupedBar = list(x_var = "cyl", y_var = "mpg", group = "gear")
  )

  for (layer_type in names(v1_1_mappings)) {
    w <- myIO(data = shared$data()) |>
      addIoLayer(type = layer_type, label = "l",
                 mapping = v1_1_mappings[[layer_type]]) |>
      setLinked(shared)
    expect_true(isTRUE(w$x$config$interactions$linked$enabled),
                info = paste("regression: linked failed for", layer_type))
  }
})

test_that("LINKABLE_TYPES bundle contains expanded allowlist", {
  bundle_path <- system.file("htmlwidgets/myIO/myIOapi.js", package = "myIO")
  if (!nzchar(bundle_path)) bundle_path <- "inst/htmlwidgets/myIO/myIOapi.js"
  src <- readLines(bundle_path, warn = FALSE)
  joined <- paste(src, collapse = "\n")
  pattern <- 'LINKABLE_TYPES\\s*=\\s*\\[([^\\]]+)\\]'
  m <- regmatches(joined, regexpr(pattern, joined, perl = TRUE))
  expect_length(m, 1)
  for (expected in c("waffle", "beeswarm", "lollipop", "dumbbell",
                     "point", "bar", "histogram", "hexbin", "groupedBar")) {
    expect_true(grepl(sprintf('"%s"', expected), m, fixed = TRUE),
                info = paste("LINKABLE_TYPES missing:", expected))
  }
})

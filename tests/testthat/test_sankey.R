test_that("addIoLayer accepts sankey mappings", {
  df <- data.frame(
    source = c("A", "B"),
    target = c("B", "C"),
    value = c(2, 3),
    stringsAsFactors = FALSE
  )

  w <- myIO::addIoLayer(
    myIO::myIO(),
    type = "sankey",
    label = "flow",
    data = df,
    mapping = list(source = "source", target = "target", value = "value")
  )

  layer <- w$x$config$layers[[1]]
  expect_equal(layer$type, "sankey")
  expect_equal(layer$transform, "identity")
  expect_equal(layer$mapping$source, "source")
})

test_that("addIoLayer rejects missing sankey mappings", {
  df <- data.frame(
    source = c("A", "B"),
    target = c("B", "C"),
    value = c(2, 3),
    stringsAsFactors = FALSE
  )

  expect_error(
    myIO::addIoLayer(
      myIO::myIO(),
      type = "sankey",
      label = "flow",
      data = df,
      mapping = list(source = "source", value = "value")
    ),
    "Missing required mapping"
  )
})

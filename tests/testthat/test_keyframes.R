test_that("charts without keyframes keep the existing config contract", {
  chart <- myIO(mtcars) |>
    addIoLayer("point", label = "cars",
      mapping = list(x_var = "wt", y_var = "mpg"))

  expect_null(chart$x$config$keyframes)
})

test_that("addKeyframe serializes a transformed single-layer snapshot", {
  first <- data.frame(x = 1:6, y = c(2, 8, 3, 9, 4, 10))
  second <- data.frame(x = 1:6, y = c(10, 4, 9, 3, 8, 2))
  chart <- myIO(first) |>
    addIoLayer("line", label = "series",
      mapping = list(x_var = "x", y_var = "y"),
      transform = "lttb", options = list(threshold = 3L)) |>
    addKeyframe(first, "Before") |>
    addKeyframe(second, "After")

  expect_equal(vapply(chart$x$config$keyframes, `[[`, character(1), "label"),
    c("Before", "After"))
  expect_equal(length(chart$x$config$keyframes[[1]]$layers), 1L)
  expect_equal(chart$x$config$keyframes[[1]]$layers[[1]]$label, "series")
  expect_equal(length(chart$x$config$keyframes[[1]]$layers[[1]]$data), 3L)
  expect_true(all(vapply(chart$x$config$keyframes[[1]]$layers[[1]]$data,
    function(row) "_source_key" %in% names(row), logical(1))))
})

test_that("multi-layer keyframes materialize complete snapshots", {
  initial_a <- data.frame(x = 1:2, y = c(1, 2))
  initial_b <- data.frame(x = 1:2, y = c(3, 4))
  changed_a <- data.frame(x = 1:3, y = c(9, 8, 7))
  chart <- myIO() |>
    addIoLayer("line", label = "a", data = initial_a,
      mapping = list(x_var = "x", y_var = "y")) |>
    addIoLayer("line", label = "b", data = initial_b,
      mapping = list(x_var = "x", y_var = "y")) |>
    addKeyframe(list(a = changed_a), "Only A changes")

  frame <- chart$x$config$keyframes[[1]]
  expect_equal(vapply(frame$layers, `[[`, character(1), "label"), c("a", "b"))
  expect_equal(length(frame$layers[[1]]$data), 3L)
  expect_equal(frame$layers[[2]]$data, chart$x$config$layers[[2]]$data)
})

test_that("addKeyframe rejects ambiguous and malformed inputs", {
  empty <- myIO()
  expect_error(addKeyframe(empty, data.frame(x = 1), "frame"), "at least one layer")

  one <- myIO(data.frame(x = 1, y = 2)) |>
    addIoLayer("point", label = "one",
      mapping = list(x_var = "x", y_var = "y"))
  expect_error(addKeyframe(one, data.frame(x = 1), ""), "non-empty")
  expect_error(addKeyframe(one, list(missing = data.frame(x = 1)), "bad"),
    "unknown layer")
  expect_error(addKeyframe(one, list(one = 42), "bad"), "data frame")

  duplicate <- addKeyframe(one, data.frame(x = 1, y = 2), "same")
  expect_error(addKeyframe(duplicate, data.frame(x = 2, y = 3), "same"),
    "unique")

  two <- one |>
    addIoLayer("point", label = "two", data = data.frame(x = 3, y = 4),
      mapping = list(x_var = "x", y_var = "y"))
  expect_error(addKeyframe(two, data.frame(x = 1, y = 2), "ambiguous"),
    "named list")
})

test_that("keyframe proxy helpers emit stable Shiny message payloads", {
  session <- new.env(parent = emptyenv())
  session$ns <- function(id) paste0("ns-", id)
  session$sendCustomMessage <- function(type, message) {
    session$type <- type
    session$message <- message
  }
  proxy <- structure(list(id = "ns-chart", session = session), class = "myIO_proxy")

  expect_invisible(setKeyframe(proxy, "After"))
  expect_equal(session$type, "myio:keyframe-control")
  expect_equal(session$message,
    list(id = "ns-chart", action = "select", frame = "After"))

  expect_invisible(setKeyframe(proxy, 2L))
  expect_equal(session$message$frame, 2L)

  expect_invisible(stepKeyframe(proxy, "previous"))
  expect_equal(session$message,
    list(id = "ns-chart", action = "step", direction = "previous"))

  expect_error(setKeyframe(list(), "After"), "myIOProxy")
  expect_error(setKeyframe(proxy, 0), "positive")
  expect_error(setKeyframe(proxy, c("a", "b")), "single")
  expect_error(stepKeyframe(proxy, "sideways"), "arg")
})

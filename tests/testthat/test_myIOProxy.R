# B5: myIOProxy()/updateMyIOData() Shiny partial-update payload contract.

fake_session <- function() {
  env <- new.env()
  list(
    ns = function(id) paste0("ns-", id),
    sendCustomMessage = function(type, message) {
      env$type <- type
      env$message <- message
    },
    .captured = env
  )
}

test_that("myIOProxy namespaces the outputId and carries the session", {
  s <- fake_session()
  p <- myIOProxy("chart", session = s)
  expect_s3_class(p, "myIO_proxy")
  expect_equal(p$id, "ns-chart")
})

test_that("myIOProxy errors without a session / reactive domain", {
  expect_error(myIOProxy("chart"), "Shiny session")
})

test_that("updateMyIOData sends the row-rectangled payload to the right id", {
  s <- fake_session()
  p <- myIOProxy("chart", session = s)
  df <- data.frame(x = 1:3, y = c(10, 20, 30))
  updateMyIOData(p, series = df)

  expect_equal(s$.captured$type, "myio:proxy-update")
  msg <- s$.captured$message
  expect_equal(msg$id, "ns-chart")
  expect_length(msg$layers, 1L)
  expect_equal(msg$layers[[1]]$label, "series")
  # data is the as_layer_rows shape: a list of per-row named lists.
  rows <- msg$layers[[1]]$data
  expect_length(rows, 3L)
  expect_equal(rows[[1]]$x, 1L)
  expect_equal(rows[[3]]$y, 30)
  expect_true("_source_key" %in% names(rows[[1]]))
})

test_that("updateMyIOData accepts multiple layer updates", {
  s <- fake_session()
  p <- myIOProxy("chart", session = s)
  updateMyIOData(p,
                 a = data.frame(x = 1, y = 2),
                 b = data.frame(x = 3:4, y = 5:6))
  labels <- vapply(s$.captured$message$layers, function(l) l$label, character(1))
  expect_equal(labels, c("a", "b"))
})

test_that("updateMyIOData validates its inputs", {
  s <- fake_session()
  p <- myIOProxy("chart", session = s)
  expect_error(updateMyIOData(list()), "myIOProxy")
  expect_error(updateMyIOData(p), "named")
  expect_error(updateMyIOData(p, series = 1:3), "data frame")
})

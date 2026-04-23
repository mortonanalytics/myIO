test_that("shiny_query_handler sends myio:error when templateId is not whitelisted", {
  skip_if_not_installed("shiny")
  session <- shiny::MockShinySession$new()
  session$userData$myIO_sources <- list(
    s1 = list(mode = "inline_ipc", schema = list(list(name = "x", type = "int")))
  )
  msg <- list(v = 1L, queryId = "q1", templateId = "not_whitelisted",
              sourceId = "s1", predicateHash = "p1", bindings = list(),
              limit = 100L)
  sent <- list()
  session$sendCustomMessage <- function(type, value) {
    sent[[length(sent) + 1L]] <<- list(type = type, value = value)
  }
  myIO:::shiny_query_handler(msg, session, "myio.query")
  expect_length(sent, 1L)
  expect_equal(sent[[1]]$type, "myio:error")
  expect_equal(sent[[1]]$value$code, "forbidden")
  expect_equal(sent[[1]]$value$queryId, "q1")
})

test_that("shiny_cancel_handler sets session cancel flag", {
  skip_if_not_installed("shiny")
  session <- shiny::MockShinySession$new()
  myIO:::shiny_cancel_handler(list(v = 1L, queryId = "q1"), session, "myio.cancel")
  expect_true(isTRUE(session$userData$myIO_cancel[["q1"]]))
})

test_that("shiny_ack_handler decrements pending count", {
  skip_if_not_installed("shiny")
  session <- shiny::MockShinySession$new()
  session$userData$myIO_ack_pending <- list(q1 = 3L)
  myIO:::shiny_ack_handler(list(v = 1L, queryId = "q1", seq = 1L), session, "myio.ack")
  expect_equal(session$userData$myIO_ack_pending[["q1"]], 2L)
})

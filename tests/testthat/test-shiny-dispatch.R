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

# End-to-end: renderMyIO() registers the source, the browser's query arrives
# under the input name Shiny routes to the myio.query handler, and the
# streamed Arrow batch decodes to the chart's rows (issue #123).
.run_server_engine_query <- function(widget_expr, bindings, template_id = "mark_xy") {
  server <- function(input, output, session) {
    output$chart <- renderMyIO(widget_expr())
  }
  out <- NULL
  shiny::testServer(server, {
    x <- jsonlite::fromJSON(output$chart, simplifyVector = FALSE)$x
    sent <- list()
    session$sendCustomMessage <- function(type, value) {
      sent[[length(sent) + 1L]] <<- list(type = type, value = value)
    }
    msg <- list(v = 1L, queryId = "q1", templateId = template_id,
                sourceId = x$bigdata$source_id, predicateHash = "h",
                bindings = bindings, limit = 1000L)
    # The same input-handler dispatch a live ShinySession applies to browser
    # input messages.
    shiny:::applyInputHandlers(list(`myio_query:myio.query` = msg), session)
    for (i in 1:20) {
      later::run_now(0.05)
      if (any(vapply(sent, function(s) s$type %in% c("myio:end", "myio:error"), logical(1)))) break
    }
    out <<- list(payload = x, sent = sent,
                 registry = session$userData$myIO_sources)
  })
  out
}

.batch_rows <- function(sent) {
  batches <- Filter(function(s) identical(s$type, "myio:batch"), sent)
  do.call(rbind, lapply(batches, function(s) {
    as.data.frame(arrow::read_ipc_stream(base64enc::base64decode(s$value$ipc)))
  }))
}

test_that("server engine answers a Shiny query for an inline big-data source", {
  skip_if_not_installed("shiny")
  for (pkg in c("duckdb", "DBI", "arrow", "base64enc", "later")) skip_if_not_installed(pkg)
  df <- data.frame(x = c(1, 2, 3), y = c(10, 20, 30))
  res <- .run_server_engine_query(
    function() {
      myIO(engine = "server") |>
        addIoLayer(type = "point", label = "pts", data = df,
                   mapping = list(x_var = "x", y_var = "y")) |>
        setBigData(df)
    },
    bindings = list(x = "x", y = "y",
                    where = list(list(column = "__myio_rowkey__", values = list("1", "3"))))
  )

  expect_named(res$registry, res$payload$bigdata$source_id)
  types <- vapply(res$sent, `[[`, character(1), "type")
  expect_equal(types, c("myio:batch", "myio:end"))
  rows <- .batch_rows(res$sent)
  expect_equal(rows$x, c(1, 3))
  expect_equal(rows$y, c(10, 30))
})

test_that("server engine answers a Shiny query for a DBI source and leaves the connection open", {
  skip_if_not_installed("shiny")
  for (pkg in c("duckdb", "DBI", "arrow", "base64enc", "later")) skip_if_not_installed(pkg)
  con <- DBI::dbConnect(duckdb::duckdb())
  on.exit(DBI::dbDisconnect(con, shutdown = TRUE), add = TRUE)
  DBI::dbWriteTable(con, "obs", data.frame(id = 1:4, x = c(1, 2, 3, 4), y = c(5, 6, 7, 8)))
  layer_df <- data.frame(x = 1, y = 1)
  res <- .run_server_engine_query(
    function() {
      myIO(engine = "server") |>
        addIoLayer(type = "point", label = "pts", data = layer_df,
                   mapping = list(x_var = "x", y_var = "y")) |>
        setBigData(con, table = "obs", rowkeyCol = "id")
    },
    bindings = list(x = "x", y = "y", where = list())
  )

  expect_null(res$payload$bigdata$dbi_handle_internal)
  rows <- .batch_rows(res$sent)
  expect_equal(rows$y, c(5, 6, 7, 8))
  expect_true(DBI::dbIsValid(con))
})

test_that("re-rendering an output replaces its registered source", {
  skip_if_not_installed("shiny")
  for (pkg in c("arrow", "base64enc")) skip_if_not_installed(pkg)
  server <- function(input, output, session) {
    output$chart <- renderMyIO({
      df <- data.frame(x = seq_len(input$n), y = seq_len(input$n))
      myIO(engine = "server") |>
        addIoLayer(type = "point", label = "pts", data = df,
                   mapping = list(x_var = "x", y_var = "y")) |>
        setBigData(df)
    })
  }
  shiny::testServer(server, {
    session$setInputs(n = 3)
    first <- jsonlite::fromJSON(output$chart, simplifyVector = FALSE)$x$bigdata$source_id
    session$setInputs(n = 5)
    second <- jsonlite::fromJSON(output$chart, simplifyVector = FALSE)$x$bigdata$source_id
    expect_named(session$userData$myIO_sources, second)
    expect_false(identical(first, second))
  })
})

test_that("where binding refuses columns outside the source schema", {
  registry <- list(s1 = list(table = "s1", schema = list(list(name = "x"), list(name = "y"))))
  res <- validate_query_message(
    list(v = 1, queryId = "q1", templateId = "mark_xy", sourceId = "s1",
         predicateHash = "h",
         bindings = list(x = "x", y = "y",
                         where = list(list(column = "secret", values = list(1))))),
    registry, default_template_registry()
  )
  expect_equal(res$status, "error")
  expect_equal(res$code, "forbidden")
})

test_that("where binding composes bound IN filters", {
  registry <- list(s1 = list(table = "s1", schema = list(list(name = "x"), list(name = "y"))))
  res <- validate_query_message(
    list(v = 1, queryId = "q1", templateId = "mark_xy", sourceId = "s1",
         predicateHash = "h", limit = 10L,
         bindings = list(x = "x", y = "y",
                         where = list(list(column = "x", values = list(1, 2))))),
    registry, default_template_registry()
  )
  expect_equal(res$status, "ok")
  expect_equal(res$sql, 'SELECT "x" AS x, "y" AS y FROM "s1" WHERE ("x" IN (?, ?)) LIMIT 10')
  expect_equal(res$params, list(1, 2))
})

skip_if_not_installed("shiny")

new_mock_session <- function() {
  if (exists("MockShinySession", envir = asNamespace("shiny"))) {
    getExportedValue("shiny", "MockShinySession")$new()
  } else if (exists("makeMockShinySession", envir = asNamespace("shiny"))) {
    get("makeMockShinySession", envir = asNamespace("shiny"))()
  } else {
    skip("This Shiny version does not provide a mock session helper")
  }
}

test_that("register_source stores entry keyed by sourceId in session$userData$myIO_sources", {
  session <- new_mock_session()
  source <- list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 10L,
    owner_chart_id = "chart_1"
  )

  register_source(session, "src_abc", source)

  entry <- session$userData$myIO_sources[["src_abc"]]
  expect_equal(entry$mode, "inline_ipc")
  expect_equal(entry$schema, list())
  expect_equal(entry$row_count, 10L)
  expect_equal(entry$owner_chart_id, "chart_1")
})

test_that("resolve_source returns NULL for unknown sourceId", {
  session <- new_mock_session()

  expect_null(resolve_source(session, "missing_src"))
})

test_that("two parallel mock sessions isolate their source registries", {
  session_a <- new_mock_session()
  session_b <- new_mock_session()

  register_source(session_a, "src_a", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 1L,
    owner_chart_id = "chart_a"
  ))
  register_source(session_b, "src_b", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 2L,
    owner_chart_id = "chart_b"
  ))

  expect_equal(resolve_source(session_a, "src_a")$owner_chart_id, "chart_a")
  expect_null(resolve_source(session_a, "src_b"))
  expect_equal(resolve_source(session_b, "src_b")$owner_chart_id, "chart_b")
  expect_null(resolve_source(session_b, "src_a"))
})

test_that("deregister_chart removes source entries whose owner_chart_id matches the removed chart", {
  session <- new_mock_session()

  register_source(session, "src_1", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 10L,
    owner_chart_id = "chart_1"
  ))
  register_source(session, "src_2", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 20L,
    owner_chart_id = "chart_2"
  ))

  deregister_chart(session, "chart_1")

  expect_null(resolve_source(session, "src_1"))
  expect_equal(resolve_source(session, "src_2")$owner_chart_id, "chart_2")
})

test_that("onSessionEnded cleanup closes owned DBI connections", {
  skip_if_not_installed("DBI")
  library(DBI)

  if (!methods::isClass("myIOTestConnection")) {
    methods::setClass("myIOTestConnection", contains = "DBIConnection")
  }

  disconnected <- new.env(parent = emptyenv())
  disconnected$called <- FALSE
  methods::setMethod("dbDisconnect", "myIOTestConnection", function(conn, ...) {
    disconnected$called <- TRUE
    TRUE
  })

  session <- new_mock_session()
  con <- methods::new("myIOTestConnection")

  register_source(session, "src_dbi", list(
    mode = "dbi",
    con = con,
    schema = list(),
    row_count = 10L,
    owner_chart_id = "chart_1"
  ))

  session$ended()

  expect_true(disconnected$called)
})

test_that("re-registering the same sourceId replaces the prior entry", {
  session <- new_mock_session()

  register_source(session, "src_abc", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 10L,
    owner_chart_id = "chart_1"
  ))
  register_source(session, "src_abc", list(
    mode = "inline_ipc",
    schema = list(),
    row_count = 20L,
    owner_chart_id = "chart_2"
  ))

  entry <- resolve_source(session, "src_abc")
  expect_equal(entry$row_count, 20L)
  expect_equal(entry$owner_chart_id, "chart_2")
})

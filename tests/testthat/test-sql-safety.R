# SQL safety contract tests for the future Shiny query validator.

sql_safety_fixtures <- function() {
  list(
    source_registry = list(
      sales = list(
        source_ref = list(kind = "duckdb", table = "sales_table"),
        schema = c("id", "region", "amount", "my column", "1col")
      )
    ),
    template_registry = list(
      filtered_rows = list(
        sql = paste(
          "SELECT {{identifier:select_col}}",
          "FROM {{source}}",
          "WHERE {{identifier:filter_col}} = {{value:filter_value}}"
        )
      )
    )
  )
}

sql_safety_message <- function(...) {
  utils::modifyList(
    list(
      v = 1L,
      queryId = "q-1",
      templateId = "filtered_rows",
      sourceId = "sales",
      predicateHash = "predicate-1",
      bindings = list(
        select_col = "amount",
        filter_col = "region",
        filter_value = "west"
      ),
      limit = 100L
    ),
    list(...)
  )
}

test_that("unknown templateId is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(templateId = "drop_everything")

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "template", ignore.case = TRUE)
})

test_that("unknown sourceId is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(sourceId = "unregistered_source")

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "source", ignore.case = TRUE)
})

test_that("identifier binding outside the source schema is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(
    bindings = list(
      select_col = "amount",
      filter_col = "not_a_column",
      filter_value = "west"
    )
  )

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "column|schema|identifier", ignore.case = TRUE)
})

test_that("value binding SQL injection is parameterized instead of interpolated", {
  fixtures <- sql_safety_fixtures()
  payload <- "'; DROP TABLE users; --"
  message <- sql_safety_message(
    bindings = list(
      select_col = "amount",
      filter_col = "region",
      filter_value = payload
    )
  )

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, "\\?|\\$1")
  expect_false(grepl(payload, result$sql, fixed = TRUE))
  expect_true(payload %in% unlist(result$params, use.names = FALSE))
})

test_that("column-name SQL injection is rejected by the identifier whitelist", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(
    bindings = list(
      select_col = "amount",
      filter_col = "col\"; DROP TABLE x; --",
      filter_value = "west"
    )
  )

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "column|schema|identifier", ignore.case = TRUE)
})

test_that("valid whitelisted message returns SQL with requested integer limit", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(limit = 250L)

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, "LIMIT\\s+250\\b")
  expect_true(is.list(result$params))
  expect_false(is.null(result$source_ref))
})

test_that("limit above configured max is clamped to the max", {
  old <- getOption("myIO.max_result_rows")
  options(myIO.max_result_rows = 1000L)
  on.exit(options(myIO.max_result_rows = old), add = TRUE)

  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(limit = 1000000L)

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, "LIMIT\\s+1000\\b")
  expect_false(grepl("LIMIT 1000000", result$sql, fixed = TRUE))
})

test_that("missing limit defaults to myIO max result rows", {
  old <- getOption("myIO.max_result_rows")
  options(myIO.max_result_rows = NULL)
  on.exit(options(myIO.max_result_rows = old), add = TRUE)

  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message()
  message$limit <- NULL

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, "LIMIT\\s+500000\\b")
})

test_that("whitelisted column identifiers are double-quoted in SQL", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(
    bindings = list(
      select_col = "amount",
      filter_col = "region",
      filter_value = "west"
    )
  )

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, '"amount"')
  expect_match(result$sql, '"region"')
})

test_that("non-syntactic whitelisted column names are accepted and quoted", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(
    bindings = list(
      select_col = "my column",
      filter_col = "1col",
      filter_value = "west"
    )
  )

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "ok")
  expect_match(result$sql, '"my column"', fixed = TRUE)
  expect_match(result$sql, '"1col"', fixed = TRUE)
})

test_that("NULL protocol version is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message()
  message["v"] <- list(NULL)

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "version|protocol|v", ignore.case = TRUE)
})

test_that("missing protocol version is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message()
  message$v <- NULL

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "version|protocol|v", ignore.case = TRUE)
})

test_that("unknown protocol version is forbidden", {
  fixtures <- sql_safety_fixtures()
  message <- sql_safety_message(v = 2L)

  result <- validate_query_message(
    message,
    fixtures$source_registry,
    fixtures$template_registry
  )

  expect_equal(result$status, "error")
  expect_equal(result$code, "forbidden")
  expect_match(result$message, "version|protocol|v", ignore.case = TRUE)
})

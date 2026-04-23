#' Shiny dispatch and SQL safety helpers
#'
#' @keywords internal
#' @noRd

`%||%` <- function(a, b) {
  if (is.null(a)) b else a
}

.myio_query_error <- function(code, message) {
  list(status = "error", code = code, message = message)
}

.myio_quote_ident <- function(identifier) {
  paste0('"', gsub('"', '""', identifier, fixed = TRUE), '"')
}

.myio_regex_escape <- function(x) {
  gsub("([][{}()+*^$|\\\\?.])", "\\\\\\1", x, perl = TRUE)
}

.myio_extract_typed_slots <- function(sql, type) {
  pattern <- sprintf("\\{\\{\\s*%s:([A-Za-z0-9_.-]+)\\s*\\}\\}", type)
  matches <- regmatches(sql, gregexpr(pattern, sql, perl = TRUE))[[1]]
  if (!length(matches) || identical(matches, character(0))) {
    return(character())
  }
  sub(pattern, "\\1", matches, perl = TRUE)
}

.myio_extract_named_params <- function(sql) {
  matches <- regmatches(sql, gregexpr("\\?([A-Za-z][A-Za-z0-9_.-]*)", sql, perl = TRUE))[[1]]
  if (!length(matches) || identical(matches, character(0))) {
    return(character())
  }
  sub("^\\?", "", matches)
}

.myio_schema_names <- function(schema) {
  if (is.null(schema)) {
    return(character())
  }
  if (is.character(schema)) {
    return(unname(schema))
  }
  if (is.data.frame(schema) && "name" %in% names(schema)) {
    return(as.character(schema$name))
  }
  if (is.list(schema)) {
    return(unname(vapply(schema, function(field) {
      if (is.list(field) && !is.null(field$name)) {
        as.character(field$name[[1]])
      } else if (is.character(field) && length(field) >= 1L) {
        field[[1]]
      } else {
        NA_character_
      }
    }, character(1))))
  }
  character()
}

.myio_source_identifier <- function(source_ref, source_id) {
  candidate <- source_ref$table %||%
    source_ref$name %||%
    source_ref$source_ref$table %||%
    source_ref$source_ref$name %||%
    source_id
  if (!is.character(candidate) || length(candidate) != 1L || !nzchar(candidate)) {
    return(source_id)
  }
  candidate
}

.myio_template_sql <- function(template) {
  sql <- template$sql_template %||% template$sql
  if (!is.character(sql) || length(sql) != 1L || !nzchar(sql)) {
    return(NULL)
  }
  sql
}

.myio_template_slots <- function(template, sql) {
  ident_slots <- template$slots$ident_slots %||% character()
  value_slots <- template$slots$value_slots %||% character()

  ident_slots <- c(ident_slots, .myio_extract_typed_slots(sql, "identifier"))
  value_slots <- c(value_slots, .myio_extract_typed_slots(sql, "value"))
  named_params <- .myio_extract_named_params(sql)
  if (length(named_params)) {
    value_slots <- c(value_slots, named_params)
  }
  if (grepl("\\{\\{\\s*source\\s*\\}\\}", sql, perl = TRUE)) {
    ident_slots <- c("source", ident_slots)
  }

  list(
    ident_slots = unique(as.character(ident_slots)),
    value_slots = unique(as.character(value_slots))
  )
}

.myio_get_binding <- function(bindings, slot_name) {
  if (!is.list(bindings) || !(slot_name %in% names(bindings))) {
    return(list(found = FALSE, value = NULL))
  }
  list(found = TRUE, value = bindings[[slot_name]])
}

.myio_resolve_limit <- function(limit) {
  max_rows <- getOption("myIO.max_result_rows", 500000L)
  max_rows <- suppressWarnings(as.integer(max_rows[[1]]))
  if (is.na(max_rows) || max_rows < 1L) {
    max_rows <- 500000L
  }

  if (is.null(limit)) {
    return(max_rows)
  }
  limit <- suppressWarnings(as.integer(limit[[1]]))
  if (is.na(limit)) {
    limit <- max_rows
  }
  max(1L, min(limit, max_rows))
}

.myio_strip_trailing_semicolon <- function(sql) {
  sub(";\\s*$", "", sql)
}

#' Validate and compose a server-side query message
#'
#' @keywords internal
#' @noRd
validate_query_message <- function(message, source_registry, template_registry) {
  required_fields <- c("v", "queryId", "templateId", "sourceId",
                       "predicateHash", "bindings")

  if (!is.list(message) || is.null(names(message))) {
    return(.myio_query_error("forbidden", "Query message must be a named list."))
  }
  missing_fields <- setdiff(required_fields, names(message))
  if (length(missing_fields)) {
    return(.myio_query_error(
      "forbidden",
      paste0("Query message is missing required field: ", missing_fields[[1]])
    ))
  }

  if (!is.numeric(message$v) || length(message$v) != 1L ||
      is.na(message$v) || message$v != 1) {
    return(.myio_query_error(
      "forbidden",
      "Unsupported protocol version; expected v = 1."
    ))
  }

  template_id <- message$templateId
  if (!is.character(template_id) || length(template_id) != 1L ||
      !(template_id %in% names(template_registry))) {
    return(.myio_query_error(
      "forbidden",
      paste0("Unknown query template: ", toString(template_id))
    ))
  }

  source_id <- message$sourceId
  if (!is.character(source_id) || length(source_id) != 1L ||
      !(source_id %in% names(source_registry))) {
    return(.myio_query_error(
      "forbidden",
      paste0("Unknown query source: ", toString(source_id))
    ))
  }

  template <- template_registry[[template_id]]
  source_ref <- source_registry[[source_id]]
  sql <- .myio_template_sql(template)
  if (is.null(sql)) {
    return(.myio_query_error("syntax", "Query template is missing SQL text."))
  }

  slots <- .myio_template_slots(template, sql)
  schema_names <- .myio_schema_names(source_ref$schema)
  schema_names <- schema_names[!is.na(schema_names)]

  ident_values <- list()
  for (slot_name in slots$ident_slots) {
    if (identical(slot_name, "source")) {
      ident_values[[slot_name]] <- .myio_source_identifier(source_ref, source_id)
      next
    }

    binding <- .myio_get_binding(message$bindings, slot_name)
    ident_value <- binding$value
    if (!binding$found || !is.character(ident_value) ||
        length(ident_value) != 1L || !nzchar(ident_value) ||
        !(ident_value %in% schema_names)) {
      return(.myio_query_error(
        "forbidden",
        paste0("Identifier binding '", slot_name,
               "' is not a registered source column.")
      ))
    }
    ident_values[[slot_name]] <- ident_value
  }

  for (slot_name in names(ident_values)) {
    replacement <- .myio_quote_ident(ident_values[[slot_name]])
    sql <- gsub(
      sprintf("\\{\\{\\s*identifier:%s\\s*\\}\\}", .myio_regex_escape(slot_name)),
      replacement,
      sql,
      perl = TRUE
    )
    sql <- gsub(
      sprintf("\\{\\{\\s*%s\\s*\\}\\}", .myio_regex_escape(slot_name)),
      replacement,
      sql,
      perl = TRUE
    )
  }

  params <- list()
  value_occurrences <- .myio_extract_typed_slots(sql, "value")
  if (length(value_occurrences)) {
    for (slot_name in value_occurrences) {
      binding <- .myio_get_binding(message$bindings, slot_name)
      if (!binding$found) {
        return(.myio_query_error(
          "forbidden",
          paste0("Value binding '", slot_name, "' is missing.")
        ))
      }
      params[length(params) + 1L] <- list(binding$value)
    }
    sql <- gsub("\\{\\{\\s*value:[A-Za-z0-9_.-]+\\s*\\}\\}", "?", sql, perl = TRUE)
  } else {
    named_params <- .myio_extract_named_params(sql)
    if (length(named_params)) {
      for (slot_name in named_params) {
        binding <- .myio_get_binding(message$bindings, slot_name)
        if (!binding$found) {
          return(.myio_query_error(
            "forbidden",
            paste0("Value binding '", slot_name, "' is missing.")
          ))
        }
        params[length(params) + 1L] <- list(binding$value)
      }
      sql <- gsub("\\?[A-Za-z][A-Za-z0-9_.-]*", "?", sql, perl = TRUE)
    } else {
      for (slot_name in slots$value_slots) {
        binding <- .myio_get_binding(message$bindings, slot_name)
        if (!binding$found) {
          return(.myio_query_error(
            "forbidden",
            paste0("Value binding '", slot_name, "' is missing.")
          ))
        }
        params[length(params) + 1L] <- list(binding$value)
      }
    }
  }

  if (grepl("\\{\\{\\s*(identifier|value):|\\{\\{", sql, perl = TRUE)) {
    return(.myio_query_error("syntax", "Query template contains unresolved placeholders."))
  }

  resolved_limit <- .myio_resolve_limit(message$limit)
  sql <- paste(.myio_strip_trailing_semicolon(sql), "LIMIT", resolved_limit)

  list(
    status = "ok",
    sql = sql,
    params = params,
    source_ref = source_ref,
    source_id = source_id
  )
}

#' Default server-side query templates
#'
#' @keywords internal
#' @noRd
default_template_registry <- function() {
  list(
    count_filter = list(
      sql_template = paste(
        "SELECT count(*) AS n",
        "FROM {{source}}",
        "WHERE {{xcol}} BETWEEN ? AND ?"
      ),
      slots = list(
        ident_slots = c("source", "xcol"),
        value_slots = c("xmin", "xmax")
      )
    )
  )
}

.myio_send_error <- function(session, query_id, code, message) {
  session$sendCustomMessage("myio:error", list(
    v = 1L,
    type = "myio:error",
    queryId = query_id,
    code = code,
    message = message
  ))
}

.myio_init_query_state <- function(session, query_id) {
  query_key <- .myio_query_key(query_id)
  if (is.null(session$userData$myIO_cancel)) {
    session$userData$myIO_cancel <- list()
  }
  if (is.null(session$userData$myIO_ack_pending)) {
    session$userData$myIO_ack_pending <- list()
  }
  if (is.null(session$userData$myIO_cancel[[query_key]])) {
    session$userData$myIO_cancel[[query_key]] <- FALSE
  }
  if (is.null(session$userData$myIO_ack_pending[[query_key]])) {
    session$userData$myIO_ack_pending[[query_key]] <- 0L
  }
}

.myio_query_key <- function(query_id) {
  if (is.character(query_id) && length(query_id) == 1L && nzchar(query_id)) {
    query_id
  } else {
    "__missing_query_id__"
  }
}

.myio_pending_ack <- function(session, query_id) {
  query_key <- .myio_query_key(query_id)
  pending <- session$userData$myIO_ack_pending[[query_key]] %||% 0L
  pending <- suppressWarnings(as.integer(pending[[1]]))
  if (is.na(pending) || pending < 0L) {
    0L
  } else {
    pending
  }
}

.myio_set_pending_ack <- function(session, query_id, value) {
  query_key <- .myio_query_key(query_id)
  if (is.null(session$userData$myIO_ack_pending)) {
    session$userData$myIO_ack_pending <- list()
  }
  session$userData$myIO_ack_pending[[query_key]] <- max(0L, as.integer(value))
}

.myio_is_cancelled <- function(session, query_id) {
  query_key <- .myio_query_key(query_id)
  isTRUE(session$userData$myIO_cancel[[query_key]])
}

.myio_classify_dbi_error <- function(message) {
  if (grepl("timeout", message, ignore.case = TRUE)) {
    "timeout"
  } else if (grepl("memory|too large", message, ignore.case = TRUE)) {
    "oom"
  } else {
    "syntax"
  }
}

.myio_require_streaming_packages <- function() {
  for (pkg in c("DBI", "arrow", "base64enc")) {
    if (!requireNamespace(pkg, quietly = TRUE)) {
      stop("Package '", pkg, "' is required for Shiny result streaming.",
           call. = FALSE)
    }
  }
}

.myio_arrow_ipc_b64 <- function(batch) {
  if (!requireNamespace("arrow", quietly = TRUE)) {
    stop("Package 'arrow' is required for Shiny result streaming.",
         call. = FALSE)
  }
  if (!requireNamespace("base64enc", quietly = TRUE)) {
    stop("Package 'base64enc' is required for Shiny result streaming.",
         call. = FALSE)
  }

  table <- arrow::as_arrow_table(batch)
  raw_bytes <- if (exists("write_to_raw", envir = asNamespace("arrow"))) {
    arrow::write_to_raw(table, format = "stream")
  } else {
    sink <- arrow::BufferOutputStream$create()
    arrow::write_ipc_stream(table, sink)
    sink$finish()$as_vector()
  }
  base64enc::base64encode(raw_bytes)
}

.myio_resolve_connection <- function(validated, session) {
  source_ref <- validated$source_ref
  mode <- source_ref$mode %||% source_ref$source_ref$mode %||% source_ref$source_ref$kind

  if (identical(mode, "dbi")) {
    con <- source_ref$con %||% source_ref$source_ref$con
    if (is.null(con)) {
      stop("DBI source is missing a connection.", call. = FALSE)
    }
    return(con)
  }

  if (identical(mode, "inline_ipc")) {
    if (!requireNamespace("duckdb", quietly = TRUE)) {
      stop("Package 'duckdb' is required for inline Shiny query execution.",
           call. = FALSE)
    }
    if (!requireNamespace("DBI", quietly = TRUE)) {
      stop("Package 'DBI' is required for Shiny query execution.",
           call. = FALSE)
    }

    if (is.null(session$userData$myIO_duckdb_conn)) {
      session$userData$myIO_duckdb_conn <- DBI::dbConnect(duckdb::duckdb(), dbdir = ":memory:")
    }
    con <- session$userData$myIO_duckdb_conn
    table_name <- .myio_source_identifier(source_ref, validated$source_id)

    registered <- session$userData$myIO_duckdb_registered %||% list()
    if (!isTRUE(registered[[table_name]])) {
      arrow_table <- source_ref$arrow_table %||% source_ref$table_data %||%
        source_ref$data %||% source_ref$ref
      if (is.null(arrow_table)) {
        stop("Inline IPC source is missing an Arrow table or data frame.",
             call. = FALSE)
      }
      if (!requireNamespace("arrow", quietly = TRUE)) {
        stop("Package 'arrow' is required for inline Shiny query execution.",
             call. = FALSE)
      }
      duckdb::duckdb_register_arrow(con, table_name, arrow::as_arrow_table(arrow_table))
      registered[[table_name]] <- TRUE
      session$userData$myIO_duckdb_registered <- registered
    }
    return(con)
  }

  stop("Unsupported Shiny source mode: ", toString(mode), call. = FALSE)
}

.myio_apply_statement_timeout <- function(con) {
  timeout_ms <- getOption("myIO.query_timeout_ms", 10000L)
  timeout_ms <- suppressWarnings(as.integer(timeout_ms[[1]]))
  if (is.na(timeout_ms) || timeout_ms < 1L) {
    timeout_ms <- 10000L
  }
  DBI::dbExecute(con, paste("SET statement_timeout TO", timeout_ms))
}

.myio_wait_for_window <- function(session, query_id) {
  window <- getOption("myIO.shiny_batch_window", 4L)
  window <- suppressWarnings(as.integer(window[[1]]))
  if (is.na(window) || window < 1L) {
    window <- 4L
  }

  while (.myio_pending_ack(session, query_id) >= window &&
         !.myio_is_cancelled(session, query_id)) {
    if (requireNamespace("later", quietly = TRUE)) {
      later::run_now(0.05)
    }
    Sys.sleep(0.01)
  }
}

.myio_execute_streaming_now <- function(validated, query_id, session) {
  started <- proc.time()[["elapsed"]]
  row_count <- 0L
  seq <- 0L
  db_result <- NULL

  tryCatch({
    .myio_require_streaming_packages()
    .myio_init_query_state(session, query_id)

    con <- .myio_resolve_connection(validated, session)
    .myio_apply_statement_timeout(con)

    db_result <- DBI::dbSendQuery(con, validated$sql)
    DBI::dbBind(db_result, validated$params)

    repeat {
      if (.myio_is_cancelled(session, query_id)) {
        .myio_send_error(session, query_id, "cancelled", "Query was cancelled.")
        break
      }

      batch <- DBI::dbFetch(db_result, n = 10000L)
      if (!NROW(batch)) {
        elapsed_ms <- as.integer((proc.time()[["elapsed"]] - started) * 1000)
        session$sendCustomMessage("myio:end", list(
          v = 1L,
          type = "myio:end",
          queryId = query_id,
          rowCount = row_count,
          elapsedMs = elapsed_ms
        ))
        break
      }

      .myio_wait_for_window(session, query_id)
      if (.myio_is_cancelled(session, query_id)) {
        .myio_send_error(session, query_id, "cancelled", "Query was cancelled.")
        break
      }

      ipc <- .myio_arrow_ipc_b64(batch)
      session$sendCustomMessage("myio:batch", list(
        v = 1L,
        type = "myio:batch",
        queryId = query_id,
        seq = seq,
        ipc = ipc
      ))
      .myio_set_pending_ack(session, query_id, .myio_pending_ack(session, query_id) + 1L)

      row_count <- row_count + NROW(batch)
      seq <- seq + 1L
    }
  }, error = function(e) {
    msg <- conditionMessage(e)
    .myio_send_error(session, query_id, .myio_classify_dbi_error(msg), msg)
  }, finally = {
    if (!is.null(db_result) && requireNamespace("DBI", quietly = TRUE) &&
        DBI::dbIsValid(db_result)) {
      DBI::dbClearResult(db_result)
    }
  })

  invisible()
}

#' Execute and stream a validated query in Shiny
#'
#' @keywords internal
#' @noRd
execute_streaming <- function(validated, queryId, session) {
  if (!requireNamespace("later", quietly = TRUE)) {
    .myio_send_error(
      session,
      queryId,
      "syntax",
      "Package 'later' is required for Shiny query execution."
    )
    return(invisible())
  }

  later::later(function() {
    .myio_execute_streaming_now(validated, queryId, session)
  }, delay = 0)
  invisible()
}

#' Shiny query input handler
#'
#' @keywords internal
#' @noRd
shiny_query_handler <- function(value, session, name) {
  queryId <- value$queryId %||% ""
  res <- tryCatch(
    validate_query_message(
      message = value,
      source_registry = session$userData$myIO_sources %||% list(),
      template_registry = default_template_registry()
    ),
    error = function(e) {
      list(status = "error", code = "syntax", message = conditionMessage(e))
    }
  )

  if (!identical(res$status, "ok")) {
    .myio_send_error(session, queryId, res$code, res$message)
    return(value)
  }

  execute_streaming(res, queryId, session)
  value
}

#' Shiny cancel input handler
#'
#' @keywords internal
#' @noRd
shiny_cancel_handler <- function(value, session, name) {
  queryId <- value$queryId %||% ""
  query_key <- .myio_query_key(queryId)
  if (is.null(session$userData$myIO_cancel)) {
    session$userData$myIO_cancel <- list()
  }
  session$userData$myIO_cancel[[query_key]] <- TRUE
  value
}

#' Shiny acknowledgement input handler
#'
#' @keywords internal
#' @noRd
shiny_ack_handler <- function(value, session, name) {
  queryId <- value$queryId %||% ""
  pending <- .myio_pending_ack(session, queryId)
  .myio_set_pending_ack(session, queryId, pending - 1L)
  value
}

#' Register myIO Shiny custom input handlers
#'
#' @keywords internal
#' @noRd
register_shiny_handlers <- function() {
  if (!requireNamespace("shiny", quietly = TRUE)) {
    return(invisible())
  }

  shiny::registerInputHandler("myio.query", shiny_query_handler, force = TRUE)
  shiny::registerInputHandler("myio.cancel", shiny_cancel_handler, force = TRUE)
  shiny::registerInputHandler("myio.ack", shiny_ack_handler, force = TRUE)
  invisible()
}

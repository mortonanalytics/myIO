#' Register a big-data source for a Shiny session
#'
#' @keywords internal
#' @noRd
register_source <- function(session, sourceId, entry) {
  if (is.null(session$userData$myIO_sources)) {
    session$userData$myIO_sources <- list()
  }

  if (!isTRUE(session$userData$myIO_cleanup_registered)) {
    session$onSessionEnded(function() {
      sources <- session$userData$myIO_sources
      if (is.null(sources)) {
        return(invisible(NULL))
      }

      for (src in sources) {
        if (isTRUE(src$mode == "dbi") && !is.null(src$con)) {
          if (requireNamespace("DBI", quietly = TRUE)) {
            tryCatch(DBI::dbDisconnect(src$con), error = function(e) NULL)
          }
        }
      }

      session$userData$myIO_sources <- NULL
      invisible(NULL)
    })

    session$userData$myIO_cleanup_registered <- TRUE
  }

  session$userData$myIO_sources[[sourceId]] <- entry
  invisible(sourceId)
}

#' Resolve a big-data source for a Shiny session
#'
#' @keywords internal
#' @noRd
resolve_source <- function(session, sourceId) {
  sources <- session$userData$myIO_sources
  if (is.null(sources)) {
    return(NULL)
  }

  sources[[sourceId]]
}

#' Deregister all big-data sources owned by a chart
#'
#' @keywords internal
#' @noRd
deregister_chart <- function(session, chartId) {
  sources <- session$userData$myIO_sources
  if (is.null(sources)) {
    return(invisible(0L))
  }

  removed <- 0L
  keep <- rep(TRUE, length(sources))

  for (i in seq_along(sources)) {
    src <- sources[[i]]
    if (isTRUE(src$owner_chart_id == chartId)) {
      if (isTRUE(src$mode == "dbi") && !is.null(src$con)) {
        if (requireNamespace("DBI", quietly = TRUE)) {
          tryCatch(DBI::dbDisconnect(src$con), error = function(e) NULL)
        }
      }
      keep[[i]] <- FALSE
      removed <- removed + 1L
    }
  }

  session$userData$myIO_sources <- sources[keep]
  invisible(removed)
}

#' Register a rendered widget's server-engine source with its Shiny session
#'
#' Called by `renderMyIO()` on every render. For a widget whose big-data source
#' is queried by the server engine, writes the source into the session's
#' registry (the one `shiny_query_handler()` reads), drops the sources of the
#' chart this output rendered before, and keeps the DBI handle out of the
#' payload sent to the browser.
#'
#' @keywords internal
#' @noRd
.myio_register_widget_sources <- function(widget,
                                          session = shiny::getDefaultReactiveDomain()) {
  if (is.null(session) || !inherits(widget, "htmlwidget") ||
      !identical(attr(widget, "package"), "myIO")) {
    return(widget)
  }

  output_name <- tryCatch(shiny::getCurrentOutputInfo(session)$name,
                          error = function(e) NULL)
  if (is.character(output_name) && length(output_name) == 1L) {
    previous <- session$userData$myIO_output_charts[[output_name]]
    if (!is.null(previous)) {
      .myio_drop_chart_sources(session, previous)
    }
  }

  bigdata <- widget$x$bigdata
  widget$x$bigdata$dbi_handle_internal <- NULL
  if (!identical(widget$x$config$engine, "server") ||
      !(bigdata$mode %in% c("inline_ipc", "dbi"))) {
    return(widget)
  }

  chart_id <- widget$x$coordinator$chart_id
  entry <- list(
    mode = bigdata$mode,
    schema = bigdata$schema,
    row_count = bigdata$row_count,
    rowkey_col = bigdata$rowkey_col,
    owner_chart_id = chart_id
  )
  if (identical(bigdata$mode, "inline_ipc")) {
    entry$table <- bigdata$source_id
    entry$arrow_table <- arrow::read_ipc_stream(
      base64enc::base64decode(bigdata$ipc_b64),
      as_data_frame = FALSE
    )
  } else {
    handle <- bigdata$dbi_handle_internal
    entry$table <- handle$table
    # The app owns the connection (often shared across sessions), so it sits
    # under source_ref, out of reach of register_source()'s session-end
    # disconnect.
    entry$source_ref <- list(mode = "dbi", con = handle$conn)
  }
  register_source(session, bigdata$source_id, entry)

  if (is.character(output_name) && length(output_name) == 1L) {
    session$userData$myIO_output_charts[[output_name]] <- chart_id
  }
  widget
}

#' Drop the registry entries a chart owned, without closing connections
#'
#' @keywords internal
#' @noRd
.myio_drop_chart_sources <- function(session, chartId) {
  sources <- session$userData$myIO_sources
  if (is.null(sources)) {
    return(invisible(0L))
  }
  owned <- vapply(sources, function(src) isTRUE(src$owner_chart_id == chartId),
                  logical(1))
  registered <- session$userData$myIO_duckdb_registered %||% list()
  for (src in sources[owned]) {
    table_name <- src$table
    if (is.character(table_name) && isTRUE(registered[[table_name]])) {
      tryCatch(
        duckdb::duckdb_unregister(session$userData$myIO_duckdb_conn, table_name),
        error = function(e) NULL
      )
      registered[[table_name]] <- NULL
    }
  }
  session$userData$myIO_duckdb_registered <- registered
  session$userData$myIO_sources <- sources[!owned]
  invisible(sum(owned))
}

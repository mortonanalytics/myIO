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

    if (is.null(session$ended) && is.function(session$close)) {
      session$ended <- function() session$close()
    }

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

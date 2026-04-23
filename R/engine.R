#' Engine resolution and ID helpers for large-dataset virtualization
#'
#' Internal helpers consumed by `myIO()` (for `engine = "auto"` dispatch),
#' `setBigData()` (for source-id assignment), and `install_duckdb_wasm()`
#' (for cache-path resolution). See contract §Symbols and §Widget payload.
#'
#' @keywords internal
#' @noRd
resolve_engine <- function(engine = c("auto", "server", "wasm", "svg")) {
  engine <- match.arg(engine)

  if (engine %in% c("server", "wasm", "svg")) {
    return(engine)
  }

  opt <- getOption("myIO.engine", NA_character_)
  if (opt %in% c("server", "wasm", "svg")) {
    return(opt)
  }

  if (requireNamespace("shiny", quietly = TRUE) && shiny::isRunning()) {
    return("server")
  }

  "wasm"
}

#' @keywords internal
#' @noRd
new_source_id <- function() {
  paste0(format(as.hexmode(sample(0:255, 8, replace = TRUE)),
                width = 2), collapse = "")
}

#' @keywords internal
#' @noRd
new_chart_id <- function() {
  paste0(format(as.hexmode(sample(0:255, 8, replace = TRUE)),
                width = 2), collapse = "")
}

#' @keywords internal
#' @noRd
wasm_cache_url_for <- function(engine) {
  if (identical(engine, "wasm")) {
    # At widget print time the htmlDependency machinery resolves the absolute
    # URL. Here we return the *directory path* relative to the htmlwidgets
    # asset tree. Returns NULL if the cache is not populated.
    cache_dir <- tryCatch(
      tools::R_user_dir("myIO", "cache"),
      error = function(e) NULL
    )
    if (is.null(cache_dir)) return(NULL)
    wasm_root <- file.path(cache_dir, "duckdb-wasm")
    if (!dir.exists(wasm_root)) return(NULL)
    versions <- list.dirs(wasm_root, recursive = FALSE, full.names = FALSE)
    if (length(versions) == 0L) return(NULL)
    # Use lexicographically latest version directory (manifest install ensures
    # semver-compatible names; real resolution happens in install_duckdb_wasm).
    latest <- sort(versions, decreasing = TRUE)[1L]
    file.path(wasm_root, latest)
  } else {
    NULL
  }
}

#' @keywords internal
#' @noRd
wasm_worker_url_for <- function(engine) {
  root <- wasm_cache_url_for(engine)
  if (is.null(root)) return(NULL)
  file.path(root, "duckdb-browser-mvp.worker.js")
}

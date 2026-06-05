#' Install the DuckDB-WASM binary for large-dataset virtualization
#'
#' @description
#' Downloads and verifies the DuckDB-WASM runtime into a user-local cache
#' so the in-browser big-data engine is available for subsequent widgets.
#' This follows the keras3 / torch / reticulate pattern: the binary is
#' NOT bundled with the R package and is not required for small-data use.
#'
#' @param version Character scalar naming the version to install. Defaults
#'   to the latest row in `inst/duckdb-wasm-manifest.csv`.
#' @param from Optional local directory containing pre-downloaded binaries
#'   (`duckdb-mvp.wasm` and `duckdb-browser-mvp.worker.js`). Airgap path.
#' @param force Logical. If TRUE, overwrite existing cached binaries.
#' @param quiet Logical. Suppress progress output. Defaults to
#'   `!interactive()`.
#'
#' @return Invisibly returns the cache path where the binary was installed.
#' @examples
#' \dontrun{
#' # Downloads ~22 MB from the upstream mirror into the user cache.
#' install_duckdb_wasm()
#' }
#' @export
install_duckdb_wasm <- function(version = NULL, from = NULL,
                                force = FALSE, quiet = !interactive()) {
  manifest <- duckdb_wasm_manifest()
  if (is.null(version)) {
    # Latest lexicographically: semver-compatible naming makes this
    # chronological for the manifest versions we support.
    version <- as.character(manifest$version[
      order(manifest$version, decreasing = TRUE)
    ][1L])
  }
  row <- manifest[manifest$version == version, , drop = FALSE]
  if (nrow(row) != 1L) {
    stop("install_duckdb_wasm: unknown version '", version,
         "'. Known versions: ",
         paste(manifest$version, collapse = ", "),
         call. = FALSE)
  }

  target_dir <- file.path(duckdb_wasm_cache_dir(), version)
  wasm_path <- file.path(target_dir, "duckdb-mvp.wasm")
  worker_path <- file.path(target_dir, "duckdb-browser-mvp.worker.js")

  already_ok <- !force && file.exists(wasm_path) && file.exists(worker_path) &&
    tryCatch(
      verify_sha256(wasm_path, row$wasm_sha256) &&
        verify_sha256(worker_path, row$worker_sha256),
      error = function(e) FALSE
    )
  if (already_ok) {
    if (!quiet) {
      message("myIO: DuckDB-WASM ", version,
              " already installed at ", target_dir)
    }
    return(invisible(target_dir))
  }

  dir.create(target_dir, recursive = TRUE, showWarnings = FALSE)

  if (!is.null(from)) {
    if (!dir.exists(from)) {
      stop("install_duckdb_wasm: 'from' must be an existing directory; got '",
           from, "'.", call. = FALSE)
    }
    src_wasm <- file.path(from, "duckdb-mvp.wasm")
    src_worker <- file.path(from, "duckdb-browser-mvp.worker.js")
    if (!file.exists(src_wasm) || !file.exists(src_worker)) {
      stop("install_duckdb_wasm: 'from' must contain duckdb-mvp.wasm and ",
           "duckdb-browser-mvp.worker.js.", call. = FALSE)
    }
    file.copy(src_wasm, wasm_path, overwrite = TRUE)
    file.copy(src_worker, worker_path, overwrite = TRUE)
  } else {
    download_one(row$wasm_url, wasm_path, quiet = quiet)
    download_one(row$worker_url, worker_path, quiet = quiet)
  }

  verify_sha256(wasm_path, row$wasm_sha256)
  verify_sha256(worker_path, row$worker_sha256)

  if (!quiet) {
    message("myIO: installed DuckDB-WASM ", version, " to ", target_dir)
  }
  invisible(target_dir)
}

#' DuckDB-WASM cache status
#'
#' @return A list with class `myIO_duckdb_wasm_status` and fields
#'   `installed` (logical), `version` (chr or NA), `cache_dir` (chr),
#'   `size_bytes` (numeric).
#' @examples
#' duckdb_wasm_status()
#' @export
duckdb_wasm_status <- function() {
  cache_dir <- duckdb_wasm_cache_dir()
  versions <- if (dir.exists(cache_dir)) {
    list.dirs(cache_dir, recursive = FALSE, full.names = FALSE)
  } else {
    character(0)
  }
  installed <- length(versions) > 0L
  latest <- if (installed) sort(versions, decreasing = TRUE)[1L] else NA_character_
  size_bytes <- if (installed) {
    sum(file.info(list.files(cache_dir, recursive = TRUE, full.names = TRUE))$size,
        na.rm = TRUE)
  } else {
    0
  }
  structure(
    list(installed = installed, version = latest, cache_dir = cache_dir,
         size_bytes = size_bytes),
    class = "myIO_duckdb_wasm_status"
  )
}

#' @export
print.myIO_duckdb_wasm_status <- function(x, ...) {
  cat("myIO DuckDB-WASM status:\n")
  cat("  installed:  ", x$installed, "\n", sep = "")
  cat("  version:    ", if (is.na(x$version)) "(none)" else x$version, "\n", sep = "")
  cat("  cache_dir:  ", x$cache_dir, "\n", sep = "")
  cat("  size_bytes: ", format(x$size_bytes, big.mark = ","), "\n", sep = "")
  invisible(x)
}

#' Remove DuckDB-WASM cache entries
#'
#' @param version Character scalar naming a specific version to remove. If
#'   NULL, removes all cached versions.
#' @return Number of removed entries, invisibly.
#' @examples
#' \dontrun{
#' # Removes cached DuckDB-WASM binaries from the user cache.
#' clear_duckdb_wasm_cache()
#' }
#' @export
clear_duckdb_wasm_cache <- function(version = NULL) {
  cache_dir <- duckdb_wasm_cache_dir()
  if (!dir.exists(cache_dir)) return(invisible(0L))

  target <- if (is.null(version)) cache_dir else file.path(cache_dir, version)
  if (!dir.exists(target)) return(invisible(0L))

  removed <- if (is.null(version)) {
    length(list.dirs(cache_dir, recursive = FALSE, full.names = FALSE))
  } else {
    1L
  }
  unlink(target, recursive = TRUE, force = TRUE)
  invisible(removed)
}

#' Raise a DuckDB-WASM missing-runtime condition
#'
#' @return Does not return; always throws a condition of class
#'   \code{myIOError_duckdb_wasm_missing}.
#' @keywords internal
#' @export
stop_duckdb_wasm_missing <- function() {
  stop(structure(
    class = c("myIOError_duckdb_wasm_missing", "error", "condition"),
    list(
      message = paste(
        "myIO: DuckDB-WASM runtime is not installed.",
        "Run install_duckdb_wasm() to download it."
      ),
      call = sys.call(-1L)
    )
  ))
}

#' @keywords internal
#' @noRd
duckdb_wasm_cache_dir <- function() {
  file.path(tools::R_user_dir("myIO", "cache"), "duckdb-wasm")
}

#' @keywords internal
#' @noRd
duckdb_wasm_manifest <- function() {
  path <- system.file("duckdb-wasm-manifest.csv", package = "myIO")
  if (!nzchar(path) || !file.exists(path)) {
    path <- file.path(getwd(), "inst", "duckdb-wasm-manifest.csv")
  }
  if (!file.exists(path)) {
    stop("duckdb_wasm_manifest: manifest not found at '", path, "'.",
         call. = FALSE)
  }
  utils::read.csv(path, stringsAsFactors = FALSE)
}

#' @keywords internal
#' @noRd
verify_sha256 <- function(path, expected) {
  if (!requireNamespace("openssl", quietly = TRUE)) {
    stop("verify_sha256: package 'openssl' is required to verify DuckDB-WASM.",
         call. = FALSE)
  }

  con <- file(path, open = "rb")
  on.exit(close(con), add = TRUE)
  actual <- unname(as.character(openssl::sha256(con)))
  expected <- unname(as.character(expected))
  if (isTRUE(tolower(actual) == tolower(expected))) {
    return(TRUE)
  }

  stop(structure(
    class = c("myIOError_duckdb_wasm_checksum", "error", "condition"),
    list(
      message = sprintf(
        paste0(
          "myIO: DuckDB-WASM checksum mismatch at '%s'. ",
          "Expected '%s' but got '%s'. The download may be ",
          "corrupted; retry with install_duckdb_wasm(force = TRUE)."
        ),
        path, expected, actual
      ),
      call = sys.call(-1L)
    )
  ))
}

#' @keywords internal
#' @noRd
download_one <- function(url, path, quiet) {
  if (requireNamespace("curl", quietly = TRUE)) {
    curl::curl_download(url, path, quiet = quiet)
  } else {
    utils::download.file(url, path, mode = "wb", quiet = quiet)
  }
  invisible(path)
}

local({
  ns <- topenv(environment())
  if (isNamespace(ns)) {
    namespaceExport(
      ns,
      c(
        "install_duckdb_wasm",
        "duckdb_wasm_status",
        "clear_duckdb_wasm_cache",
        "stop_duckdb_wasm_missing",
        "print.myIO_duckdb_wasm_status"
      )
    )
    registerS3method(
      "print", "myIO_duckdb_wasm_status",
      print.myIO_duckdb_wasm_status,
      envir = ns
    )
  }
})

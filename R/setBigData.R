#' Attach a big-data source to a myIO widget
#'
#' `setBigData()` declares the data source that a myIO widget should use for
#' large-dataset rendering and linked-selection coordination.
#'
#' @param widget A myIO htmlwidget object.
#' @param source A supported big-data source: a `data.frame`, an Arrow table or
#'   record-batch reader, a single file path or URL ending in `.parquet`,
#'   `.arrow`, `.feather`, or `.csv`, or a `DBIConnection`.
#' @param rowkey_col Optional name of the column that uniquely identifies rows
#'   for Crosstalk-compatible linked selections.
#' @param ... Additional source-specific options. For DBI sources, pass
#'   `table = "name"` so myIO can query the table schema.
#'
#' @details
#' This function writes the `x.bigdata.*` payload fields described in
#' `md/design/large-dataset-virtualization-contract.md`, section "Widget
#' payload shape", and follows that document's row-key contract. DBI sources
#' are stored as an internal session-scoped marker in
#' `x.bigdata$dbi_handle_internal`; render-time source registration is handled
#' by the source registry phase.
#'
#' @return A modified myIO htmlwidget object.
#' @export
#'
#' @examples
#' \dontrun{
#' myIO(data = mtcars) |>
#'   setBigData(mtcars)
#'
#' myIO() |>
#'   setBigData("data/large.parquet", rowkey_col = "id")
#'
#' con <- DBI::dbConnect(duckdb::duckdb())
#' myIO() |>
#'   setBigData(con, table = "observations", rowkey_col = "id")
#' }
setBigData <- function(widget, source, rowkey_col = NULL, ...) {
  if (!inherits(widget, "htmlwidget") ||
      !identical(attr(widget, "package"), "myIO")) {
    stop("setBigData() expects a myIO widget object.", call. = FALSE)
  }

  payload <- .make_bigdata_payload(source, rowkey_col = rowkey_col, ...)

  if (is.null(widget$x)) widget$x <- list()
  if (is.null(widget$x$bigdata)) widget$x$bigdata <- list()
  if (is.null(widget$x$config)) widget$x$config <- list()

  widget$x$bigdata$mode <- payload$mode
  widget$x$bigdata$source_id <- payload$source_id
  widget$x$bigdata$ipc_b64 <- payload$ipc_b64
  widget$x$bigdata$url <- payload$url
  widget$x$bigdata$schema <- payload$schema
  widget$x$bigdata$row_count <- payload$row_count
  widget$x$bigdata$rowkey_col <- payload$rowkey_col

  if (identical(payload$mode, "dbi")) {
    widget$x$bigdata$dbi_handle_internal <- payload$dbi_handle
  }

  widget$x$config$coordinator_enabled <- TRUE
  if (is.null(widget$x$config$engine) ||
      identical(widget$x$config$engine, "auto")) {
    widget$x$config$engine <- resolve_engine("auto")
  }

  widget
}

#' Build a big-data payload without mutating a widget
#'
#' @keywords internal
#' @noRd
.make_bigdata_payload <- function(source, rowkey_col = NULL, ...) {
  dots <- list(...)
  rowkey_col <- .normalize_rowkey_col(rowkey_col)

  mode <- NULL
  ipc_b64 <- NULL
  url <- NULL
  schema <- NULL
  row_count <- NULL
  dbi_handle <- NULL

  if (is.data.frame(source)) {
    if (is.null(rowkey_col)) {
      rowkey_col <- "__myio_rowkey__"
      source[[rowkey_col]] <- as.character(seq_len(nrow(source)))
    }
    .validate_rowkey_in_names(rowkey_col, names(source))

    mode <- "inline_ipc"
    ipc_b64 <- arrow_ipc_encode(source)
    .check_inline_ipc_size(ipc_b64)
    schema <- arrow_ipc_schema(source)
    row_count <- nrow(source)
  } else if (.is_arrow_record_batch_reader(source)) {
    if (!requireNamespace("arrow", quietly = TRUE)) {
      stop(
        "Package 'arrow' is required for RecordBatchReader sources. ",
        "Install with install.packages('arrow'), or use ",
        "setBigData(source = <file path or URL>).",
        call. = FALSE
      )
    }
    if (is.null(rowkey_col)) rowkey_col <- "__myio_rowkey__"
    tbl <- arrow::as_arrow_table(source$read_table())
    .validate_rowkey_in_schema(rowkey_col, arrow_ipc_schema(tbl))

    mode <- "inline_ipc"
    ipc_b64 <- arrow_ipc_encode(tbl)
    .check_inline_ipc_size(ipc_b64)
    schema <- arrow_ipc_schema(tbl)
    row_count <- .arrow_num_rows(tbl)
  } else if (.is_arrow_tabular(source)) {
    if (is.null(rowkey_col)) rowkey_col <- "__myio_rowkey__"
    .validate_rowkey_in_schema(rowkey_col, arrow_ipc_schema(source))

    mode <- "inline_ipc"
    ipc_b64 <- arrow_ipc_encode(source)
    .check_inline_ipc_size(ipc_b64)
    schema <- arrow_ipc_schema(source)
    row_count <- .arrow_num_rows(source)
  } else if (.is_bigdata_url_source(source)) {
    if (is.null(rowkey_col)) rowkey_col <- "__myio_rowkey__"

    mode <- "url"
    url <- .normalize_bigdata_url(source)
  } else if (inherits(source, "DBIConnection")) {
    if (!requireNamespace("DBI", quietly = TRUE)) {
      stop(
        "Package 'DBI' is required for DBIConnection sources. ",
        "Install with install.packages('DBI').",
        call. = FALSE
      )
    }
    if (is.null(rowkey_col)) rowkey_col <- "__myio_rowkey__"

    table <- dots$table
    if (is.null(table) || !is.character(table) ||
        length(table) != 1L || is.na(table)) {
      .stop_myio_condition(
        "myIOError_engine_unsupported_source",
        "DBIConnection sources require table = \"...\" so myIO can query the schema."
      )
    }

    quoted_table <- DBI::dbQuoteIdentifier(source, table)
    result <- DBI::dbGetQuery(
      source,
      sprintf("SELECT * FROM %s LIMIT 0", as.character(quoted_table))
    )
    schema <- .schema_from_data_frame(result)
    .validate_rowkey_in_schema(rowkey_col, schema)

    mode <- "dbi"
    dbi_handle <- structure(
      list(conn = source, table = table, rowkey_col = rowkey_col),
      class = "myIO_dbi_handle"
    )
  } else {
    .stop_myio_condition(
      "myIOError_engine_unsupported_source",
      "setBigData() does not support source class: ",
      paste(class(source), collapse = "/"),
      "."
    )
  }

  payload <- list(
    mode = mode,
    source_id = new_source_id(),
    ipc_b64 = ipc_b64,
    url = url,
    dbi_handle = dbi_handle,
    schema = schema,
    row_count = row_count,
    rowkey_col = rowkey_col
  )

  if (!identical(mode, "dbi")) {
    payload$dbi_handle <- NULL
  }

  payload
}

.normalize_rowkey_col <- function(rowkey_col) {
  if (is.null(rowkey_col)) return(NULL)
  if (!is.character(rowkey_col) || length(rowkey_col) != 1L ||
      is.na(rowkey_col) || identical(rowkey_col, "")) {
    stop(
      "setBigData(): `rowkey_col` must be NULL or a single non-empty character string.",
      call. = FALSE
    )
  }
  rowkey_col
}

.is_arrow_tabular <- function(source) {
  inherits(source, c("ArrowTabular", "Table"))
}

.is_arrow_record_batch_reader <- function(source) {
  inherits(source, "RecordBatchReader")
}

.is_bigdata_url_source <- function(source) {
  is.character(source) &&
    length(source) == 1L &&
    !is.na(source) &&
    grepl("\\.(parquet|arrow|feather|csv)(\\?.*)?$", source, ignore.case = TRUE)
}

.normalize_bigdata_url <- function(source) {
  if (grepl("^[A-Za-z][A-Za-z0-9+.-]*://", source)) {
    source
  } else {
    normalizePath(source, winslash = "/", mustWork = FALSE)
  }
}

.check_inline_ipc_size <- function(ipc_b64) {
  bytes <- nchar(ipc_b64, type = "bytes")

  if (bytes > 200 * 1024^2) {
    .stop_myio_condition(
      "myIOError_bigdata_payload_size",
      sprintf(
        "myIO: inline IPC payload is %.1f MB, above the 200 MB limit; use setBigData(source = <file path>) for large datasets.",
        bytes / 1024^2
      )
    )
  }

  if (bytes > 50 * 1024^2) {
    warning(
      sprintf(
        "myIO: inline IPC payload is %.1f MB; consider setBigData(source = <file path>) for large datasets.",
        bytes / 1024^2
      ),
      call. = FALSE
    )
  }

  invisible(bytes)
}

.validate_rowkey_in_names <- function(rowkey_col, names) {
  if (!rowkey_col %in% names) {
    .stop_myio_condition(
      "myIOError_engine_unsupported_source",
      "setBigData(): `rowkey_col` '",
      rowkey_col,
      "' is not present in the source schema."
    )
  }
  invisible(TRUE)
}

.validate_rowkey_in_schema <- function(rowkey_col, schema) {
  .validate_rowkey_in_names(
    rowkey_col,
    vapply(schema, `[[`, character(1), "name")
  )
}

.schema_from_data_frame <- function(x) {
  lapply(names(x), function(name) {
    list(name = name, type = .guess_r_type(x[[name]]))
  })
}

.guess_r_type <- function(x) {
  if (inherits(x, "POSIXt")) return("timestamp")
  if (inherits(x, "Date")) return("date")
  if (is.integer(x)) return("int32")
  if (is.numeric(x)) return("double")
  if (is.logical(x)) return("bool")
  if (is.character(x)) return("utf8")
  if (is.factor(x)) return("dictionary<utf8>")
  class(x)[1]
}

.arrow_num_rows <- function(source) {
  rows <- source$num_rows
  if (is.function(rows)) rows <- rows()
  as.integer(rows)
}

.stop_myio_condition <- function(class, ...) {
  stop(
    structure(
      list(message = paste0(...), call = NULL),
      class = c(class, "error", "condition")
    )
  )
}

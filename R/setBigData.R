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
#'   `table = "name"` so myIO can query the table schema. For file path or URL
#'   sources, pass `schema = c("col1", "col2", ...)` or a schema field list.
#'
#' @details
#' This function writes the `x.bigdata.*` payload fields consumed by the
#' widget's large-dataset virtualization path and follows its row-key
#' contract. DBI sources are stored as an internal session-scoped marker in
#' `x.bigdata$dbi_handle_internal`; render-time source registration is handled
#' by the source registry phase.
#'
#' @return A modified myIO htmlwidget object.
#' @export
#'
#' @examples
#' \donttest{
#' myIO(data = mtcars) |>
#'   setBigData(mtcars)
#'
#' myIO() |>
#'   setBigData("data/large.parquet", schema = c("id", "x", "y"), rowkey_col = "id")
#'
#' if (requireNamespace("duckdb", quietly = TRUE)) {
#'   con <- DBI::dbConnect(duckdb::duckdb())
#'   obs <- data.frame(id = seq_len(nrow(mtcars)), mpg = mtcars$mpg)
#'   DBI::dbWriteTable(con, "observations", obs)
#'   myIO() |>
#'     setBigData(con, table = "observations", rowkey_col = "id")
#'   DBI::dbDisconnect(con, shutdown = TRUE)
#' }
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
  if (is.null(widget$x$coordinator)) widget$x$coordinator <- list()

  if (isTRUE(widget$x$config$facet$enabled)) {
    stop(
      "setBigData(): faceted big-data charts are not supported in the WebGL bridge v1.",
      call. = FALSE
    )
  }

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

  coordinator_payload <- .build_bigdata_coordinator_payload(
    widget$x$config$layers %||% list(),
    payload$source_id,
    payload$schema
  )
  widget$x$coordinator$mark_spec <- coordinator_payload$mark_spec
  widget$x$coordinator$query_template <- coordinator_payload$query_template

  widget$x$config$coordinator_enabled <- TRUE
  if (is.null(widget$x$config$engine) ||
      identical(widget$x$config$engine, "auto")) {
    widget$x$config$engine <- resolve_engine("auto")
  }

  widget
}

.build_bigdata_coordinator_payload <- function(layers, source_id, schema = NULL) {
  if (!is.list(layers)) layers <- list()

  eligible <- vapply(layers, function(layer) {
    is.list(layer) && layer$type %in% c("point", "line", "area")
  }, logical(1))

  if (length(layers) > 0L && any(eligible) && sum(eligible) > 1L) {
    stop(
      "setBigData(): WebGL big-data v1 supports one point, line, or area layer. ",
      "Multi-layer WebGL charts are not supported yet.",
      call. = FALSE
    )
  }

  if (!any(eligible)) {
    return(list(mark_spec = NULL, query_template = ""))
  }

  layer <- layers[[which(eligible)[[1L]]]]
  mark_spec <- .build_bigdata_mark_spec(layer)
  .validate_mark_spec_channels(mark_spec, schema)
  query_template <- .build_bigdata_query_template(mark_spec, source_id)
  list(mark_spec = mark_spec, query_template = query_template)
}

.build_bigdata_mark_spec <- function(layer) {
  mapping <- layer$mapping %||% list()
  kind <- switch(layer$type,
    point = "scatter",
    line = "line",
    area = "area"
  )

  channels <- switch(kind,
    scatter = list(
      x = mapping$x_var,
      y = mapping$y_var,
      color = mapping$color %||% mapping$group %||% NULL
    ),
    line = list(
      x = mapping$x_var,
      y = mapping$y_var
    ),
    area = list(
      x = mapping$x_var,
      y = mapping$high_y,
      baseline = mapping$low_y
    )
  )

  channels <- channels[!vapply(channels, is.null, logical(1))]
  list(
    kind = kind,
    channels = channels,
    decimation = switch(kind,
      scatter = "none",
      line = "lttb",
      area = "lttb"
    ),
    layer_id = layer$id %||% NULL,
    layer_label = layer$label %||% NULL
  )
}

.build_bigdata_query_template <- function(mark_spec, source_id) {
  channels <- mark_spec$channels %||% list()
  select_parts <- c(
    sprintf("%s AS x", .myio_quote_ident(channels$x)),
    sprintf("%s AS y", .myio_quote_ident(channels$y))
  )

  if (!is.null(channels$color)) {
    select_parts <- c(select_parts, sprintf("%s AS color", .myio_quote_ident(channels$color)))
  }
  if (!is.null(channels$baseline)) {
    select_parts <- c(select_parts, sprintf("%s AS baseline", .myio_quote_ident(channels$baseline)))
  }

  sprintf(
    "SELECT %s FROM %s WHERE {{where}} LIMIT {{limit}}",
    paste(select_parts, collapse = ", "),
    .myio_quote_ident(source_id)
  )
}

.validate_mark_spec_channels <- function(mark_spec, schema) {
  if (is.null(schema) || is.null(mark_spec)) return(invisible(TRUE))
  schema_names <- vapply(schema, `[[`, character(1), "name")
  channels <- unname(unlist(mark_spec$channels %||% list(), use.names = FALSE))
  missing <- setdiff(channels, schema_names)
  if (length(missing)) {
    stop(
      "setBigData(): mapped column(s) not present in source schema: ",
      paste(missing, collapse = ", "),
      call. = FALSE
    )
  }
  invisible(TRUE)
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
    mode <- "url"
    url <- .normalize_bigdata_url(source)
    schema <- .normalize_bigdata_schema_arg(dots$schema)
    if (!is.null(rowkey_col)) {
      .validate_rowkey_in_schema(rowkey_col, schema)
    }
    if (!is.null(dots$row_count)) {
      row_count <- .normalize_bigdata_row_count(dots$row_count)
    }
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

.normalize_bigdata_schema_arg <- function(schema) {
  if (is.null(schema)) {
    stop(
      "setBigData(): file path and URL sources require an explicit `schema =` ",
      "argument in WebGL bridge v1.",
      call. = FALSE
    )
  }

  if (is.character(schema)) {
    schema <- schema[!is.na(schema) & nzchar(schema)]
    if (!length(schema)) {
      stop("setBigData(): `schema` must contain at least one column name.", call. = FALSE)
    }
    return(lapply(unname(schema), function(name) list(name = name, type = "unknown")))
  }

  if (is.data.frame(schema)) {
    if (!("name" %in% names(schema))) {
      stop("setBigData(): `schema` data frames must include a `name` column.", call. = FALSE)
    }
    return(lapply(seq_len(nrow(schema)), function(i) {
      list(
        name = as.character(schema$name[[i]]),
        type = if ("type" %in% names(schema)) as.character(schema$type[[i]]) else "unknown"
      )
    }))
  }

  if (is.list(schema)) {
    fields <- lapply(schema, function(field) {
      if (is.character(field) && length(field) == 1L) {
        return(list(name = unname(field), type = "unknown"))
      }
      if (is.list(field) && !is.null(field$name)) {
        return(list(
          name = as.character(field$name),
          type = as.character(field$type %||% "unknown")
        ))
      }
      NULL
    })
    if (any(vapply(fields, is.null, logical(1)))) {
      stop(
        "setBigData(): `schema` list entries must be column names or ",
        "fields with `name` and optional `type`.",
        call. = FALSE
      )
    }
    return(fields)
  }

  stop(
    "setBigData(): `schema` must be a character vector, data frame, or field list.",
    call. = FALSE
  )
}

.normalize_bigdata_row_count <- function(row_count) {
  if (!is.numeric(row_count) || length(row_count) != 1L ||
      is.na(row_count) || row_count < 0) {
    stop("setBigData(): `row_count` must be a single non-negative number.", call. = FALSE)
  }
  as.integer(row_count)
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
  parts <- vapply(list(...), function(x) paste0(x, collapse = ""), character(1))
  stop(
    structure(
      list(message = paste0(parts, collapse = ""), call = NULL),
      class = c(class, "error", "condition")
    )
  )
}

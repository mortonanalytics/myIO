#' Arrow IPC encoding helpers for big-data payload handoff
#'
#' Internal helpers used by `setBigData()` when `mode == "inline_ipc"` to
#' embed a dataset in the htmlwidget JSON. Both functions require the
#' optional `arrow` Suggest and raise a clear install pointer if missing.
#'
#' See contract §Widget payload shape (x.bigdata.ipc_b64, x.bigdata.schema).
#'
#' @keywords internal
#' @noRd

arrow_ipc_encode <- function(df_or_table) {
  if (!requireNamespace("arrow", quietly = TRUE)) {
    stop(
      "Package 'arrow' is required for inline Arrow IPC handoff. ",
      "Install with install.packages('arrow'), or use ",
      "setBigData(source = <file path or URL>) to avoid the in-memory path.",
      call. = FALSE
    )
  }
  if (!requireNamespace("base64enc", quietly = TRUE)) {
    stop(
      "Package 'base64enc' is required for inline Arrow IPC handoff. ",
      "Install with install.packages('base64enc').",
      call. = FALSE
    )
  }

  tbl <- if (inherits(df_or_table, c("ArrowTabular", "Table", "RecordBatch"))) {
    df_or_table
  } else if (is.data.frame(df_or_table)) {
    arrow::as_arrow_table(df_or_table)
  } else if (inherits(df_or_table, "RecordBatchReader")) {
    # RecordBatchReader is consumed eagerly in v1 (design open-Q closed).
    arrow::as_arrow_table(df_or_table$read_table())
  } else {
    stop(
      "arrow_ipc_encode() expected a data.frame, arrow Table, or ",
      "RecordBatchReader; got ", toString(class(df_or_table)),
      call. = FALSE
    )
  }

  # Serialize stream-format IPC into an in-memory raw vector, then base64-encode.
  raw_bytes <- arrow::write_to_raw(tbl, format = "stream")
  base64enc::base64encode(raw_bytes)
}

arrow_ipc_schema <- function(df_or_table) {
  if (!requireNamespace("arrow", quietly = TRUE)) {
    stop("Package 'arrow' is required. ",
         "install.packages('arrow')", call. = FALSE)
  }

  tbl <- if (inherits(df_or_table, c("ArrowTabular", "Table", "RecordBatch"))) {
    df_or_table
  } else if (is.data.frame(df_or_table)) {
    arrow::as_arrow_table(df_or_table)
  } else if (inherits(df_or_table, "RecordBatchReader")) {
    arrow::as_arrow_table(df_or_table$read_table())
  } else {
    stop("arrow_ipc_schema() got unsupported input: ",
         toString(class(df_or_table)), call. = FALSE)
  }

  fields <- tbl$schema$fields
  lapply(fields, function(f) {
    list(name = f$name, type = f$type$ToString())
  })
}

#' LTTB downsampling transform
#'
#' Largest-Triangle-Three-Buckets downsampling for line layers.
#' Reduces a large series to at most \code{threshold} points (default 2000)
#' while preserving the visual shape, so the chart ships O(threshold) rows
#' instead of O(rows). Opt-in via \code{addIoLayer(transform = "lttb")}; the
#' default \code{identity} transform leaves data untouched.
#'
#' This runs on the standard (in-memory / SVG) data path and is independent of
#' the DuckDB-WASM big-data engine's own SQL-side LTTB, so it never double-
#' downsamples: a layer either uses this R transform or routes through the
#' coordinator, not both.
#'
#' @param data a data frame sorted by the x mapping (the line/area contract).
#' @param mapping layer mapping; uses \code{x_var} and \code{y_var}.
#' @param options list; \code{threshold} = max points to keep (integer >= 2,
#'   default 2000).
#' @return list(data = downsampled rows, meta).
#' @noRd
transform_lttb <- function(data, mapping, options = list()) {
  threshold <- options$threshold
  if (is.null(threshold)) {
    threshold <- 2000L
  }
  if (!is.numeric(threshold) || length(threshold) != 1L || is.na(threshold) ||
      threshold < 2) {
    stop("addIoLayer(): `options$threshold` for transform 'lttb' must be a ",
         "single number >= 2.", call. = FALSE)
  }
  threshold <- as.integer(floor(threshold))

  x <- data[[mapping$x_var]]
  y <- data[[mapping$y_var]]
  keep <- lttb_select(as.numeric(x), as.numeric(y), threshold)

  list(
    data = data[keep, , drop = FALSE],
    meta = new_transform_meta(
      "lttb",
      list(derivedFrom = "input_rows")
    )
  )
}

#' Indices selected by the LTTB algorithm.
#'
#' Returns the row indices (sorted, first and last always included) of the
#' at-most-\code{threshold} representative points. Falls back to all rows when
#' the series is already at or below the threshold, or too short to bucket.
#' @noRd
lttb_select <- function(x, y, threshold) {
  n <- length(x)
  if (n == 0L) {
    return(integer(0))
  }
  if (threshold >= n || threshold < 3L) {
    return(seq_len(n))
  }

  sampled <- integer(threshold)
  sampled[1L] <- 1L          # always keep the first point
  out_i <- 2L
  a <- 1L                    # index of the previously selected point
  bucket_size <- (n - 2) / (threshold - 2)

  for (i in seq_len(threshold - 2L)) {
    # Average point of the *next* bucket.
    avg_start <- as.integer(floor(i * bucket_size)) + 2L
    avg_end <- as.integer(floor((i + 1) * bucket_size)) + 2L
    avg_end <- min(avg_end, n)
    avg_range <- avg_start:avg_end
    avg_x <- mean(x[avg_range])
    avg_y <- mean(y[avg_range])

    # Candidate points in the *current* bucket.
    range_start <- as.integer(floor((i - 1) * bucket_size)) + 2L
    range_end <- as.integer(floor(i * bucket_size)) + 2L
    range_end <- min(range_end, n)
    idxs <- range_start:range_end

    ax <- x[a]
    ay <- y[a]
    # Triangle area (x2) spanned by point a, each candidate, and the next
    # bucket's average; pick the candidate with the largest area.
    areas <- abs((ax - avg_x) * (y[idxs] - ay) - (ax - x[idxs]) * (avg_y - ay))
    chosen <- idxs[which.max(areas)]
    sampled[out_i] <- chosen
    out_i <- out_i + 1L
    a <- chosen
  }

  sampled[threshold] <- n    # always keep the last point
  sampled
}

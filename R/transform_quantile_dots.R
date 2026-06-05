#' Quantile dots transform
#'
#' @noRd
transform_quantile_dots <- function(data, mapping, options = list()) {
  valid_sources <- c("bootstrap", "posterior", "ensemble", "empirical")
  source <- options$source
  if (is.null(source) || length(source) != 1L || is.na(source) || !(source %in% valid_sources)) {
    stop(
      "transform_quantile_dots(): `source` is required; one of ",
      paste(sprintf("'%s'", valid_sources), collapse = ", "),
      ".",
      call. = FALSE
    )
  }

  n <- if (is.null(options$n)) 20L else options$n
  if (!is.numeric(n) || length(n) != 1L || is.na(n) || n < 1L) {
    stop("transform_quantile_dots(): `n` must be a positive integer.", call. = FALSE)
  }
  n <- as.integer(n)
  if (n > 50L) {
    warning("quantile_dots: n > 50 degrades legibility; consider n <= 50.", call. = FALSE)
  }

  threshold <- options$threshold
  if (!is.null(threshold) && (!is.numeric(threshold) || length(threshold) != 1L || is.na(threshold))) {
    stop("transform_quantile_dots(): `threshold` must be a single numeric value.", call. = FALSE)
  }

  x_col <- mapping$x_var
  y_col <- mapping$y_var
  x_values <- data[[x_col]]
  y_values <- data[[y_col]]
  groups <- unique(x_values)
  probs <- (seq_len(n) - 0.5) / n

  rows <- lapply(groups, function(group_value) {
    group_index <- which(x_values == group_value)
    group_y <- y_values[group_index]
    group_y <- group_y[!is.na(group_y)]
    q <- if (length(group_y) == 0L) {
      rep(NA_real_, n)
    } else {
      stats::quantile(group_y, probs = probs, type = 7, names = FALSE, na.rm = TRUE)
    }

    out <- data.frame(
      value = as.numeric(q),
      quantile_rank = seq_len(n),
      threshold_relationship = NA_character_,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
    out[[x_col]] <- group_value
    out <- out[, c(x_col, "value", "quantile_rank", "threshold_relationship"), drop = FALSE]

    if (!is.null(threshold)) {
      out$threshold_relationship <- ifelse(out$value < threshold, "below", "above")
    }
    out[["_source_key"]] <- paste0("quantile_dot_", make.names(as.character(group_value)), "_", seq_len(n))
    out
  })

  transformed <- do.call(rbind, rows)
  rownames(transformed) <- NULL

  source_keys <- lapply(groups, function(group_value) {
    group_index <- which(x_values == group_value)
    if ("_source_key" %in% names(data)) {
      as.character(data[["_source_key"]][group_index])
    } else {
      as.character(group_index)
    }
  })

  list(
    data = transformed,
    meta = new_transform_meta(
      "quantile_dots",
      list(
        source = source,
        n = n,
        threshold = threshold,
        sourceKeys = source_keys,
        derivedFrom = "input_rows"
      )
    )
  )
}

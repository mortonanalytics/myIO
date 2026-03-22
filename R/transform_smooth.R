#' Moving average / exponential smoothing transform
#'
#' @keywords internal
transform_smooth <- function(data, mapping, options = list()) {
  method <- if (is.null(options$method)) "sma" else options$method
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]

  ord <- order(x_vals)
  x_sorted <- x_vals[ord]
  y_sorted <- y_vals[ord]
  keys_sorted <- as.character(data[["_source_key"]][ord])

  if (method == "sma") {
    window <- if (is.null(options$window)) 7L else options$window
    if (window > length(y_sorted)) {
      warning("transform_smooth window (", window, ") exceeds data length (",
              length(y_sorted), "); clamping.", call. = FALSE)
      window <- length(y_sorted)
    }
    smoothed <- stats::filter(y_sorted, rep(1 / window, window), sides = 2)
    keep <- !is.na(smoothed)
    transformed <- data.frame(
      x = x_sorted[keep], y = as.numeric(smoothed[keep]),
      `_source_key` = keys_sorted[keep],
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else if (method == "ema") {
    alpha <- if (is.null(options$alpha)) 0.3 else options$alpha
    ema <- numeric(length(y_sorted))
    ema[1] <- y_sorted[1]
    for (i in seq(2, length(y_sorted))) {
      ema[i] <- alpha * y_sorted[i] + (1 - alpha) * ema[i - 1]
    }
    transformed <- data.frame(
      x = x_sorted, y = ema,
      `_source_key` = keys_sorted,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else {
    stop("Unknown smooth method '", method, "'. Must be 'sma' or 'ema'.",
         call. = FALSE)
  }

  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("smooth", list(
      sourceKeys = as.list(transformed[["_source_key"]]),
      derivedFrom = "input_rows"
    ))
  )
}

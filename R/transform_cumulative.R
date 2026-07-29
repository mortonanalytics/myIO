#' Cumulative transform
#'
#' @noRd
transform_cumulative <- function(data, mapping, options = list()) {
  as_truthy <- function(x) {
    if (is.logical(x)) {
      out <- x
    } else if (is.numeric(x)) {
      out <- !is.na(x) & x != 0
    } else {
      normalized <- tolower(trimws(as.character(x)))
      out <- normalized %in% c("true", "t", "1", "yes", "y")
    }
    out[is.na(out)] <- FALSE
    out
  }

  y_values <- data[[mapping$y_var]]
  y_values[is.na(y_values)] <- 0

  cumulative_y <- cumsum(y_values)
  base_y <- if (length(cumulative_y) == 0L) {
    numeric(0)
  } else if (length(cumulative_y) == 1L) {
    0
  } else {
    c(0, cumulative_y[-length(cumulative_y)])
  }
  is_total <- rep(FALSE, nrow(data))

  if (!is.null(mapping$total)) {
    total_values <- data[[mapping$total]]
    is_total <- as_truthy(total_values)

    if (any(is_total)) {
      final_total <- if (length(cumulative_y) == 0L) 0 else cumulative_y[length(cumulative_y)]
      cumulative_y[is_total] <- final_total
      base_y[is_total] <- 0
    }
  }

  # A total row carries no delta of its own -- its bar spans 0 to the running
  # total, and an NA there is the documented way to say so. The NA has to stay
  # NA on input: cumsum above counts the row, and it only lands on the right
  # answer because y_values zeroed it. Materialise the magnitude the renderer
  # actually draws so the payload ships a number rather than a JSON null, which
  # the browser-side layer validator flags and the waterfall tooltip prints raw.
  resolved_y <- y_values
  if (any(is_total)) {
    resolved_y[is_total] <- cumulative_y[is_total] - base_y[is_total]
  }

  transformed <- data
  transformed[[mapping$y_var]] <- resolved_y
  transformed[["_base_y"]] <- base_y
  transformed[["_cumulative_y"]] <- cumulative_y
  transformed[["_is_total"]] <- is_total

  list(
    data = transformed,
    meta = new_transform_meta(
      "cumulative",
      list(
        derivedFrom = "input_rows"
      )
    )
  )
}

#' Cumulative transform
#'
#' @keywords internal
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
  base_y <- c(0, head(cumulative_y, -1L))
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

  transformed <- data
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

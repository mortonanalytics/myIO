#' Outliers transform
#'
#' @keywords internal
transform_outliers <- function(data, mapping, options = list()) {
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  outlier_flags <- rep(FALSE, nrow(data))

  for (group_value in groups) {
    group_index <- which(x_values == group_value)
    group_y <- y_values[group_index]
    group_y <- group_y[!is.na(group_y)]

    if (length(group_y) == 0L) {
      next
    }

    q <- stats::quantile(group_y, probs = c(0.25, 0.75), names = FALSE, type = 7, na.rm = TRUE)
    iqr <- q[[2]] - q[[1]]
    lower_fence <- q[[1]] - 1.5 * iqr
    upper_fence <- q[[2]] + 1.5 * iqr

    outlier_flags[group_index] <- y_values[group_index] < lower_fence | y_values[group_index] > upper_fence
  }

  transformed <- data[outlier_flags, , drop = FALSE]
  source_keys <- as.list(as.character(transformed[["_source_key"]]))

  list(
    data = transformed,
    meta = new_transform_meta(
      "outliers",
      list(
        sourceKeys = source_keys,
        derivedFrom = "input_rows"
      )
    )
  )
}

#' Quantiles transform
#'
#' @keywords internal
transform_quantiles <- function(data, mapping, options = list()) {
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(group_value) {
    if (is.factor(x_values)) {
      group_index <- which(x_values == group_value)
    } else if (is.character(x_values)) {
      group_index <- which(x_values == group_value)
    } else {
      group_index <- which(x_values == group_value)
    }

    group_y <- y_values[group_index]
    group_y <- group_y[!is.na(group_y)]

    if (length(group_y) == 0L) {
      summary <- c(q1 = NA_real_, median = NA_real_, q3 = NA_real_, whisker_low = NA_real_, whisker_high = NA_real_)
    } else {
      q <- stats::quantile(group_y, probs = c(0.25, 0.5, 0.75), names = FALSE, type = 7, na.rm = TRUE)
      iqr <- q[[3]] - q[[1]]
      lower_fence <- q[[1]] - 1.5 * iqr
      upper_fence <- q[[3]] + 1.5 * iqr
      summary <- c(
        q1 = q[[1]],
        median = q[[2]],
        q3 = q[[3]],
        whisker_low = max(min(group_y), lower_fence),
        whisker_high = min(max(group_y), upper_fence)
      )
    }

    data.frame(
      x = group_value,
      q1 = summary[["q1"]],
      median = summary[["median"]],
      q3 = summary[["q3"]],
      whisker_low = summary[["whisker_low"]],
      whisker_high = summary[["whisker_high"]],
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1] <- mapping$x_var

  source_keys <- lapply(groups, function(group_value) {
    if (is.factor(x_values) || is.character(x_values) || is.numeric(x_values)) {
      group_index <- which(x_values == group_value)
    } else {
      group_index <- which(x_values == group_value)
    }
    as.character(data[["_source_key"]][group_index])
  })

  list(
    data = transformed,
    meta = new_transform_meta(
      "quantiles",
      list(
        sourceKeys = source_keys,
        derivedFrom = "input_rows"
      )
    )
  )
}

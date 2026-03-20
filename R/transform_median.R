#' Median transform
#'
#' @keywords internal
transform_median <- function(data, mapping, options = list()) {
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(group_value) {
    group_index <- which(x_values == group_value)
    group_y <- y_values[group_index]
    group_y <- group_y[!is.na(group_y)]
    group_median <- if (length(group_y) == 0L) NA_real_ else stats::median(group_y, na.rm = TRUE)

    data.frame(
      x = group_value,
      y = group_median,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed) <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(group_value) {
    group_index <- which(x_values == group_value)
    as.character(data[["_source_key"]][group_index])
  })

  list(
    data = transformed,
    meta = new_transform_meta(
      "median",
      list(
        sourceKeys = source_keys,
        derivedFrom = "input_rows"
      )
    )
  )
}

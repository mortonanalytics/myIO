#' Mean transform
#'
#' @keywords internal
transform_mean <- function(data, mapping, options = list()) {
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(group_value) {
    group_y <- y_values[x_values == group_value]
    group_y <- group_y[!is.na(group_y)]
    data.frame(
      x = group_value,
      y = if (length(group_y) == 0L) NA_real_ else mean(group_y),
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("mean", list(
      sourceKeys = source_keys,
      derivedFrom = "input_rows"
    ))
  )
}

#' Linear model transform
#'
#' @keywords internal
transform_lm <- function(data, mapping, options = list()) {
  model <- stats::lm(data[[mapping$y_var]] ~ data[[mapping$x_var]])
  transformed <- data.frame(
    x = data[[mapping$x_var]],
    y = model$fitted.values,
    `_source_key` = as.character(data[["_source_key"]]),
    stringsAsFactors = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)
  transformed <- transformed[order(transformed[[mapping$x_var]]), , drop = FALSE]

  list(
    data = transformed,
    meta = new_transform_meta(
      "lm",
      list(
        sourceKeys = as.list(transformed[["_source_key"]]),
        derivedFrom = "input_rows"
      )
    )
  )
}

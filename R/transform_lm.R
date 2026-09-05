#' Linear model transform
#'
#' @noRd
transform_lm <- function(data, mapping, options = list()) {
  complete <- is.finite(data[[mapping$x_var]]) & is.finite(data[[mapping$y_var]])
  data <- data[complete, , drop = FALSE]
  if (nrow(data) < 2L) {
    warning("transform_lm requires at least 2 data points; returning empty.", call. = FALSE)
    empty <- data.frame(x = numeric(0), y = numeric(0),
                        `_source_key` = character(0), check.names = FALSE)
    colnames(empty)[1:2] <- c(mapping$x_var, mapping$y_var)
    return(list(data = empty, meta = new_transform_meta("lm", list(
      sourceKeys = list(), derivedFrom = "input_rows"
    ))))
  }
  model <- stats::lm(data[[mapping$y_var]] ~ data[[mapping$x_var]])
  transformed <- data.frame(
    x = data[[mapping$x_var]],
    y = model$fitted.values,
    `_source_key` = as.character(data[["_source_key"]]),
    stringsAsFactors = FALSE, check.names = FALSE
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

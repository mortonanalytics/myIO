#' Regression residuals transform
#'
#' @keywords internal
transform_residuals <- function(data, mapping, options = list()) {
  method <- if (is.null(options$method)) "lm" else options$method
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  model <- switch(method,
    lm = stats::lm(y_clean ~ x_clean),
    loess = stats::loess(y_clean ~ x_clean,
      span = if (is.null(options$span)) 0.75 else options$span),
    polynomial = stats::lm(y_clean ~ stats::poly(x_clean,
      degree = if (is.null(options$degree)) 2L else options$degree, raw = TRUE)),
    stop("Unknown residuals method '", method, "'.", call. = FALSE)
  )

  resid_vals <- stats::residuals(model)
  fitted_vals <- stats::fitted(model)

  transformed <- data.frame(
    x = fitted_vals, y = resid_vals,
    `_source_key` = as.character(data[["_source_key"]][complete]),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("residuals", list(
      sourceKeys = as.list(transformed[["_source_key"]]),
      derivedFrom = "input_rows"
    ))
  )
}

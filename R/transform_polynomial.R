#' Polynomial regression transform
#'
#' @keywords internal
transform_polynomial <- function(data, mapping, options = list()) {
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  degree <- if (is.null(options$degree)) 2L else options$degree
  n_grid <- if (is.null(options$n_grid)) 100L else options$n_grid

  if (length(x_clean) <= degree) {
    warning("transform_polynomial requires more data points than degree; returning empty.",
            call. = FALSE)
    empty <- data.frame(
      x = numeric(0), y = numeric(0), `_source_key` = character(0),
      stringsAsFactors = FALSE, check.names = FALSE
    )
    colnames(empty)[1:2] <- c(mapping$x_var, mapping$y_var)
    return(list(
      data = empty,
      meta = new_transform_meta("polynomial", list(
        sourceKeys = list(), derivedFrom = "input_rows"
      ))
    ))
  }

  model <- stats::lm(y_clean ~ stats::poly(x_clean, degree = degree, raw = TRUE))
  grid_x <- seq(min(x_clean), max(x_clean), length.out = n_grid)
  fitted_y <- stats::predict(model, newdata = data.frame(x_clean = grid_x))

  transformed <- data.frame(
    x = grid_x, y = fitted_y,
    `_source_key` = sprintf("grid_%d", seq_len(n_grid)),
    stringsAsFactors = FALSE, check.names = FALSE
  )
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  list(
    data = transformed,
    meta = new_transform_meta("polynomial", list(
      sourceKeys = as.list(as.character(data[["_source_key"]][complete])),
      derivedFrom = "input_rows"
    ))
  )
}

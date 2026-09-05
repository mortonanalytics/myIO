#' Confidence / prediction interval transform
#'
#' @noRd
transform_ci <- function(data, mapping, options = list()) {
  method <- if (is.null(options$method)) "lm" else options$method
  level <- if (is.null(options$level)) 0.95 else options$level
  interval <- if (is.null(options$interval)) "confidence" else options$interval
  method <- match.arg(method, c("lm", "loess", "polynomial"))
  interval <- match.arg(interval, c("confidence", "prediction"))
  degree <- if (is.null(options$degree)) 2L else options$degree
  n_grid <- if (is.null(options$n_grid)) 100L else options$n_grid
  x_vals <- data[[mapping$x_var]]
  y_vals <- data[[mapping$y_var]]
  complete <- !is.na(x_vals) & !is.na(y_vals)
  x_clean <- x_vals[complete]
  y_clean <- y_vals[complete]

  min_points <- if (method == "polynomial") max(3L, degree + 2L) else 3L
  if (length(x_clean) < min_points) {
    warning("transform_ci requires at least ", min_points,
            " data points; returning empty.", call. = FALSE)
    empty <- data.frame(
      x = numeric(0), low_y = numeric(0), high_y = numeric(0),
      stringsAsFactors = FALSE, check.names = FALSE
    )
    colnames(empty)[1] <- mapping$x_var
    return(list(
      data = empty,
      meta = new_transform_meta("ci", list(
        sourceKeys = list(), derivedFrom = "input_rows"
      ))
    ))
  }

  grid_x <- seq(min(x_clean), max(x_clean), length.out = n_grid)

  if (method %in% c("lm", "polynomial")) {
    model <- if (method == "polynomial") {
      stats::lm(y_clean ~ stats::poly(x_clean, degree = degree, raw = TRUE))
    } else {
      stats::lm(y_clean ~ x_clean)
    }
    preds <- stats::predict(model,
      newdata = data.frame(x_clean = grid_x),
      interval = interval, level = level)
    transformed <- data.frame(
      x = grid_x, low_y = preds[, "lwr"], high_y = preds[, "upr"],
      stringsAsFactors = FALSE, check.names = FALSE
    )
  } else if (method == "loess") {
    span <- if (is.null(options$span)) 0.75 else options$span
    model <- stats::loess(y_clean ~ x_clean, span = span, degree = degree)
    preds <- stats::predict(model,
      newdata = data.frame(x_clean = grid_x), se = TRUE)
    alpha <- 1 - level
    t_crit <- stats::qt(1 - alpha / 2, df = preds$df)
    se <- if (interval == "prediction") {
      sqrt(preds$se.fit^2 + preds$residual.scale^2)
    } else {
      preds$se.fit
    }
    transformed <- data.frame(
      x = grid_x,
      low_y = preds$fit - t_crit * se,
      high_y = preds$fit + t_crit * se,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  colnames(transformed)[1] <- mapping$x_var

  list(
    data = transformed,
    meta = new_transform_meta("ci", list(
      sourceKeys = as.list(as.character(data[["_source_key"]][complete])),
      derivedFrom = "input_rows"
    ))
  )
}

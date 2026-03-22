#' Q-Q diagnostic transform
#'
#' @keywords internal
transform_qq <- function(data, mapping, options = list()) {
  distribution <- if (is.null(options$distribution)) "norm" else options$distribution
  qfunc        <- options$qfunc
  show_envelope <- if (is.null(options$envelope)) TRUE else options$envelope
  conf_level   <- if (is.null(options$conf_level)) 0.95 else options$conf_level

  y_values <- data[[mapping$y_var]]
  y_values <- y_values[!is.na(y_values)]
  n <- length(y_values)

  empty_points <- data.frame(theoretical = numeric(0), sample = numeric(0),
                             stringsAsFactors = FALSE, check.names = FALSE)
  empty_envelope <- data.frame(theoretical = numeric(0), low_y = numeric(0),
                               high_y = numeric(0), stringsAsFactors = FALSE,
                               check.names = FALSE)

  if (n < 3L) {
    warning("transform_qq requires at least 3 non-NA observations.", call. = FALSE)
    return(list(
      points = empty_points, line = empty_points, envelope = empty_envelope,
      meta = new_transform_meta("qq", list(derivedFrom = "input_rows"))
    ))
  }

  # Compute quantiles
  sample_sorted <- sort(y_values)
  p <- stats::ppoints(n)

  if (!is.null(qfunc)) {
    theoretical <- qfunc(p)
  } else {
    qf <- match.fun(paste0("q", distribution))
    theoretical <- qf(p)
  }

  # Reference line through Q1 and Q3
  probs <- c(0.25, 0.75)
  qy <- stats::quantile(sample_sorted, probs, names = FALSE)
  qx <- stats::quantile(theoretical, probs, names = FALSE)
  slope <- diff(qy) / diff(qx)
  intercept <- qy[1] - slope * qx[1]

  # Points
  points_df <- data.frame(
    theoretical = theoretical, sample = sample_sorted,
    stringsAsFactors = FALSE, check.names = FALSE
  )

  # Reference line (full range)
  line_range <- range(theoretical)
  line_df <- data.frame(
    theoretical = line_range,
    sample = intercept + slope * line_range,
    stringsAsFactors = FALSE, check.names = FALSE
  )

  # Confidence envelope
  envelope_df <- NULL
  if (show_envelope) {
    z <- stats::qnorm(1 - (1 - conf_level) / 2)
    se <- (1 / stats::dnorm(theoretical)) * sqrt(p * (1 - p) / n)
    envelope_df <- data.frame(
      theoretical = theoretical,
      low_y = intercept + slope * (theoretical - z * se),
      high_y = intercept + slope * (theoretical + z * se),
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  list(
    points = points_df,
    line = line_df,
    envelope = envelope_df,
    meta = new_transform_meta("qq", list(
      sourceKeys = NULL,
      derivedFrom = "input_rows"
    ))
  )
}

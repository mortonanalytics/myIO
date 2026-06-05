#' Distribution fitting transform
#'
#' Fits a parametric distribution to univariate data via MLE using base R.
#' Returns a grid of x values and scaled density values suitable for overlaying
#' on a histogram.
#'
#' @noRd
transform_fit_distribution <- function(data, mapping, options = list()) {
  family <- if (is.null(options$family)) "normal" else options$family
  n_grid <- if (is.null(options$n_grid)) 100L else as.integer(options$n_grid)
  bins <- if (is.null(options$bins)) 30L else as.integer(options$bins)

  values <- data[[mapping$value]]
  values <- values[!is.na(values)]
  n <- length(values)

  if (n < 2L) {
    warning("transform_fit_distribution requires at least 2 data points; returning empty.",
            call. = FALSE)
    empty <- data.frame(x_var = numeric(0), y_var = numeric(0),
                        stringsAsFactors = FALSE, check.names = FALSE)
    return(list(
      data = empty,
      params = list(),
      meta = new_transform_meta("fit_distribution", list(
        sourceKeys = list(), derivedFrom = "input_rows"
      ))
    ))
  }

  if (family == "normal") {
    mu <- mean(values)
    sigma <- stats::sd(values)
    params <- list(mean = mu, sd = sigma)
    dfun <- function(x) stats::dnorm(x, mean = mu, sd = sigma)
  } else if (family == "lognormal") {
    if (any(values <= 0)) {
      stop("transform_fit_distribution(): lognormal family requires all positive values.",
           call. = FALSE)
    }
    mu_log <- mean(log(values))
    sigma_log <- stats::sd(log(values))
    params <- list(meanlog = mu_log, sdlog = sigma_log)
    dfun <- function(x) stats::dlnorm(x, meanlog = mu_log, sdlog = sigma_log)
  } else if (family == "exponential") {
    if (any(values <= 0)) {
      stop("transform_fit_distribution(): exponential family requires all positive values.",
           call. = FALSE)
    }
    rate <- 1 / mean(values)
    params <- list(rate = rate)
    dfun <- function(x) stats::dexp(x, rate = rate)
  } else {
    stop("transform_fit_distribution(): Unknown family '", family,
         "'. Must be 'normal', 'lognormal', or 'exponential'.", call. = FALSE)
  }

  # Build histogram breaks to compute bin width for scaling
  h <- graphics::hist(values, breaks = bins, plot = FALSE)
  bin_width <- h$breaks[2] - h$breaks[1]

  x_grid <- seq(min(values), max(values), length.out = n_grid)
  y_density <- dfun(x_grid)
  # Scale density to count space: count = density * n * bin_width
  y_scaled <- y_density * n * bin_width

  transformed <- data.frame(
    x_var = x_grid,
    y_var = y_scaled,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  list(
    data = transformed,
    params = params,
    meta = new_transform_meta("fit_distribution", list(
      sourceKeys = as.list(as.character(data[["_source_key"]])),
      derivedFrom = "input_rows"
    ))
  )
}

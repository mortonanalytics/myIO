#' Transform registry
#'
#' @keywords internal
transform_registry <- function() {
  list(
    identity = transform_identity,
    lm = transform_lm,
    cumulative = transform_cumulative,
    quantiles = transform_quantiles,
    median = transform_median,
    outliers = transform_outliers,
    density = transform_density,
    mean = transform_mean,
    summary = transform_summary,
    loess = transform_loess,
    polynomial = transform_polynomial,
    smooth = transform_smooth,
    residuals = transform_residuals,
    ci = transform_ci,
    mean_ci = transform_mean_ci
  )
}

#' @keywords internal
get_transform <- function(name) {
  registry <- transform_registry()
  transform <- registry[[name]]
  if (is.null(transform)) {
    stop("Unknown transform '", name, "'.", call. = FALSE)
  }
  transform
}

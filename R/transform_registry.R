#' Transform registry
#'
#' @keywords internal
transform_registry <- function() {
  list(
    identity = transform_identity,
    lm = transform_lm,
    cumulative = transform_cumulative,
    quantiles = transform_quantiles
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

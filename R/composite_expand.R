#' Composite expansion helpers
#'
#' @keywords internal
is_composite <- function(type) {
  type %in% names(composite_registry())
}

#' @keywords internal
expandComposite <- function(type, data, mapping, label, color, options) {
  registry <- composite_registry()
  composite_fn <- registry[[type]]

  if (is.null(composite_fn) || !is.function(composite_fn)) {
    stop("Unknown composite type '", type, "'.", call. = FALSE)
  }

  composite_fn(data, mapping, label, color, options)
}

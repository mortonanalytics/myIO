#' Identity transform
#'
#' @noRd
transform_identity <- function(data, mapping, options = list()) {
  list(
    data = data,
    meta = new_transform_meta("identity")
  )
}

#' Enable Linked Brushing via Crosstalk
#'
#' Connects the chart to a Crosstalk SharedData object so that brush
#' selections propagate to other linked widgets.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param shared_data a \code{crosstalk::SharedData} object
#' @param mode \code{"source"}, \code{"target"}, or \code{"both"} (default)
#' @param filter if \code{TRUE}, Crosstalk filter operations hide
#'   non-matching points. Default \code{FALSE} (dim only).
#'
#' @return A modified \code{myIO} htmlwidget with Crosstalk linking.
#' @examples
#' if (interactive() && requireNamespace("crosstalk", quietly = TRUE)) {
#'   shared <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))
#'   myIO() |>
#'     addIoLayer(
#'       type = "point", label = "scatter",
#'       data = shared$data(), mapping = list(x_var = "wt", y_var = "mpg")
#'     ) |>
#'     setLinked(shared)
#' }
#'
#' @export
setLinked <- function(myIO, shared_data, mode = "both", filter = FALSE) {
  assert_myIO(myIO)
  if (!requireNamespace("crosstalk", quietly = TRUE)) {
    stop("Package 'crosstalk' is required for linked brushing. ",
         "Install it with: install.packages('crosstalk')", call. = FALSE)
  }

  stopifnot(inherits(shared_data, "SharedData"))
  mode <- match.arg(mode, c("source", "target", "both"))

  key <- shared_data$key()
  group <- shared_data$groupName()

  myIO$x$config$interactions$linked <- list(
    enabled = TRUE,
    group = group,
    key = as.list(key),
    mode = mode,
    filter = filter
  )

  myIO$dependencies <- c(myIO$dependencies, crosstalk::crosstalkLibs())
  myIO
}

#' Set the Legend Title
#'
#' Adds a title to the chart legend naming the variable its entries come from.
#' The title renders on whichever legend surface is active -- the compact
#' in-plot legend or the panel opened from the chart's legend button -- and on
#' exported SVG, PNG and PDF output.
#'
#' @param myIO an htmlwidget object created by the \code{myIO()} function
#' @param title a single character string used as the legend title, or
#'   \code{TRUE} to derive it from the name of the grouping column supplied as
#'   \code{addIoLayer(mapping = list(group = ...))}. \code{NULL} or
#'   \code{FALSE} clears the title, which is the default for every chart.
#'
#' @details The title is omitted when \code{suppressLegend()} is set. The
#'   derived form (\code{title = TRUE}) is omitted unless the legend has at
#'   least two entries and every entry comes from the same grouping column, so
#'   a chart that mixes grouped series with a standalone fitted line stays
#'   untitled unless a literal string is supplied.
#'
#' @return A modified \code{myIO} htmlwidget object carrying the legend title.
#'
#' @examples
#' df <- data.frame(x = rep(1:5, 2), y = runif(10),
#'                  Month = rep(c("May", "June"), each = 5))
#'
#' myIO() |>
#'   addIoLayer(type = "line", label = "Temp", data = df,
#'              mapping = list(x_var = "x", y_var = "y", group = "Month")) |>
#'   setLegendTitle("Month")
#'
#' # Derive the title from the grouping column name
#' myIO() |>
#'   addIoLayer(type = "line", label = "Temp", data = df,
#'              mapping = list(x_var = "x", y_var = "y", group = "Month")) |>
#'   setLegendTitle(TRUE)
#'
#' @export
setLegendTitle <- function(myIO, title = NULL) {
  assert_myIO(myIO)

  if (is.null(title) || isFALSE(title)) {
    myIO$x$config$layout$legendTitle <- NULL
    return(myIO)
  }

  if (isTRUE(title)) {
    myIO$x$config$layout$legendTitle <- TRUE
    return(myIO)
  }

  if (!is.character(title) || length(title) != 1L || is.na(title)) {
    stop("setLegendTitle(): `title` must be a single character string, TRUE, or NULL.",
         call. = FALSE)
  }

  myIO$x$config$layout$legendTitle <- title
  myIO
}

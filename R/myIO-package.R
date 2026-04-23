#' myIO: Interactive Data Visualizations Using d3.js
#'
#' @keywords internal
"_PACKAGE"

.onLoad <- function(libname, pkgname) {
  # Register Shiny custom input handlers for the large-dataset virtualization
  # feature. This is a no-op in environments without shiny installed, which is
  # the common case for static-HTML rendering (Quarto, R Markdown).
  if (requireNamespace("shiny", quietly = TRUE) &&
      exists("register_shiny_handlers", mode = "function",
             envir = asNamespace("myIO"), inherits = FALSE)) {
    register_shiny_handlers()
  }
  invisible()
}

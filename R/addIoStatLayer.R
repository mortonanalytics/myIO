#' addIOStatLayer()
#'
#' Adds individual statistics layer to a myIO widget
#'
#' @importFrom stats lm
#' @export
addIoStatLayer <- function(myIO,
                     type,
                     color,
                     label,
                     data = NULL,
                     mapping ) {
  allowed_stats <- c("lm")

  if (!is.character(type) || length(type) != 1 || is.na(type) || !(type %in% allowed_stats)) {
    stop("Unknown stat type '", paste(type, collapse = ", "), "'. Must be one of: ",
         paste(allowed_stats, collapse = ", "), ".", call. = FALSE)
  }

  if (is.null(data)) {
    data <- myIO$x$data
  }
  myIO$x$data <- NULL

  if (type == "lm") {
    model <- lm(data[[mapping$y_var]] ~ data[[mapping$x_var]])
    data <- data.frame(x_var = data[[mapping$x_var]], y_var = model$fitted.values)
    colnames(data) <- c(mapping$x_var, mapping$y_var)
    data <- data[order(data[, 1]), ]
    type <- "stat_line"
  }

  data <- lapply(seq_len(nrow(data)), function(i) {
    lapply(data[i, , drop = FALSE], function(col) col[[1]])
  })
  layer <- list(type = type, color = color, label = label, data = data, mapping = mapping)
  myIO$x$config$layers <- c(myIO$x$config$layers, list(layer))
  myIO
}

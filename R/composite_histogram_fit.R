#' Histogram + fitted distribution composite expansion
#'
#' Expands into a histogram layer plus a fitted density line.
#' Optionally includes a text annotation with distribution parameters.
#'
#' @noRd
composite_histogram_fit <- function(data, mapping, label, color, options) {
  family <- if (is.null(options$family)) "normal" else options$family
  show_params <- if (is.null(options$showParams)) FALSE else isTRUE(options$showParams)
  bins <- if (is.null(options$bins)) 30L else as.integer(options$bins)
  base_color <- if (is.null(color)) OKABE_ITO_PALETTE[[1]] else if (length(color) > 0) color[[1]] else OKABE_ITO_PALETTE[[1]]
  line_color <- if (is.null(options$lineColor)) "#D55E00" else options$lineColor

  fit_result <- transform_fit_distribution(data, mapping, options)

  # Pre-bin the histogram in R so JS doesn't need to re-bin
  val_col <- mapping$value
  vals <- data[[val_col]]
  vals <- vals[!is.na(vals)]
  h <- graphics::hist(vals, breaks = bins, plot = FALSE)
  hist_data <- data.frame(
    x_var = h$mids,
    y_var = h$counts,
    x0 = h$breaks[-length(h$breaks)],
    x1 = h$breaks[-1],
    stringsAsFactors = FALSE
  )
  hist_data[["_source_key"]] <- sprintf("bin_%d", seq_len(nrow(hist_data)))

  layers <- list(
    list(
      type = "bar",
      data = hist_data,
      mapping = list(x_var = "x_var", y_var = "y_var"),
      transform = "identity",
      label = paste0(label, " - histogram"),
      color = base_color,
      role = "histogram",
      scaleHints = list(
        xScaleType = "linear", yScaleType = "linear",
        xExtentFields = list("x_var"), yExtentFields = list("y_var"),
        domainMerge = "union"
      )
    ),
    list(
      type = "line",
      data = fit_result$data,
      mapping = list(x_var = "x_var", y_var = "y_var"),
      transform = "identity",
      label = paste0(label, " - fit"),
      color = line_color,
      role = "density_line",
      scaleHints = list(
        xScaleType = "linear", yScaleType = "linear",
        xExtentFields = list("x_var"), yExtentFields = list("y_var"),
        domainMerge = "union"
      )
    )
  )

  if (show_params && length(fit_result$params) > 0) {
    param_strings <- vapply(names(fit_result$params), function(p) {
      paste0(p, " = ", round(fit_result$params[[p]], 4))
    }, character(1))
    param_text <- paste(param_strings, collapse = ", ")
    annotation_label <- paste0(family, ": ", param_text)

    x_range <- range(fit_result$data$x_var)
    y_range <- range(fit_result$data$y_var)

    text_data <- data.frame(
      x_var = x_range[1] + 0.05 * diff(x_range),
      y_var = y_range[2] * 0.95,
      label = annotation_label,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
    text_data[["_source_key"]] <- "params_text"

    layers[[length(layers) + 1L]] <- list(
      type = "text",
      data = text_data,
      mapping = list(x_var = "x_var", y_var = "y_var"),
      transform = "identity",
      label = paste0(label, " - params"),
      color = "#333333",
      role = "params_text"
    )
  }

  layers
}

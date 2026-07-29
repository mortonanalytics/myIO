#' Q-Q plot composite expansion
#'
#' @noRd
composite_qq <- function(data, mapping, label, color, options) {
  show_envelope <- if (is.null(options$envelope)) TRUE else options$envelope
  has_group <- !is.null(mapping$group) && mapping$group %in% colnames(data)

  if (has_group) {
    group_vals <- unique(data[[mapping$group]])
    colors <- if (is.null(color)) rep_len(OKABE_ITO_PALETTE, length(group_vals))
              else rep_len(color, length(group_vals))
    sublayers <- list()
    for (idx in seq_along(group_vals)) {
      group_data <- data[data[[mapping$group]] == group_vals[idx], , drop = FALSE]
      group_label <- as.character(group_vals[idx])
      sublayers <- c(sublayers,
        build_qq_sublayers(group_data, mapping, group_label, colors[idx], options, show_envelope))
    }
    return(sublayers)
  }

  base_color <- if (is.null(color)) "#0072B2" else if (length(color) > 0) color[[1]] else "#0072B2"
  build_qq_sublayers(data, mapping, label, base_color, options, show_envelope)
}

#' @noRd
build_qq_sublayers <- function(data, mapping, label, color, options, show_envelope) {
  qq_result <- transform_qq(data, mapping, options)
  sublayers <- list()

  # 1. CI envelope (lowest z-order)
  if (show_envelope && !is.null(qq_result$envelope) && nrow(qq_result$envelope) > 0) {
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "area",
      role = "envelope",
      label = paste0(label, " - envelope"),
      data = qq_result$envelope,
      mapping = list(x_var = "theoretical", low_y = "low_y", high_y = "high_y"),
      transform = "identity",
      color = color,
      options = list()
    )
  }

  # 2. Reference line
  if (nrow(qq_result$line) > 0) {
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "line",
      role = "reference",
      label = paste0(label, " - reference"),
      data = qq_result$line,
      mapping = list(x_var = "theoretical", y_var = "sample"),
      transform = "identity",
      color = color,
      options = list()
    )
  }

  # 3. Q-Q points (highest z-order)
  if (nrow(qq_result$points) > 0) {
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "point",
      role = "scatter",
      label = paste0(label, " - points"),
      data = qq_result$points,
      mapping = list(x_var = "theoretical", y_var = "sample"),
      transform = "identity",
      color = color,
      options = list()
    )
  }

  sublayers
}

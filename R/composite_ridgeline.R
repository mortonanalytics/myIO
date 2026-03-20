#' Ridgeline composite expansion
#'
#' @keywords internal
composite_ridgeline <- function(data, mapping, label, color, options) {
  overlap <- if (is.null(options$overlap)) 0.6 else as.numeric(options$overlap)
  bandwidth <- options$bandwidth
  group_values <- unique(data[[mapping$group]])
  group_labels <- as.character(group_values)
  group_colors <- if (is.null(color)) rep_len(OKABE_ITO_PALETTE, length(group_labels)) else rep_len(color, length(group_labels))

  density_layers <- vector("list", length(group_values))
  max_density <- 0

  for (i in seq_along(group_values)) {
    group_value <- group_values[[i]]
    group_label <- group_labels[[i]]
    group_data <- data[data[[mapping$group]] == group_value, , drop = FALSE]
    if (nrow(group_data) == 0L) {
      next
    }

    # Ridgeline densities are driven from the horizontal numeric field.
    density_data <- transform_density(
      group_data,
      list(y_var = mapping$x_var),
      list(mirror = TRUE, bandwidth = bandwidth)
    )$data

    if (nrow(density_data) == 0L) {
      next
    }

    density_data[["group"]] <- group_label
    density_layers[[i]] <- density_data
    max_density <- max(max_density, max(density_data$high_y, na.rm = TRUE))
  }

  if (max_density <= 0 || all(vapply(density_layers, is.null, logical(1)))) {
    return(list())
  }

  offset_step <- (1 - overlap) * max_density
  layers <- list()

  for (i in seq_along(density_layers)) {
    density_data <- density_layers[[i]]
    if (is.null(density_data) || nrow(density_data) == 0L) {
      next
    }

    offset <- (i - 1L) * offset_step
    if (offset != 0) {
      density_data$low_y <- density_data$low_y + offset
      density_data$high_y <- density_data$high_y + offset
    }

    layers[[length(layers) + 1L]] <- list(
      type = "area",
      data = density_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " — ", group_labels[[i]], " — density"),
      color = group_colors[[i]],
      role = "density_area"
    )
  }

  layers
}

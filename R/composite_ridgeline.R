#' Ridgeline composite expansion
#'
#' @noRd
composite_ridgeline <- function(data, mapping, label, color, options) {
  overlap <- if (is.null(options$overlap)) 0.4 else as.numeric(options$overlap)
  bandwidth <- options$bandwidth
  # Ridges stack upward from baseline 1, so the first group renders at the
  # bottom. Order groups the way ggplot orders a discrete axis: a factor's
  # level order is the user's explicit statement of intent and wins; anything
  # else sorts ascending. Character sorting is forced into the C locale so the
  # result does not vary with the machine's collation.
  group_values <- unique(data[[mapping$group]])
  group_values <- if (is.factor(group_values)) {
    group_values[order(as.integer(group_values), na.last = TRUE)]
  } else if (is.character(group_values)) {
    group_values[order(group_values, na.last = TRUE, method = "radix")]
  } else {
    group_values[order(group_values, na.last = TRUE)]
  }
  group_labels <- as.character(group_values)
  n_groups <- length(group_labels)
  group_colors <- if (is.null(color)) rep_len(OKABE_ITO_PALETTE, n_groups) else rep_len(color, n_groups)

  # Compute densities per group (non-mirrored)
  density_layers <- vector("list", n_groups)
  max_density <- 0

  for (i in seq_along(group_values)) {
    group_value <- group_values[[i]]
    group_data <- data[data[[mapping$group]] == group_value, , drop = FALSE]
    if (nrow(group_data) == 0L) next

    density_data <- transform_density(
      group_data,
      list(y_var = mapping$x_var),
      list(mirror = FALSE, bandwidth = bandwidth)
    )$data

    if (nrow(density_data) == 0L) next

    density_data[["group"]] <- group_labels[[i]]
    density_layers[[i]] <- density_data
    max_density <- max(max_density, max(density_data$high_y, na.rm = TRUE))
  }

  if (max_density <= 0 || all(vapply(density_layers, is.null, logical(1)))) {
    return(list())
  }

  # Each group gets a y-position (1, 2, 3, ...). The density curve is scaled
  # so that its peak is (overlap * 1) high — the overlap factor controls how
  # much each ridge overlaps the one above it. Baselines sit at the group
  # position, peaks extend upward toward the next group.
  ridge_height <- 1 + overlap
  scale_factor <- ridge_height / max_density

  layers <- list()

  for (i in seq_along(density_layers)) {
    density_data <- density_layers[[i]]
    if (is.null(density_data) || nrow(density_data) == 0L) next

    baseline <- i
    density_data$density <- density_data$high_y
    density_data$low_y <- baseline
    density_data$high_y <- baseline + density_data$density * scale_factor

    layers[[length(layers) + 1L]] <- list(
      type = "area",
      data = density_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - ", group_labels[[i]], " - density"),
      color = group_colors[[i]],
      role = "density_area"
    )
  }

  layers
}

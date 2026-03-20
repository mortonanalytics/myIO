#' Violin composite expansion
#'
#' @keywords internal
composite_violin <- function(data, mapping, label, color, options) {
  show_box <- !isFALSE(options$showBox)
  show_median <- !isFALSE(options$showMedian)
  show_points <- isTRUE(options$showPoints)
  bandwidth <- options$bandwidth
  box_half_width <- if (is.null(options$boxWidth)) 0.35 else as.numeric(options$boxWidth) / 2
  group_values <- unique(data[[mapping$x_var]])
  group_labels <- as.character(group_values)
  positions <- seq_along(group_labels)
  position_lookup <- stats::setNames(positions, group_labels)
  group_colors <- if (is.null(color)) rep_len(OKABE_ITO_PALETTE, length(group_labels)) else rep_len(color, length(group_labels))

  # Compute density for each group and find global max for scaling
  density_list <- vector("list", length(group_values))
  max_density <- 0
  for (i in seq_along(group_values)) {
    group_value <- group_values[[i]]
    group_data <- data[data[[mapping$x_var]] == group_value, , drop = FALSE]
    dens <- transform_density(group_data, mapping, list(mirror = FALSE, bandwidth = bandwidth))$data
    if (nrow(dens) > 0) {
      max_density <- max(max_density, max(dens$high_y, na.rm = TRUE))
    }
    density_list[[i]] <- dens
  }

  # Scale density so the maximum width fills the box half-width
  scale_factor <- if (max_density > 0) box_half_width / max_density else 1

  layers <- list()

  for (i in seq_along(group_values)) {
    group_label <- group_labels[[i]]
    dens <- density_list[[i]]
    if (is.null(dens) || nrow(dens) == 0) next

    pos <- positions[[i]]
    violin_data <- data.frame(
      x_var = rep(pos, nrow(dens)),
      y_var = dens$x_var,
      low_x = pos - dens$high_y * scale_factor,
      high_x = pos + dens$high_y * scale_factor,
      density = dens$high_y,
      group = rep(group_label, nrow(dens)),
      stringsAsFactors = FALSE,
      check.names = FALSE
    )

    layers[[length(layers) + 1L]] <- list(
      type = "area",
      data = violin_data,
      mapping = list(x_var = "x_var", y_var = "y_var", low_x = "low_x", high_x = "high_x", group = "group"),
      transform = "identity",
      label = paste0(label, " - ", group_label, " - density"),
      color = group_colors[[i]],
      role = "density_area",
      options = list(orientation = "vertical"),
      scaleHints = list(
        xScaleType = "linear",
        yScaleType = "linear",
        xExtentFields = list("low_x", "high_x"),
        yExtentFields = list("y_var")
      )
    )
  }

  if (show_box) {
    quantiles <- transform_quantiles(data, mapping, options)$data
    quantile_groups <- as.character(quantiles[[mapping$x_var]])

    box_data <- data.frame(
      x_var = unname(position_lookup[quantile_groups]),
      low_y = quantiles$q1,
      high_y = quantiles$q3,
      group = quantile_groups,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )

    layers[[length(layers) + 1L]] <- list(
      type = "rangeBar",
      data = box_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - iqr_box"),
      color = group_colors[[1]],
      role = "iqr_box"
    )
  }

  if (show_median) {
    median_df <- transform_median(data, mapping, options)$data
    median_groups <- as.character(median_df[[mapping$x_var]])
    median_points <- data.frame(
      x_var = unname(position_lookup[median_groups]),
      y_var = median_df[[mapping$y_var]],
      group = median_groups,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )

    layers[[length(layers) + 1L]] <- list(
      type = "point",
      data = median_points,
      mapping = list(x_var = "x_var", y_var = "y_var", group = "group"),
      transform = "identity",
      label = paste0(label, " - median"),
      color = group_colors[[1]],
      role = "median"
    )
  }

  if (show_points) {
    raw_points <- do.call(rbind, lapply(seq_along(group_values), function(i) {
      group_value <- group_values[[i]]
      group_label <- group_labels[[i]]
      group_data <- data[data[[mapping$x_var]] == group_value, , drop = FALSE]
      if (nrow(group_data) == 0) {
        return(NULL)
      }
      if (nrow(group_data) == 1) {
        offsets <- 0
      } else {
        offsets <- seq(-0.2, 0.2, length.out = nrow(group_data))
      }
      data.frame(
        x_var = unname(position_lookup[[group_label]]) + offsets,
        y_var = group_data[[mapping$y_var]],
        group = group_label,
        stringsAsFactors = FALSE,
        check.names = FALSE
      )
    }))

    if (!is.null(raw_points) && nrow(raw_points) > 0) {
      layers[[length(layers) + 1L]] <- list(
        type = "point",
        data = raw_points,
        mapping = list(x_var = "x_var", y_var = "y_var", group = "group"),
        transform = "identity",
        label = paste0(label, " - points"),
        color = group_colors[[1]],
        role = "points"
      )
    }
  }

  layers
}

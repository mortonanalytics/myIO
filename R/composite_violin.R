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

  layers <- list()

  for (i in seq_along(group_values)) {
    group_value <- group_values[[i]]
    group_label <- group_labels[[i]]
    group_data <- data[data[[mapping$x_var]] == group_value, , drop = FALSE]
    density_data <- transform_density(group_data, mapping, list(mirror = TRUE, bandwidth = bandwidth))$data
    density_data[["group"]] <- group_label

    layers[[length(layers) + 1L]] <- list(
      type = "area",
      data = density_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " — ", group_label, " — density"),
      color = group_colors[[i]],
      role = "density_area"
    )
  }

  if (show_box) {
    quantiles <- transform_quantiles(data, mapping, options)$data
    quantile_groups <- as.character(quantiles[[mapping$x_var]])

    box_data <- do.call(rbind, lapply(seq_along(quantile_groups), function(i) {
      group_label <- quantile_groups[[i]]
      pos <- position_lookup[[group_label]]
      data.frame(
        x_var = c(pos - box_half_width, pos + box_half_width),
        low_y = c(quantiles$q1[[i]], quantiles$q1[[i]]),
        high_y = c(quantiles$q3[[i]], quantiles$q3[[i]]),
        group = c(group_label, group_label),
        stringsAsFactors = FALSE,
        check.names = FALSE
      )
    }))

    layers[[length(layers) + 1L]] <- list(
      type = "area",
      data = box_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " — iqr_box"),
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
      label = paste0(label, " — median"),
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
        label = paste0(label, " — points"),
        color = group_colors[[1]],
        role = "points"
      )
    }
  }

  layers
}

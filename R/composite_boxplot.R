#' Boxplot composite expansion
#'
#' @keywords internal
composite_boxplot <- function(data, mapping, label, color, options) {
  show_outliers <- !isFALSE(options$showOutliers)
  whisker_type <- if (is.null(options$whiskerType)) "tukey" else options$whiskerType
  box_half_width <- if (is.null(options$boxWidth)) 0.35 else as.numeric(options$boxWidth) / 2
  base_color <- if (is.null(color)) OKABE_ITO_PALETTE[[1]] else if (length(color) > 0) color[[1]] else OKABE_ITO_PALETTE[[1]]

  quantiles <- transform_quantiles(data, mapping, options)$data
  groups <- as.character(quantiles[[mapping$x_var]])
  positions <- seq_along(groups)
  position_lookup <- stats::setNames(positions, groups)

  if (whisker_type == "minmax") {
    group_values <- lapply(groups, function(group_value) {
      values <- data[data[[mapping$x_var]] == group_value, mapping$y_var]
      values <- values[!is.na(values)]
      c(whisker_low = min(values), whisker_high = max(values))
    })
    whisker_df <- do.call(rbind, group_values)
  } else {
    whisker_df <- quantiles[, c("whisker_low", "whisker_high"), drop = FALSE]
  }

  median_df <- transform_median(data, mapping, options)$data
  outliers_df <- transform_outliers(data, mapping, options)$data

  box_data <- data.frame(
    x_var = positions,
    low_y = quantiles$q1,
    high_y = quantiles$q3,
    group = groups,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  whisker_low_data <- data.frame(
    x_var = positions,
    y_var = whisker_df$whisker_low,
    low_y = whisker_df$whisker_low,
    high_y = quantiles$q1,
    group = groups,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  whisker_high_data <- data.frame(
    x_var = positions,
    y_var = whisker_df$whisker_high,
    low_y = quantiles$q3,
    high_y = whisker_df$whisker_high,
    group = groups,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  median_plot_data <- data.frame(
    x_var = positions,
    y_var = median_df[[mapping$y_var]],
    low_y = median_df[[mapping$y_var]],
    high_y = median_df[[mapping$y_var]],
    group = groups,
    stringsAsFactors = FALSE,
    check.names = FALSE
  )

  outlier_plot_data <- NULL
  if (show_outliers && nrow(outliers_df) > 0) {
    outlier_groups <- as.character(outliers_df[[mapping$x_var]])
    outlier_plot_data <- data.frame(
      x_var = unname(position_lookup[outlier_groups]),
      y_var = outliers_df[[mapping$y_var]],
      group = outlier_groups,
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
  }

  layers <- list(
    list(
      type = "rangeBar",
      data = box_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - iqr_box"),
      color = base_color,
      role = "iqr_box"
    ),
    list(
      type = "point",
      data = whisker_low_data,
      mapping = list(x_var = "x_var", y_var = "y_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - whisker_low"),
      color = base_color,
      role = "whisker_low"
    ),
    list(
      type = "point",
      data = whisker_high_data,
      mapping = list(x_var = "x_var", y_var = "y_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - whisker_high"),
      color = base_color,
      role = "whisker_high"
    ),
    list(
      type = "point",
      data = median_plot_data,
      mapping = list(x_var = "x_var", y_var = "y_var", low_y = "low_y", high_y = "high_y", group = "group"),
      transform = "identity",
      label = paste0(label, " - median"),
      color = base_color,
      role = "median"
    )
  )

  if (!is.null(outlier_plot_data) && nrow(outlier_plot_data) > 0) {
    layers[[length(layers) + 1L]] <- list(
      type = "point",
      data = outlier_plot_data,
      mapping = list(x_var = "x_var", y_var = "y_var", group = "group"),
      transform = "identity",
      label = paste0(label, " - outliers"),
      color = base_color,
      role = "outliers"
    )
  }

  layers
}

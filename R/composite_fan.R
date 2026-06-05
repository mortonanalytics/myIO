#' Fan chart composite expansion
#'
#' @noRd
composite_fan <- function(data, mapping, label, color, options) {
  levels <- if (is.null(options$levels)) c(50, 80, 95) else options$levels
  if (!is.numeric(levels) || length(levels) < 1L || any(is.na(levels)) ||
      any(levels <= 0 | levels >= 100)) {
    stop("composite_fan(): `levels` must be numeric percentages between 0 and 100.", call. = FALSE)
  }
  levels <- sort(unique(as.numeric(levels)), decreasing = TRUE)

  interval <- if (is.null(options$interval)) "prediction" else options$interval
  if (!is.character(interval) || length(interval) != 1L || !(interval %in% c("prediction", "confidence"))) {
    stop("composite_fan(): `interval` must be 'prediction' or 'confidence'.", call. = FALSE)
  }

  min_obs <- if (is.null(options$min_obs)) 10L else options$min_obs
  if (!is.numeric(min_obs) || length(min_obs) != 1L || is.na(min_obs) || min_obs < 1L) {
    stop("composite_fan(): `min_obs` must be a positive integer.", call. = FALSE)
  }
  min_obs <- as.integer(min_obs)

  base_color <- if (is.null(color)) OKABE_ITO_PALETTE[[1]] else if (length(color) > 0) color[[1]] else OKABE_ITO_PALETTE[[1]]
  x_col <- mapping$x_var
  y_col <- mapping$y_var
  x_values <- data[[x_col]]
  groups <- unique(x_values)

  if (isTRUE(options$precomputed)) {
    layers_data <- lapply(levels, function(level) {
      low_col <- paste0("low_", format_level_suffix(level))
      high_col <- paste0("high_", format_level_suffix(level))
      missing <- setdiff(c(low_col, high_col), names(data))
      if (length(missing) > 0L) {
        stop("composite_fan(): precomputed input is missing columns: ",
             paste(missing, collapse = ", "), ".", call. = FALSE)
      }
      data.frame(
        x_var = data[[x_col]],
        low_y = data[[low_col]],
        high_y = data[[high_col]],
        stringsAsFactors = FALSE,
        check.names = FALSE
      )
    })
  } else {
    group_counts <- vapply(groups, function(group_value) {
      sum(!is.na(data[[y_col]][x_values == group_value]))
    }, integer(1))
    if (any(group_counts < min_obs)) {
      bad <- groups[group_counts < min_obs]
      stop(
        "composite_fan(): each x_var group must have at least min_obs=",
        min_obs,
        " observations; insufficient groups: ",
        paste(as.character(bad), collapse = ", "),
        ".",
        call. = FALSE
      )
    }

    layers_data <- lapply(levels, function(level) {
      alpha <- (1 - level / 100) / 2
      rows <- lapply(groups, function(group_value) {
        group_y <- data[[y_col]][x_values == group_value]
        group_y <- group_y[!is.na(group_y)]
        qs <- stats::quantile(group_y, probs = c(alpha, 1 - alpha), type = 7, names = FALSE, na.rm = TRUE)
        data.frame(
          x_var = group_value,
          low_y = as.numeric(qs[[1]]),
          high_y = as.numeric(qs[[2]]),
          stringsAsFactors = FALSE,
          check.names = FALSE
        )
      })
      do.call(rbind, rows)
    })
  }

  level_count <- length(levels)
  layers <- vector("list", level_count)
  for (i in seq_along(levels)) {
    level <- levels[[i]]
    band_data <- layers_data[[i]]
    band_data$density_label <- paste0(format_level_suffix(level), "% interval")
    band_data$interval_pct <- level
    band_data$intervalType <- interval
    band_data[["_source_key"]] <- paste0("fan_", format_level_suffix(level), "_", seq_len(nrow(band_data)))

    opacity <- if (level_count == 1L) 0.35 else 0.18 + (level_count - i) * (0.22 / max(level_count - 1L, 1L))
    layers[[i]] <- list(
      type = "area",
      data = band_data,
      mapping = list(x_var = "x_var", low_y = "low_y", high_y = "high_y"),
      transform = "identity",
      label = paste0(label, " - ", format_level_suffix(level), "% interval"),
      color = base_color,
      role = paste0("fan_", format_level_suffix(level)),
      options = list(
        interval_pct = level,
        density_label = paste0(format_level_suffix(level), "% interval"),
        intervalType = interval,
        areaOpacity = opacity,
        boundaryStroke = TRUE
      )
    )
  }

  layers
}

format_level_suffix <- function(level) {
  sub("\\.0+$", "", sub("(\\.\\d*?)0+$", "\\1", as.character(level)))
}

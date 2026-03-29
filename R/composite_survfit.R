#' Survfit composite
#'
#' Expands into step-curve line + CI band + censored-observation markers.
#'
#' @keywords internal
composite_survfit <- function(data, mapping, label, color, options) {
  level <- if (is.null(options$level)) 0.95 else options$level
  show_ci <- if (is.null(options$showCI)) TRUE else isTRUE(options$showCI)
  show_censor <- if (is.null(options$showCensor)) TRUE else isTRUE(options$showCensor)

  has_group <- !is.null(mapping$group) && mapping$group %in% colnames(data)
  if (has_group) {
    group_vals <- unique(data[[mapping$group]])
  } else {
    group_vals <- list(NULL)
  }

  sublayers <- list()

  for (gv in group_vals) {
    if (!is.null(gv)) {
      group_data <- data[data[[mapping$group]] == gv, , drop = FALSE]
      group_label <- paste0(label, " \u2014 ", as.character(gv))
    } else {
      group_data <- data
      group_label <- label
    }

    # Run the KM transform once for this group
    group_data <- ensure_source_key(group_data)
    km_result <- transform_survfit(group_data, mapping,
                                   list(level = level))
    km_all <- km_result$data
    km_curve <- km_all[km_all$censored == 0L, , drop = FALSE]
    km_censor <- km_all[km_all$censored == 1L, , drop = FALSE]

    # Sublayer mapping: the transform outputs use fixed column names
    curve_mapping <- list(x_var = "time", y_var = "surv")
    band_mapping <- list(x_var = "time", low_y = "ci_lower", high_y = "ci_upper")
    censor_mapping <- list(x_var = "time", y_var = "surv")

    # 1. Step-curve line
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "line", role = "step_curve",
      label = paste0(group_label, " (curve)"),
      data = km_curve, mapping = curve_mapping,
      transform = "identity",
      color = color,
      options = list(curveType = "stepAfter"),
      scaleHints = list(
        xScaleType = "linear", yScaleType = "linear",
        xExtentFields = list(), yExtentFields = list("surv"),
        domainMerge = "union"
      )
    )

    # 2. CI band
    if (show_ci && nrow(km_curve) > 0L) {
      sublayers[[length(sublayers) + 1L]] <- list(
        type = "area", role = "ci_band",
        label = paste0(group_label, " (CI)"),
        data = km_curve, mapping = band_mapping,
        transform = "identity",
        color = color,
        options = list(curveType = "stepAfter"),
        scaleHints = list(
          xScaleType = "linear", yScaleType = "linear",
          xExtentFields = list(), yExtentFields = list("ci_lower", "ci_upper"),
          domainMerge = "union"
        )
      )
    }

    # 3. Censor marks
    if (show_censor && nrow(km_censor) > 0L) {
      sublayers[[length(sublayers) + 1L]] <- list(
        type = "point", role = "censor_marks",
        label = paste0(group_label, " (censored)"),
        data = km_censor, mapping = censor_mapping,
        transform = "identity",
        color = color,
        options = list(shape = "tickUp", radius = 4),
        scaleHints = list(
          xScaleType = "linear", yScaleType = "linear",
          xExtentFields = list(), yExtentFields = list("surv"),
          domainMerge = "union"
        )
      )
    }
  }

  sublayers
}

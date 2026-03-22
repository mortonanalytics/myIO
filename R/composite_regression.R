#' Regression composite
#'
#' Expands into scatter + trend line + CI band + R² annotation sublayers.
#'
#' @keywords internal
composite_regression <- function(data, mapping, label, color, options) {
  method <- if (is.null(options$method)) "lm" else options$method
  show_ci <- if (is.null(options$showCI)) TRUE else isTRUE(options$showCI)
  show_stats <- if (is.null(options$showStats)) TRUE else isTRUE(options$showStats)
  level <- if (is.null(options$level)) 0.95 else options$level
  interval <- if (is.null(options$interval)) "confidence" else options$interval

  # Determine groups
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

    # 1. Scatter points
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "point", role = "scatter",
      label = paste0(group_label, " (data)"),
      data = group_data, mapping = mapping, transform = "identity",
      color = color, options = list()
    )

    # 2. Trend line
    sublayers[[length(sublayers) + 1L]] <- list(
      type = "line", role = "trend",
      label = paste0(group_label, " (trend)"),
      data = group_data, mapping = mapping, transform = method,
      color = color, options = options
    )

    # 3. CI band
    if (show_ci) {
      sublayers[[length(sublayers) + 1L]] <- list(
        type = "area", role = "ci_band",
        label = paste0(group_label, " (CI)"),
        data = group_data,
        mapping = list(x_var = mapping$x_var, y_var = mapping$y_var,
                       low_y = "low_y", high_y = "high_y"),
        transform = "ci",
        color = color,
        options = list(method = method, level = level, interval = interval,
                       span = options$span, degree = options$degree)
      )
    }

    # 4. R² annotation (lm/polynomial only, first group only)
    if (show_stats && length(sublayers) <= 4 && method %in% c("lm", "polynomial")) {
      x_vals <- group_data[[mapping$x_var]]
      y_vals <- group_data[[mapping$y_var]]
      complete <- !is.na(x_vals) & !is.na(y_vals)
      if (sum(complete) >= 3L) {
        x_clean <- x_vals[complete]
        y_clean <- y_vals[complete]
        model <- if (method == "lm") {
          stats::lm(y_clean ~ x_clean)
        } else {
          stats::lm(y_clean ~ stats::poly(x_clean,
            degree = if (is.null(options$degree)) 2L else options$degree,
            raw = TRUE))
        }
        r_sq <- summary(model)$r.squared
        coefs <- stats::coef(model)

        eq_text <- if (method == "lm") {
          sprintf("y = %sx + %s",
                  format(round(coefs[2], 3), nsmall = 3),
                  format(round(coefs[1], 3), nsmall = 3))
        } else {
          paste0("poly(", if (is.null(options$degree)) 2L else options$degree, ")")
        }

        annotation_data <- data.frame(
          text = c(
            paste0("R\u00B2 = ", format(round(r_sq, 3), nsmall = 3)),
            eq_text
          ),
          stringsAsFactors = FALSE
        )
        annotation_data[["_source_key"]] <- paste0("annotation_", seq_len(nrow(annotation_data)))

        sublayers[[length(sublayers) + 1L]] <- list(
          type = "text", role = "annotation",
          label = paste0(group_label, " (stats)"),
          data = annotation_data, mapping = list(),
          transform = "identity", color = NULL,
          options = list(position = "top-right"),
          scaleHints = list(
            xScaleType = "linear", yScaleType = "linear",
            xExtentFields = list(), yExtentFields = list(),
            domainMerge = "union"
          )
        )
      }
    }
  }

  sublayers
}

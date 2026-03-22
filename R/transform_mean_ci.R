#' Group mean with confidence interval transform
#'
#' @keywords internal
transform_mean_ci <- function(data, mapping, options = list()) {
  level <- if (is.null(options$level)) 0.95 else options$level
  method <- if (is.null(options$method)) "t" else options$method
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  summarize_group <- function(gv) {
    group_y <- y_values[x_values == gv]
    group_y <- group_y[!is.na(group_y)]
    n <- length(group_y)

    if (n < 2L) {
      return(data.frame(
        x = gv,
        y = if (n == 1L) group_y else NA_real_,
        low_y = NA_real_, high_y = NA_real_,
        n = n, se = NA_real_,
        stringsAsFactors = FALSE, check.names = FALSE
      ))
    }

    m <- mean(group_y)
    se <- stats::sd(group_y) / sqrt(n)
    margin <- if (method == "t") {
      stats::qt(1 - (1 - level) / 2, df = n - 1) * se
    } else {
      stats::qnorm(1 - (1 - level) / 2) * se
    }

    data.frame(
      x = gv, y = m, low_y = m - margin, high_y = m + margin,
      n = n, se = se,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("mean_ci", list(
      sourceKeys = source_keys,
      derivedFrom = "input_rows"
    ))
  )
}

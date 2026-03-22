#' Pairwise hypothesis test transform
#'
#' @keywords internal
transform_pairwise_test <- function(data, mapping, options = list()) {
  method      <- if (is.null(options$method))     "t.test"  else options$method
  p_adjust    <- if (is.null(options$p_adjust))   "none"    else options$p_adjust
  paired      <- if (is.null(options$paired))     FALSE     else options$paired
  conf_level  <- if (is.null(options$conf_level)) 0.95      else options$conf_level
  comparisons <- options$comparisons
  step_frac   <- if (is.null(options$step_fraction)) 0.08   else options$step_fraction

  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]

  if (!is.numeric(y_values)) {
    stop("transform_pairwise_test requires numeric y_var.", call. = FALSE)
  }

  groups    <- unique(as.character(x_values))
  positions <- seq_along(groups)
  pos_lookup <- stats::setNames(positions, groups)

  if (length(groups) < 2L) {
    stop("transform_pairwise_test requires at least 2 groups.", call. = FALSE)
  }

  # Build pair list
  if (is.null(comparisons)) {
    pairs <- utils::combn(groups, 2, simplify = FALSE)
  } else {
    pairs <- comparisons
  }

  if (length(pairs) > 15L) {
    warning("More than 15 pairwise comparisons; consider specifying comparisons explicitly.",
            call. = FALSE)
  }

  # Run tests
  results <- lapply(pairs, function(pair) {
    g1_vals <- y_values[as.character(x_values) == pair[1]]
    g2_vals <- y_values[as.character(x_values) == pair[2]]
    g1_vals <- g1_vals[!is.na(g1_vals)]
    g2_vals <- g2_vals[!is.na(g2_vals)]

    if (length(g1_vals) < 2L || length(g2_vals) < 2L) {
      return(list(
        group1 = pair[1], group2 = pair[2],
        p_value = NA_real_, statistic = NA_real_,
        method_name = method
      ))
    }

    test_fn <- match.fun(method)
    test_result <- test_fn(g1_vals, g2_vals, paired = paired, conf.level = conf_level)

    list(
      group1 = pair[1], group2 = pair[2],
      p_value = test_result$p.value,
      statistic = unname(test_result$statistic),
      method_name = test_result$method
    )
  })

  # Adjust p-values
  raw_p <- vapply(results, function(r) r$p_value, numeric(1))
  adj_p <- if (p_adjust == "none") raw_p else stats::p.adjust(raw_p, method = p_adjust)

  # Bracket stacking: narrowest spans first
  spans <- vapply(results, function(r) {
    abs(pos_lookup[r$group2] - pos_lookup[r$group1])
  }, numeric(1))
  order_idx <- order(spans)

  data_max <- max(y_values, na.rm = TRUE)
  data_min <- min(y_values, na.rm = TRUE)
  y_range  <- data_max - data_min
  step     <- y_range * step_frac

  rows <- vector("list", length(results))
  for (level in seq_along(order_idx)) {
    i <- order_idx[level]
    r <- results[[i]]
    rows[[i]] <- data.frame(
      x1 = unname(pos_lookup[r$group1]),
      x2 = unname(pos_lookup[r$group2]),
      y  = data_max + step * level,
      group1 = r$group1,
      group2 = r$group2,
      p_value = adj_p[i],
      label = format_p_label(adj_p[i]),
      method = r$method_name,
      statistic = r$statistic,
      stringsAsFactors = FALSE, check.names = FALSE
    )
  }

  transformed <- do.call(rbind, rows)

  list(
    data = transformed,
    meta = new_transform_meta("pairwise_test", list(
      sourceKeys = NULL,
      derivedFrom = "input_rows"
    ))
  )
}

#' @keywords internal
format_p_label <- function(p) {
  if (is.na(p))        return("p = NA")
  if (p < 0.001)       return("p < 0.001 ***")
  if (p < 0.01)        return(sprintf("p = %.3f **", p))
  if (p < 0.05)        return(sprintf("p = %.3f *", p))
  sprintf("p = %.2f ns", p)
}

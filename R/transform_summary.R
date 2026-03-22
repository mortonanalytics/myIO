#' Summary statistics transform
#'
#' @keywords internal
transform_summary <- function(data, mapping, options = list()) {
  stat <- if (is.null(options$stat)) "count" else options$stat
  x_values <- data[[mapping$x_var]]
  y_values <- data[[mapping$y_var]]
  groups <- unique(x_values)

  stat_fn <- switch(stat,
    count = function(y) length(y[!is.na(y)]),
    sum   = function(y) sum(y, na.rm = TRUE),
    sd    = function(y) stats::sd(y, na.rm = TRUE),
    var   = function(y) stats::var(y, na.rm = TRUE),
    min   = function(y) min(y, na.rm = TRUE),
    max   = function(y) max(y, na.rm = TRUE),
    stop("Unknown stat '", stat, "'. Must be one of: count, sum, sd, var, min, max.",
         call. = FALSE)
  )

  summarize_group <- function(gv) {
    group_y <- y_values[x_values == gv]
    data.frame(
      x = gv,
      y = stat_fn(group_y),
      stringsAsFactors = FALSE,
      check.names = FALSE
    )
  }

  transformed <- do.call(rbind, lapply(groups, summarize_group))
  colnames(transformed)[1:2] <- c(mapping$x_var, mapping$y_var)

  source_keys <- lapply(groups, function(gv) {
    as.character(data[["_source_key"]][x_values == gv])
  })

  list(
    data = transformed,
    meta = new_transform_meta("summary", list(
      sourceKeys = source_keys,
      derivedFrom = "input_rows"
    ))
  )
}

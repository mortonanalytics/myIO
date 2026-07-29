#' Expand a grouped data frame into per-group layers
#'
#' When a \code{grouped_df} (from \code{dplyr::group_by()}) is passed to
#' \code{addIoLayer()}, this function splits the data by group and
#' recursively calls \code{addIoLayer()} once per group, assigning
#' auto-colors from the Okabe-Ito palette.
#'
#' @param myIO a myIO htmlwidget
#' @param type layer type
#' @param color optional color vector; recycled across groups
#' @param label base label; group values are appended
#' @param data a grouped_df
#' @param mapping aesthetic mapping list
#' @param transform transform name
#' @param options layer options
#'
#' @return The modified myIO widget with one layer per group.
#' @keywords internal
expand_grouped_df <- function(myIO, type, color, label, data, mapping, transform, options) {
  if (!requireNamespace("dplyr", quietly = TRUE)) {
    stop("expand_grouped_df(): The 'dplyr' package is required to use grouped data frames. ",
         "Install it with install.packages(\"dplyr\").", call. = FALSE)
  }

  group_vars <- dplyr::group_vars(data)
  if (length(group_vars) == 0L) {
    stop("expand_grouped_df(): data inherits 'grouped_df' but has no grouping variables.", call. = FALSE)
  }

  ungrouped <- dplyr::ungroup(data)
  group_keys <- unique(ungrouped[, group_vars, drop = FALSE])
  n_groups <- nrow(group_keys)

  if (is.null(color)) {
    colors <- rep_len(OKABE_ITO_PALETTE, n_groups)
  } else {
    colors <- rep_len(color, n_groups)
  }

  existing_labels <- vapply(myIO$x$config$layers, function(layer) layer$label, character(1))

  for (i in seq_len(n_groups)) {
    key_row <- group_keys[i, , drop = FALSE]
    group_label_parts <- vapply(group_vars, function(v) as.character(key_row[[v]]), character(1))
    group_suffix <- paste(group_label_parts, collapse = " / ")
    layer_label <- group_suffix
    if (layer_label %in% existing_labels) {
      layer_label <- paste0(label, " \u2014 ", group_suffix)
    }
    existing_labels <- c(existing_labels, layer_label)

    # Subset rows matching this group key
    mask <- rep(TRUE, nrow(ungrouped))
    for (v in group_vars) {
      mask <- mask & (ungrouped[[v]] == key_row[[v]])
    }
    subset_df <- ungrouped[mask, , drop = FALSE]

    myIO <- addIoLayer(
      myIO = myIO,
      type = type,
      color = colors[[i]],
      label = layer_label,
      data = subset_df,
      mapping = mapping,
      transform = transform,
      options = options
    )
  }

  myIO
}

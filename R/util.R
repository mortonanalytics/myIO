build_tree <- function(df, layerLabel, level_1, level_2) {
  # first level
  listSplit <- split(df, df[[level_1]], drop = TRUE)

  #second level
  my_tree <- lapply(names(listSplit), function(d) {
    this_df <- listSplit[[d]]
    list_split <- split(this_df, this_df[[level_2]],  drop = TRUE)
    # final recursion is to set names properly
    my_list <- lapply(names(list_split), function(e){
      this_df <- list_split[[e]]
      this_df <- lapply(seq_len(nrow(this_df)), function(i) {
        lapply(this_df[i, , drop = FALSE], function(col) col[[1]])
      })
      list(name = e, children = this_df)
    })
    list(name = d, children = my_list)
  })
  list(name = layerLabel, children = my_tree)
}

OKABE_ITO_PALETTE <- c(
  "#E69F00", "#56B4E9", "#009E73", "#F0E442",
  "#0072B2", "#D55E00", "#CC79A7", "#999999"
)

ALLOWED_TYPES <- c(
  "line", "point", "bar", "hexbin", "treemap", "gauge",
  "donut", "area", "groupedBar", "histogram", "heatmap",
  "candlestick", "waterfall", "sankey", "boxplot", "violin",
  "ridgeline", "rangeBar", "text", "regression", "bracket",
  "comparison", "qq",
  "lollipop", "dumbbell",
  "waffle", "beeswarm", "bump",
  "radar", "funnel", "parallel",
  "survfit", "histogram_fit",
  "calendarHeatmap", "quantile_dots", "fan"
)

COMPATIBILITY_GROUPS <- list(
  line = "axes-continuous",
  point = "axes-continuous",
  area = "axes-continuous",
  bar = "axes-categorical",
  groupedBar = "axes-categorical",
  histogram = "axes-binned",
  heatmap = "axes-matrix",
  candlestick = "axes-continuous",
  waterfall = "axes-categorical",
  sankey = "standalone-flow",
  boxplot = "axes-categorical",
  violin = "axes-categorical",
  ridgeline = "axes-binned",
  rangeBar = "axes-continuous",
  hexbin = "axes-hex",
  treemap = "standalone-treemap",
  donut = "standalone-donut",
  gauge = "standalone-gauge",
  text = "axes-continuous",
  regression = "axes-continuous",
  bracket = "axes-continuous",
  comparison = "axes-categorical",
  qq = "axes-continuous",
  lollipop = "axes-categorical",
  dumbbell = "axes-categorical",
  waffle = "standalone-waffle",
  beeswarm = "axes-continuous",
  bump = "axes-continuous",
  radar = "standalone-radar",
  funnel = "standalone-funnel",
  parallel = "standalone-parallel",
  survfit = "axes-continuous",
  histogram_fit = "axes-binned",
  calendarHeatmap = "standalone-calendar",
  quantile_dots = "axes-categorical",
  fan = "axes-continuous"
)

GROUP_MATRIX <- list(
  "axes-continuous" = c("axes-continuous", "axes-categorical", "axes-binned"),
  "axes-categorical" = c("axes-continuous", "axes-categorical"),
  "axes-binned" = c("axes-continuous", "axes-binned"),
  "axes-matrix" = c("axes-matrix"),
  "axes-hex" = c("axes-hex"),
  "standalone-flow" = c("standalone-flow"),
  "standalone-treemap" = c("standalone-treemap"),
  "standalone-donut" = c("standalone-donut"),
  "standalone-gauge" = c("standalone-gauge"),
  "standalone-waffle" = c("standalone-waffle"),
  "standalone-radar" = c("standalone-radar"),
  "standalone-funnel" = c("standalone-funnel"),
  "standalone-parallel" = c("standalone-parallel"),
  "standalone-calendar" = c("standalone-calendar")
)

VALID_COMBINATIONS <- list(
  line = c("identity", "lm", "loess", "polynomial", "smooth"),
  point = c("identity", "mean", "summary", "residuals"),
  area = c("identity", "ci"),
  bar = c("identity", "mean", "summary"),
  groupedBar = c("identity"),
  histogram = c("identity"),
  heatmap = c("identity"),
  candlestick = c("identity"),
  waterfall = c("identity", "cumulative"),
  sankey = c("identity"),
  boxplot = c("identity"),
  violin = c("identity"),
  ridgeline = c("identity"),
  rangeBar = c("identity", "mean_ci"),
  hexbin = c("identity"),
  treemap = c("identity"),
  donut = c("identity"),
  gauge = c("identity"),
  text = c("identity"),
  bracket = c("identity", "pairwise_test"),
  lollipop = c("identity", "mean", "summary"),
  dumbbell = c("identity"),
  waffle = c("identity"),
  beeswarm = c("identity"),
  bump = c("identity"),
  radar = c("identity"),
  funnel = c("identity"),
  parallel = c("identity"),
  survfit = c("identity"),
  histogram_fit = c("identity"),
  calendarHeatmap = c("identity"),
  quantile_dots = c("identity", "quantile_dots"),
  fan = c("identity")
)

composite_registry <- function() {
  list(
    boxplot = composite_boxplot,
    violin = composite_violin,
    ridgeline = composite_ridgeline,
    regression = composite_regression,
    comparison = composite_comparison,
    qq = composite_qq,
    survfit = composite_survfit,
    histogram_fit = composite_histogram_fit,
    fan = composite_fan
  )
}

assert_myIO <- function(x) {
  if (!inherits(x, "myIO")) {
    stop("Expected a myIO widget, got '", paste(class(x), collapse = "/"), "'.", call. = FALSE)
  }
  invisible(x)
}

as_layer_rows <- function(data) {
  n <- nrow(data)
  if (n == 0L) {
    return(list())
  }
  # Extract columns once, then index per row. Equivalent to the prior
  # `data[i, , drop = FALSE]` per-row data.frame subsetting but avoids that
  # O(ncol) overhead on every row (~5x faster at 100k rows). `lapply` over the
  # named column list preserves the column names, so each row is the same named
  # list of scalars as before -> byte-identical serialized JSON.
  #
  # Assumes atomic or list columns (numeric, integer, character, logical,
  # factor, Date, POSIXct, list) -- which is all the transforms ever produce.
  # A data.frame-valued column (an I-frame) would index by column here vs by
  # row in the old form; the package never builds those and could not serialize
  # them anyway.
  cols <- as.list(data)
  lapply(seq_len(n), function(i) {
    lapply(cols, function(col) col[[i]])
  })
}

ensure_source_key <- function(data) {
  if (is.null(data)) {
    return(data)
  }

  if (!("_source_key" %in% colnames(data))) {
    data[["_source_key"]] <- sprintf("row_%d", seq_len(nrow(data)))
  } else {
    data[["_source_key"]] <- as.character(data[["_source_key"]])
  }

  data
}

next_layer_id <- function(layers, prefix = "layer") {
  sprintf("%s_%03d", prefix, length(layers) + 1L)
}

new_transform_meta <- function(name, details = list()) {
  utils::modifyList(list(name = name, sourceKeys = NULL, derivedFrom = NULL), details)
}

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
  "donut", "area", "groupedBar", "histogram", "heatmap"
  ,"candlestick"
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
  hexbin = "axes-hex",
  treemap = "standalone-treemap",
  donut = "standalone-donut",
  gauge = "standalone-gauge"
)

GROUP_MATRIX <- list(
  "axes-continuous" = c("axes-continuous", "axes-categorical", "axes-binned"),
  "axes-categorical" = c("axes-continuous", "axes-categorical"),
  "axes-binned" = c("axes-continuous", "axes-binned"),
  "axes-matrix" = c("axes-matrix"),
  "axes-hex" = c("axes-hex"),
  "standalone-treemap" = c("standalone-treemap"),
  "standalone-donut" = c("standalone-donut"),
  "standalone-gauge" = c("standalone-gauge")
)

VALID_COMBINATIONS <- list(
  line = c("identity", "lm"),
  point = c("identity"),
  area = c("identity"),
  bar = c("identity"),
  groupedBar = c("identity"),
  histogram = c("identity"),
  heatmap = c("identity"),
  candlestick = c("identity"),
  hexbin = c("identity"),
  treemap = c("identity"),
  donut = c("identity"),
  gauge = c("identity")
)

composite_registry <- function() {
  list()
}

assert_myIO <- function(x) {
  if (!inherits(x, "myIO")) {
    stop("Expected a myIO widget, got '", paste(class(x), collapse = "/"), "'.", call. = FALSE)
  }
  invisible(x)
}

as_layer_rows <- function(data) {
  lapply(seq_len(nrow(data)), function(i) {
    lapply(data[i, , drop = FALSE], function(col) col[[1]])
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

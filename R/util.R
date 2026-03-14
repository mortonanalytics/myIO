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

`%||%` <- function(x, y) {
  if (is.null(x)) y else x
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
    data[["_source_key"]] <- sprintf("row_%03d", seq_len(nrow(data)))
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

buildLayers <- function(x, group, grouping, color, data, type, mapping, options,
                        transform = "identity", transformMeta = NULL,
                        sourceKey = "_source_key", derivedFrom = NULL,
                        parentComposite = NULL, compositeRole = NULL){

  #subset data for each layer
  temp_df <- data[data[[mapping$group]] == x, ]

  ##create layer element
  layer <- list(
    type = type,
    color = color[match(x, grouping)],
    label = x,
    mapping = mapping,
    data = as_layer_rows(temp_df),
    options = options,
    transform = transform,
    transformMeta = transformMeta,
    sourceKey = sourceKey,
    derivedFrom = derivedFrom,
    encoding = list(),
    visibility = TRUE
  )

  if (!is.null(parentComposite)) {
    layer$`_composite` <- parentComposite
    layer$`_compositeRole` <- compositeRole
  }

  layer
}

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
      this_df <- unname(split(this_df, 1:nrow(this_df)))
      list(name = e, children = this_df)
    })
    list(name = d, children = my_list)
  })
  list(name = layerLabel, children = my_tree)
}

buildLayers <- function(x, group, grouping, color, data, type, mapping, options){

  #subset data for each layer
  ##filter_criteria <- lazyeval::interp( ~ which_column == x, which_column = as.name(mapping$group))
  column <- as.name(mapping$group)

  temp_df <- data %>%
    dplyr::filter(!!column == x)

  ##create layer element
  layer <- list(
    type = type,
    color = color[match(x, grouping)],
    label = x,
    mapping = mapping,
    data = unname(split(temp_df, 1:nrow(temp_df))),
    options = options
  )
}

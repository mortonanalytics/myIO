#' addLayer()
#'
#' Adds individual layer to a myIO widget
#'
#' @param myIO an htmlwidget object created by the myIO() function
#' @param type a quoted string defining the type of layer: 'bar', 'line', 'point', 'hexbin', 'treemap'
#' @param color a quoted string defining the layer's color as an CSS recognized color
#' @param label a unique quoted label/id string for the plot
#' @param data (optional) R dataframe/tibble
#' @param mapping a list object defining variables for the layer: layer(x_var = "xVar", y_var = "yVar")
#' @param options a list oboject defining options for that layer
#'
#' @return the same myIO object with the new layer attached to the message for the browser (myIO$x$layers)
#'
#' @export

addIoLayer <- function(myIO,
                     type,
                     color = NULL,
                     label,
                     data = NULL,
                     mapping,
                     options = list(barSize = "large",
                                    toolTipOptions = list(suppressY = FALSE))){

  ##assert layer types
  stopifnot(is.character(type))
  #stopifnot(is.character(color))
  stopifnot(is.character(label))
  stopifnot(is.list(mapping))
  stopifnot(type %in% c("line", "point", "treemap", "bar", "hexbin", "gauge", "donut", "area", "groupedBar"))

  presets <-list(barSize = "large",
                 toolTipOptions = list(suppressY = FALSE))

  if(is.null(options)) {
    options <- presets
  }

  if(length(grep("group", names(mapping))) == 0){

    ## assign data
    if(type == "treemap"){
      data <- build_tree(data, label,mapping$level_1, mapping$level_2)
    } else {
      ## assign data
      if(is.null(data)) {
        data <- myIO$x$dataset
      }
      myIO$x$dataset <- NULL
      data <- unname(split(data, 1:nrow(data)))

    }

    ##create layer object
    layer <- list(
      type = type,
      color = color,
      label = label,
      data = data,
      mapping = mapping,
      options = options
    )

    ##put the layers together

    if(length(myIO$x$layers) > 0){
      myIO$x$layers <- c(myIO$x$layers, list(layer))
    } else {
      myIO$x$layers <- list(layer)
    }

  } else {
    ## create object to lappy against
    groupList <- unique(data[[mapping$group]])
    if(is.null(color)){
      color <- c("#1E90FF","#DC143C","#336292","#070A41", "orange")
      color <- color[1:length(groupList)]
    } else {
      color <- color[1:length(color)]
    }

    ## build layer
    newLayers <- lapply(groupList, buildLayers,
                            group = mapping$group,
                            grouping = groupList,
                            color = color,
                            data = data,
                            type = type,
                            mapping = mapping,
                            options = options)

    if(length(myIO$x$layers) > 0){
      myIO$x$layers <- c(myIO$x$layers, newLayers)
    } else {
      myIO$x$layers <- newLayers
    }
  }

  return(myIO)
}

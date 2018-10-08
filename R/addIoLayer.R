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
                     color,
                     label,
                     data = NULL,
                     mapping,
                     options = NULL){

  ##assert layer types
  stopifnot(is.character(type))
  stopifnot(is.character(color))
  stopifnot(is.character(label))
  stopifnot(is.list(mapping))
  stopifnot(type %in% c("line", "point", "treemap", "bar", "hexbin", "gauge"))

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

  return(myIO)
}

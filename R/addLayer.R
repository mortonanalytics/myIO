#' addLayer()
#'
#' Adds individual layer to a PopRViz widget
#'
#' @param myIO an htmlwidget object created by the PopRViz() function
#' @param layerType a quoted string defining the type of layer: 'bar', 'line', 'point'
#' @param layerColor a quoted string defining the layer's color as an CSS recognized color
#' @param layerLabel a unique quoted label/id string for the plot
#' @param layeData (optional) R dataframe/tibble
#' @param layerMapping a list object defining variables for the layer: layer(x_var = "xVar", y_var = "yVar", z_var = "groupVar")
#'
#' @return the same myIO object with the new layer attached to the message for the browser (PopRViz$x$layers)
#'
#' @export

addLayer <- function(myIO,
                     layerType,
                     layerColor,
                     layerLabel,
                     layerData = NULL,
                     layerMapping ){

  ## assign data
  if(is.null(layerData)) {
    layerData <- myIO$x$dataset
  }
  myIO$x$dataset <- NULL
  layerData <- unname(split(layerData, 1:nrow(layerData)))

  ##create layer object
  layer <- list(
    type = layerType,
    color = layerColor,
    label = layerLabel,
    data = layerData,
    ##plot variables
    x_var = layerMapping$x_var,
    low_x = layerMapping$low_x,
    high_x = layerMapping$high_x,
    y_var = layerMapping$y_var,
    low_y = layerMapping$low_y,
    high_y = layerMapping$high_y
  )

  ##put the layers together

  if(length(myIO$x$layers) > 0){
    myIO$x$layers <- c(myIO$x$layers, list(layer))
  } else {
    myIO$x$layers <- list(layer)
  }

  return(myIO)
}

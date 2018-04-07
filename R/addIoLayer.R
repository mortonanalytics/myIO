#' addLayer()
#'
#' Adds individual layer to a myIO widget
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

addIoLayer <- function(myIO,
                     type,
                     color,
                     label,
                     data = NULL,
                     mapping ){

  ## assign data
  if(is.null(layerData)) {
    layerData <- myIO$x$dataset
  }
  myIO$x$dataset <- NULL
  layerData <- unname(split(layerData, 1:nrow(layerData)))

  ##create layer object
  layer <- list(
    type = type,
    color = color,
    label = label,
    data = layerData,
    mapping - mapping
  )

  ##put the layers together

  if(length(myIO$x$layers) > 0){
    myIO$x$layers <- c(myIO$x$layers, list(layer))
  } else {
    myIO$x$layers <- list(layer)
  }

  return(myIO)
}

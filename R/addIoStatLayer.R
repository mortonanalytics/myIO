#' addIOStatLayer()
#'
#' Adds individual statistics layer to a myIO widget
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

addIoStatLayer <- function(myIO,
                     type,
                     color,
                     label,
                     data = NULL,
                     mapping ){

  ## assign data
  if(is.null(data)) {
    data <- myIO$x$dataset
  }
  myIO$x$dataset <- NULL

  ###calculate statistic
  if(type == "lm"){
    model <- lm(data[[mapping$y_var]] ~ data[[mapping$x_var]])
    data <- data.frame(x_var = data[[mapping$x_var]], y_var = model$fitted.values)
    colnames(data) <- c(mapping$x_var, mapping$y_var)
    data <- data[order(data[,1]),]
    type <- "stat_line"
    }
  ###prepare data as d3 ready
  data <- unname(split(data, 1:nrow(data)))

  ##create layer object
  layer <- list(
    type = type,
    color = color,
    label = label,
    data = data,
    mapping = mapping
  )

  ##put the layers together

  if(length(myIO$x$layers) > 0){
    myIO$x$layers <- c(myIO$x$layers, list(layer))
  } else {
    myIO$x$layers <- list(layer)
  }

  return(myIO)
}

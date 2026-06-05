#' Comparison composite expansion
#'
#' @noRd
composite_comparison <- function(data, mapping, label, color, options) {
  method      <- if (is.null(options$method))   "t.test" else options$method
  p_adjust    <- if (is.null(options$p_adjust)) "none"   else options$p_adjust
  comparisons <- options$comparisons

  # Reuse boxplot for base layers
  box_layers <- composite_boxplot(data, mapping, label, color, options)

  # Add bracket layer
  bracket_layer <- list(
    type = "bracket",
    role = "significance",
    label = paste0(label, " - significance"),
    data = data,
    mapping = mapping,
    transform = "pairwise_test",
    color = NULL,
    options = list(method = method, p_adjust = p_adjust,
                   comparisons = comparisons),
    scaleHints = list(
      xScaleType = "linear",
      yScaleType = "linear",
      xExtentFields = list(),
      yExtentFields = list("y"),
      domainMerge = "union"
    )
  )

  c(box_layers, list(bracket_layer))
}

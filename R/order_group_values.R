#' Order categorical group values for a positional axis
#'
#' Composites that hand out integer positions to a categorical variable must
#' agree on the order. A factor's level order is the user's explicit statement
#' of intent and wins (ordered by as.integer(), never by label); everything
#' else sorts ascending. Character sorting is forced into the C locale so the
#' result does not vary with the machine's collation. NAs sort last.
#'
#' @noRd
order_group_values <- function(values) {
  if (is.factor(values)) {
    values[order(as.integer(values), na.last = TRUE)]
  } else if (is.character(values)) {
    values[order(values, na.last = TRUE, method = "radix")]
  } else {
    values[order(values, na.last = TRUE)]
  }
}

# Match one group without introducing NA rows during data frame subsetting.
group_matches <- function(values, value) {
  match(values, value, nomatch = 0L) > 0L
}

group_labels <- function(values) {
  labels <- as.character(values)
  existing_tags <- gsub("[^a-zA-Z0-9_-]", "", labels[!is.na(labels)])
  missing_label <- "NA"
  suffix <- 1L
  while (gsub("[^a-zA-Z0-9_-]", "", missing_label) %in% existing_tags) {
    missing_label <- if (suffix == 1L) "NA (missing)" else paste0("NA (missing ", suffix, ")")
    suffix <- suffix + 1L
  }
  labels[is.na(labels)] <- missing_label
  labels
}

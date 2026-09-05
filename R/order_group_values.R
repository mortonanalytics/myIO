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
  if (is.na(value)) is.na(values) else !is.na(values) & values == value
}

group_labels <- function(values) {
  labels <- as.character(values)
  missing_label <- "NA"
  while (missing_label %in% labels[!is.na(values)]) {
    missing_label <- paste0("(", missing_label, ")")
  }
  labels[is.na(values)] <- missing_label
  labels
}

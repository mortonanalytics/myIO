#' Kaplan-Meier survival transform
#'
#' Computes the KM estimator, Greenwood CI, and censoring indicators from raw
#' time-to-event data.  No dependency on the survival package.
#'
#' @param data  Data frame with time and status columns.
#' @param mapping  Named list; must contain `time` and `status`.
#' @param options  List; `level` (default 0.95) controls CI width.
#' @return List with `data` (data.frame) and `meta`.
#' @keywords internal
transform_survfit <- function(data, mapping, options = list()) {
  level <- if (is.null(options$level)) 0.95 else options$level

  time_col <- mapping$time
  status_col <- mapping$status

  t_vec <- data[[time_col]]
  s_vec <- data[[status_col]]

  # Remove NAs
  complete <- !is.na(t_vec) & !is.na(s_vec)
  t_vec <- t_vec[complete]
  s_vec <- as.integer(s_vec[complete])
  source_keys <- as.character(data[["_source_key"]][complete])

  if (length(t_vec) < 1L) {
    empty <- data.frame(
      time = numeric(0), surv = numeric(0),
      ci_lower = numeric(0), ci_upper = numeric(0),
      n_risk = integer(0), n_event = integer(0),
      censored = integer(0),
      stringsAsFactors = FALSE
    )
    empty[["_source_key"]] <- character(0)
    return(list(
      data = empty,
      meta = new_transform_meta("survfit", list(
        sourceKeys = list(), derivedFrom = "input_rows"
      ))
    ))
  }

  # Sort by time
  ord <- order(t_vec, -s_vec)
  t_vec <- t_vec[ord]
  s_vec <- s_vec[ord]
  source_keys <- source_keys[ord]

  # Distinct event times (only times where at least one event occurred)
  n_total <- length(t_vec)
  event_times <- sort(unique(t_vec[s_vec == 1L]))

  # Build KM table
  surv <- 1.0
  var_sum <- 0.0  # running Greenwood summand

  # Start with time = 0, surv = 1
  out_time <- 0
  out_surv <- 1.0
  out_var_sum <- 0.0
  out_n_risk <- n_total
  out_n_event <- 0L

  for (ti in event_times) {
    # Number at risk just before ti: subjects with t >= ti
    n_i <- sum(t_vec >= ti)
    # Number of events at ti
    d_i <- sum(t_vec == ti & s_vec == 1L)

    surv <- surv * (1 - d_i / n_i)
    # Greenwood variance summand: d_i / (n_i * (n_i - d_i))
    denom <- n_i * (n_i - d_i)
    if (denom > 0) {
      var_sum <- var_sum + d_i / denom
    }

    out_time <- c(out_time, ti)
    out_surv <- c(out_surv, surv)
    out_var_sum <- c(out_var_sum, var_sum)
    out_n_risk <- c(out_n_risk, n_i)
    out_n_event <- c(out_n_event, d_i)
  }

  if (max(t_vec) > out_time[[length(out_time)]]) {
    out_time <- c(out_time, max(t_vec))
    out_surv <- c(out_surv, surv)
    out_var_sum <- c(out_var_sum, var_sum)
    out_n_risk <- c(out_n_risk, sum(t_vec == max(t_vec)))
    out_n_event <- c(out_n_event, 0L)
  }

  # Greenwood CI: S(t) +/- z * S(t) * sqrt(var_sum)
  z <- stats::qnorm(1 - (1 - level) / 2)
  se <- out_surv * sqrt(out_var_sum)
  ci_lower <- pmax(0, out_surv - z * se)
  ci_upper <- pmin(1, out_surv + z * se)

  km_df <- data.frame(
    time = out_time,
    surv = out_surv,
    ci_lower = ci_lower,
    ci_upper = ci_upper,
    n_risk = as.integer(out_n_risk),
    n_event = as.integer(out_n_event),
    censored = 0L,
    stringsAsFactors = FALSE
  )
  km_df[["_source_key"]] <- sprintf("km_%d", seq_len(nrow(km_df)))

  # Censored observations: subjects with status == 0 at their observed time.
  # Look up S(t) at the censor time (last event time <= censor time).
  censor_idx <- which(s_vec == 0L)
  if (length(censor_idx) > 0L) {
    censor_times <- t_vec[censor_idx]
    censor_surv <- vapply(censor_times, function(ct) {
      valid <- out_time <= ct
      if (any(valid)) out_surv[max(which(valid))] else 1.0
    }, numeric(1))
    censor_ci_lo <- vapply(censor_times, function(ct) {
      valid <- out_time <= ct
      if (any(valid)) ci_lower[max(which(valid))] else 1.0
    }, numeric(1))
    censor_ci_hi <- vapply(censor_times, function(ct) {
      valid <- out_time <= ct
      if (any(valid)) ci_upper[max(which(valid))] else 1.0
    }, numeric(1))

    censor_df <- data.frame(
      time = censor_times,
      surv = censor_surv,
      ci_lower = censor_ci_lo,
      ci_upper = censor_ci_hi,
      n_risk = 0L,
      n_event = 0L,
      censored = 1L,
      stringsAsFactors = FALSE
    )
    censor_df[["_source_key"]] <- source_keys[censor_idx]
  } else {
    censor_df <- km_df[0, , drop = FALSE]
  }

  full_df <- rbind(km_df, censor_df)

  list(
    data = full_df,
    meta = new_transform_meta("survfit", list(
      sourceKeys = as.list(source_keys),
      derivedFrom = "input_rows"
    ))
  )
}

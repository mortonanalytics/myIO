test_that("transform_survfit computes correct KM estimator", {
  df <- data.frame(
    time = c(1, 2, 3, 4, 5),
    status = c(1, 0, 1, 0, 1),
    `_source_key` = paste0("row_", 1:5),
    check.names = FALSE
  )
  result <- transform_survfit(df, list(time = "time", status = "status"))
  km <- result$data[result$data$censored == 0L, ]

  # At t=0: S=1.0, n_risk=5
  expect_equal(km$time[1], 0)
  expect_equal(km$surv[1], 1.0)

  # At t=1: d=1, n=5, S = 1 * (1 - 1/5) = 0.8
  expect_equal(km$surv[2], 0.8)
  expect_equal(km$n_risk[2], 5L)

  # At t=3: d=1, n=3, S = 0.8 * (1 - 1/3) = 0.5333...
  expect_equal(km$surv[3], 0.8 * (2 / 3), tolerance = 1e-10)

  # At t=5: d=1, n=1, S = 0.5333 * (1 - 1/1) = 0
  expect_equal(km$surv[4], 0)
})

test_that("censored observations get correct survival probability", {
  df <- data.frame(
    time = c(1, 2, 3),
    status = c(1, 0, 1),
    `_source_key` = paste0("row_", 1:3),
    check.names = FALSE
  )
  result <- transform_survfit(df, list(time = "time", status = "status"))
  cens <- result$data[result$data$censored == 1L, ]

  # Censored at t=2; last event time <= 2 is t=1 where S=0.6667
  expect_equal(nrow(cens), 1)
  expect_equal(cens$time, 2)
  expect_equal(cens$surv, 1 * (1 - 1 / 3), tolerance = 1e-10)
})

test_that("CI bounds are within [0, 1]", {
  df <- data.frame(
    time = c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10),
    status = c(1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
    `_source_key` = paste0("row_", 1:10),
    check.names = FALSE
  )
  result <- transform_survfit(df, list(time = "time", status = "status"))
  expect_true(all(result$data$ci_lower >= 0))
  expect_true(all(result$data$ci_upper <= 1))
})

test_that("composite_survfit returns step_curve, ci_band, censor_marks", {
  df <- data.frame(
    time = c(1, 2, 3, 4, 5),
    status = c(1, 0, 1, 0, 1)
  )
  subs <- composite_survfit(df, list(time = "time", status = "status"),
                            "test", "#0072B2", list())
  roles <- vapply(subs, function(s) s$role, character(1))
  expect_true("step_curve" %in% roles)
  expect_true("ci_band" %in% roles)
  expect_true("censor_marks" %in% roles)
  expect_equal(subs[[1]]$type, "line")
  expect_equal(subs[[2]]$type, "area")
  expect_equal(subs[[3]]$type, "point")
})

test_that("grouped survfit produces sublayers per group", {
  df <- data.frame(
    time = c(1, 2, 3, 4, 5, 6),
    status = c(1, 1, 0, 1, 0, 1),
    arm = c("A", "A", "A", "B", "B", "B")
  )
  subs <- composite_survfit(
    df, list(time = "time", status = "status", group = "arm"),
    "test", "#0072B2", list()
  )
  labels <- vapply(subs, function(s) s$label, character(1))
  expect_true(any(grepl("A", labels)))
  expect_true(any(grepl("B", labels)))
  # 3 sublayers per group (curve + CI + censor) = 6 total
  # (may be fewer if a group has no censored obs)
  expect_true(length(subs) >= 4)
})

test_that("addIoLayer type='survfit' produces a valid widget", {
  df <- data.frame(time = c(1, 2, 3, 4, 5), status = c(1, 0, 1, 0, 1))
  w <- myIO(data = df) |>
    addIoLayer(type = "survfit", label = "km",
               mapping = list(time = "time", status = "status"))
  expect_s3_class(w, "myIO")
  layer_types <- vapply(w$x$config$layers, function(l) l$type, character(1))
  expect_true("line" %in% layer_types)
  expect_true("area" %in% layer_types)
})

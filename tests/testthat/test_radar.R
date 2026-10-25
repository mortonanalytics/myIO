test_that("radar layer accepts valid inputs", {
  df <- data.frame(axis = c("Speed", "Power", "Range", "Armor", "Magic"),
                   value = c(80, 60, 90, 40, 70))
  p <- myIO(df) |>
    addIoLayer("radar", label = "hero", mapping = list(axis = "axis", value = "value"))
  expect_s3_class(p, "myIO")
  expect_equal(p$x$config$layers[[1]]$type, "radar")
})

test_that("radar rejects missing axis", {
  df <- data.frame(value = c(80, 60))
  expect_error(
    myIO(df) |> addIoLayer("radar", label = "r", mapping = list(value = "value")),
    "axis"
  )
})

test_that("radar rejects missing value", {
  df <- data.frame(axis = c("A", "B"))
  expect_error(
    myIO(df) |> addIoLayer("radar", label = "r", mapping = list(axis = "axis")),
    "value"
  )
})

test_that("grouped radar stays one layer with group in its mapping (#146)", {
  rad <- data.frame(axis = rep(c("S", "P", "R"), 2), value = c(3, 5, 4, 4, 2, 5),
                    g = rep(c("A", "B"), each = 3))
  p <- myIO(rad) |>
    addIoLayer("radar", label = "r", mapping = list(axis = "axis", value = "value", group = "g"))
  layers <- p$x$config$layers
  expect_length(layers, 1)
  expect_equal(layers[[1]]$label, "r")
  expect_equal(layers[[1]]$mapping$group, "g")
  expect_length(layers[[1]]$data, 6)
  expect_setequal(vapply(layers[[1]]$data, function(row) row$g, character(1)), c("A", "B"))
})

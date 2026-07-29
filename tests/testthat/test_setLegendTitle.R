test_that("setLegendTitle stores a literal title in the layout config", {
  w <- myIO::myIO() |> myIO::setLegendTitle("Month")
  expect_identical(w$x$config$layout$legendTitle, "Month")
})

test_that("setLegendTitle(TRUE) records the derive-from-grouping flag", {
  w <- myIO::myIO() |> myIO::setLegendTitle(TRUE)
  expect_true(w$x$config$layout$legendTitle)
})

test_that("no legend title is the default and NULL clears one", {
  expect_null(myIO::myIO()$x$config$layout$legendTitle)
  w <- myIO::myIO() |> myIO::setLegendTitle("Month") |> myIO::setLegendTitle(NULL)
  expect_null(w$x$config$layout$legendTitle)
})

test_that("setLegendTitle rejects anything but a scalar string, TRUE or NULL", {
  expect_error(myIO::myIO() |> myIO::setLegendTitle(c("a", "b")),
               "single character string", fixed = TRUE)
  expect_error(myIO::myIO() |> myIO::setLegendTitle(3),
               "single character string", fixed = TRUE)
  expect_error(myIO::myIO() |> myIO::setLegendTitle(NA_character_),
               "single character string", fixed = TRUE)
})

test_that("setLegendTitle validates its widget argument like the other setters", {
  expect_error(myIO::setLegendTitle(list(), "Month"))
})

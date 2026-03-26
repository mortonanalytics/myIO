test_that("check_string passes for valid string", {
  expect_silent(myIO:::check_string("hello", "x", "fn"))
})

test_that("check_string rejects numeric", {
  expect_error(myIO:::check_string(123, "x", "fn"),
               'fn\\(\\): `x` must be a single character string, not numeric')
})

test_that("check_string rejects NULL", {
  expect_error(myIO:::check_string(NULL, "x", "fn"), "not NULL")
})

test_that("check_string rejects vector", {
  expect_error(myIO:::check_string(c("a", "b"), "x", "fn"), "length 2")
})

test_that("check_string rejects NA", {
  expect_error(myIO:::check_string(NA_character_, "x", "fn"), "not character")
})

test_that("check_number passes for valid number", {
  expect_silent(myIO:::check_number(42, "x", "fn"))
})

test_that("check_number rejects character", {
  expect_error(myIO:::check_number("abc", "x", "fn"),
               'fn\\(\\): `x` must be a single number, not character')
})

test_that("check_number rejects NULL", {
  expect_error(myIO:::check_number(NULL, "x", "fn"), "not NULL")
})

test_that("check_flag passes TRUE/FALSE", {
  expect_silent(myIO:::check_flag(TRUE, "x", "fn"))
  expect_silent(myIO:::check_flag(FALSE, "x", "fn"))
})

test_that("check_flag rejects non-logical", {
  expect_error(myIO:::check_flag(1, "x", "fn"), "must be TRUE or FALSE")
})

test_that("check_flag rejects NA", {
  expect_error(myIO:::check_flag(NA, "x", "fn"), "must be TRUE or FALSE")
})

test_that("check_choice passes valid choice", {
  expect_silent(myIO:::check_choice("xy", c("xy", "x", "y"), "d", "fn"))
})

test_that("check_choice rejects invalid choice with context", {
  expect_error(myIO:::check_choice("z", c("xy", "x", "y"), "direction", "setBrush"),
               'setBrush\\(\\): `direction` must be "xy", "x", "y", not "z"')
})

test_that("check_choice prevents partial matching", {
  expect_error(myIO:::check_choice("h", c("highlight", "export"), "on_select", "setBrush"),
               'not "h"')
})

test_that("check_class passes correct class", {
  w <- myIO()
  expect_silent(myIO:::check_class(w, "myIO", "myIO", "fn"))
})

test_that("check_class rejects wrong class", {
  expect_error(myIO:::check_class(list(), "SharedData", "shared_data", "setLinked"),
               'setLinked\\(\\): `shared_data` must be a SharedData object, not list')
})

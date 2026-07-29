test_that("order_group_values sorts characters in the C locale", {
  expect_equal(myIO:::order_group_values(c("b", "A", "a", "B")), c("A", "B", "a", "b"))
})

test_that("order_group_values honours factor levels, not labels", {
  f <- factor(c("mid", "low", "high"), levels = c("low", "mid", "high"))
  expect_equal(as.character(myIO:::order_group_values(f)), c("low", "mid", "high"))
})

test_that("order_group_values sorts numerics numerically and puts NA last", {
  expect_equal(myIO:::order_group_values(c(10, 2, 33)), c(2, 10, 33))
  expect_equal(myIO:::order_group_values(c("b", NA, "a")), c("a", "b", NA))
})

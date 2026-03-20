test_that("is_composite returns false for primitive and unknown types", {
  expect_false(myIO:::is_composite("line"))
  expect_false(myIO:::is_composite("banana"))
})

test_that("expandComposite errors on unknown composite type", {
  expect_error(
    myIO:::expandComposite("banana", data.frame(), list(), "label", NULL, list()),
    "Unknown composite type"
  )
})

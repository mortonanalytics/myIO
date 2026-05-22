test_that("LLM tool helpers expose generated schema surfaces", {
  expect_true("point" %in% myIO::myio_list_chart_types())
  expect_true("fan" %in% myIO::myio_list_chart_types())
  expect_equal(myIO::myio_chart_schema("boxplot")$kind, "composite")
  expect_true("setAxisFormat" %in% myIO::myio_list_functions())
  expect_equal(
    myIO::myio_function_signature("setAxisFormat"),
    c("myIO", "xAxis", "yAxis", "toolTip", "xLabel", "yLabel")
  )
})

test_that("R validator matches the shared conformance corpus", {
  fixture_path <- if (file.exists("tests/fixtures/validate-conformance.json")) {
    "tests/fixtures/validate-conformance.json"
  } else {
    "../fixtures/validate-conformance.json"
  }
  corpus <- jsonlite::fromJSON(
    paste(readLines(fixture_path, warn = FALSE), collapse = "\n"),
    simplifyVector = FALSE
  )

  run_case <- function(item) {
    if (identical(item$tool, "validate_spec")) {
      return(do.call(myIO::myio_validate_spec, list(spec = item$input)))
    }
    if (identical(item$tool, "validate_call")) {
      return(myIO::myio_validate_call(item$input$fn, item$input$args))
    }
    stop("Unknown corpus tool: ", item$tool)
  }

  for (item in corpus) {
    result <- run_case(item)
    expect_identical(result$valid, item$valid, info = item$name)
    expected_codes <- unlist(item$error_codes, use.names = FALSE)
    if (is.null(expected_codes)) expected_codes <- character(0)
    expect_equal(
      vapply(result$errors, `[[`, character(1), "code"),
      expected_codes,
      info = item$name
    )
    suggestions <- vapply(result$errors, function(err) {
      if (is.null(err$suggestion)) "" else err$suggestion
    }, character(1))
    for (target in item$suggestion_targets) {
      expect_true(target %in% suggestions, info = item$name)
    }
  }
})

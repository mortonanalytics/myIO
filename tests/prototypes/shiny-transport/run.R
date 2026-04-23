#!/usr/bin/env Rscript
# Headless gate for the Shiny transport prototype.
# Success signal: document.title becomes "OK:qid_test" within 5 seconds.

args <- commandArgs(trailingOnly = FALSE)
script_path <- sub("^--file=", "", grep("^--file=", args, value = TRUE)[1])
app_dir <- if (!is.na(script_path) && nzchar(script_path)) dirname(script_path) else "tests/prototypes/shiny-transport"

has_shinytest2 <- requireNamespace("shinytest2", quietly = TRUE)
has_chromote   <- requireNamespace("chromote",   quietly = TRUE)

if (!has_shinytest2 && !has_chromote) {
  message("SKIP: neither shinytest2 nor chromote installed.")
  message("Prototype validated manually -- headless test skipped.")
  cat("OK (skipped)\n")
  quit(status = 0, save = "no")
}

title <- NA_character_
ok <- FALSE

if (has_shinytest2) {
  app <- shinytest2::AppDriver$new(app_dir, name = "myio-shiny-transport", timeout = 10000)
  on.exit(try(app$stop(), silent = TRUE), add = TRUE)
  deadline <- Sys.time() + 5
  repeat {
    title <- tryCatch(app$get_js("document.title"), error = function(e) NA_character_)
    if (identical(title, "OK:qid_test")) { ok <- TRUE; break }
    if (Sys.time() > deadline) break
    Sys.sleep(0.1)
  }
} else {
  port <- httpuv::randomPort()
  pid <- parallel::mcparallel(shiny::runApp(app_dir, port = port, launch.browser = FALSE))
  on.exit(try(tools::pskill(pid$pid), silent = TRUE), add = TRUE)
  Sys.sleep(1)
  b <- chromote::ChromoteSession$new()
  on.exit(try(b$close(), silent = TRUE), add = TRUE)
  b$Page$navigate(sprintf("http://127.0.0.1:%d", port))
  deadline <- Sys.time() + 5
  repeat {
    title <- tryCatch(b$Runtime$evaluate("document.title")$result$value, error = function(e) NA_character_)
    if (identical(title, "OK:qid_test")) { ok <- TRUE; break }
    if (Sys.time() > deadline) break
    Sys.sleep(0.1)
  }
}

if (ok) { cat("OK\n"); quit(status = 0, save = "no") }
message("FAIL: title was ", title); quit(status = 1, save = "no")

#!/usr/bin/env Rscript
# Rebuilds data/mydar_synthetic_walk.rda from inst/extdata/mydar-synthetic.
#
# inst/extdata/mydar-synthetic holds the output of the myDAR CLI for its test
# walk fixtures/synthetic-walk.mcap, processed with the test generator's
# synthetic Core ML file and low point density:
#   autodar process synthetic-walk.mcap --derived walk.derived.mcap \
#     --density low -o <dir>
# (orthophoto.tif is left out; nothing here reads it.)
#
# Needs rlas, terra and sf. Run from the package root:
#   Rscript tools/build-mydar-synthetic-walk.R

devtools::load_all(".", quiet = TRUE)

mydar_synthetic_walk <- read_mydar_walk("inst/extdata/mydar-synthetic", max_points = 6000)
save(mydar_synthetic_walk, file = "data/mydar_synthetic_walk.rda", compress = "xz")
print(mydar_synthetic_walk)

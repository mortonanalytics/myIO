# myIO
Open Source Project to illustrate `R` + `d3.js` DOM manipulation and plotting

# Overview
This project is intended to illustrate the power of using `R` and `d3.js` together in Shiny applications. It utilizes the `htmlwidgets` 
library to create visualizations in the browser.  Ultimately, I'd like to create divs with data driven CSS as well - but I'll start with
plots.  Feel free to use and contribute! **I would not use it for production unless you fork your own copy - as I reserve the right to make
breaking changes.**

# Make a plot
You'll use two functions to make a plot: `myio() %>% addLayer()`

# `addIoLayer()`
This function takes the follwing arguments:

`type` is a character string of the plot primitive you intend to use, e.g. "line" or "point"
`color` is a character string of an CSS recognized color
`label` is a character string providing a unique namespace for the plot layer
`data` is a dataframe object
`mapping` is a list of variable to map from the dataframe to the plot, e.g. `x_var`, `y_var`

Plot away! ~ Ryan

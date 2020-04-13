#
# This is a Shiny web application. You can run the application by clicking
# the 'Run App' button above.
#
# Find out more about building applications with Shiny here:
#
#    http://shiny.rstudio.com/
#

library(shiny)
library(dplyr)
library(myIO)
library(viridis)

# Define UI for application that draws a histogram
ui <- fluidPage(

    # Application title
    titlePanel("Old Faithful Geyser Data"),

    # Sidebar with a slider input for number of bins
    sidebarLayout(
        sidebarPanel(width = 1
        ),

        # Show a plot of the generated distribution
        mainPanel(
           myIOOutput("distPlot")
        )
    )
)

# Define server logic required to draw a histogram
server <- function(input, output) {

    output$distPlot <- renderMyIO({
        df <- datasets::airquality %>%
            mutate(Month = paste0("M", Month),
                   Temp_low = Temp * c(0.8,0.9,0.75),
                   Temp_high = Temp * c(1.2,1.1,1.3)) %>%
            group_by(Day) %>%
            mutate(Percent = Temp/sum(Temp)) %>%
            ungroup()

        colors <- substr(viridis(5), 1, 7)

        myIO()%>%
            addIoLayer(type = "line",
                       color = colors,
                       label = "Month",
                       data = df ,
                       mapping = list(
                           x_var = "Day",
                           y_var = "Temp",
                           #low_y = "Temp_low",
                           #high_y = "Temp_high",
                           group = "Month"
                       )) %>%
            setAxisFormat(yAxis = ".0f")
    })
}

# Run the application
shinyApp(ui = ui, server = server)

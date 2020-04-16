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
        sidebarPanel(width = 12,
                     sliderInput("slider", "Slide to alter", min = 1, max = 10, value = 5),
                     checkboxGroupInput("group", "which groups to include", choices = 1:5, selected = 1:5)
        ),

        # Show a plot of the generated distribution
        mainPanel(width = 12,
           myIOOutput("distPlot",width = "100%")
        )
    )
)

# Define server logic required to draw a histogram
server <- function(input, output) {

    output$distPlot <- renderMyIO({
        rando <- rnorm(31, mean = 0, sd = input$slider / 3)

        df <- datasets::airquality %>%
            mutate(Month = paste0("This Is the Month of ", Month),
                   Temp_low = Temp * c(0.8,0.9,0.75),
                   Temp_high = Temp * c(1.2,1.1,1.3)) %>%
            group_by(Day) %>%
            mutate(Percent = Temp/sum(Temp)) %>%
            ungroup() %>%
            mutate(Day2 = Day * rando[Day] )

        colors <- substr(viridis(5), 1, 7)

        groupsAre <- unlist(unique(df$Month))[ as.numeric(input$group) ]
        print(groupsAre)

        df <- df %>%
            filter(Month %in% groupsAre)

        myIO()%>%
            addIoLayer(type = "point",
                       color = colors,
                       label = "Month",
                       data = df ,
                       mapping = list(
                           x_var = "Day2",
                           y_var = "Temp",
                           low_y = "Temp_low",
                           high_y = "Temp_high",
                           group = "Month"
                       )) %>%
            setAxisFormat(yAxis = ".0f")
    })
}

# Run the application
shinyApp(ui = ui, server = server)

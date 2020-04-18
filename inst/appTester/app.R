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
                     sliderInput("slider", "Slide to alter", min = 1, max = 10, value = 5, step = 0.2),
                     checkboxGroupInput("group", "which groups to include", choices = 1:5, selected = 1:5)
        ),

        # Show a plot of the generated distribution
        mainPanel(width = 12,
           column(6,myIOOutput("donut",width = "100%", height = "350px")),
           column(6, myIOOutput("distPlot", width = "100%", height = "350px")),
           column(6, myIOOutput("gauge", width = "100%", height = "250px"))
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
                           # low_y = "Temp_low",
                           # high_y = "Temp_high",
                           group = "Month"
                       )) %>%
            setAxisFormat(xAxis = ".2f",yAxis = ".0f")

    })

    output$donut <- renderMyIO({

        rando <- rnorm(3, mean = input$slider, sd = input$slider / 3)

        df_donut <- data.frame(x = c("First", "Second", "Third"),
                               y = c(10, 9,8) *rando,
                               stringsAsFactors = FALSE)

        myIO() %>%
            addIoLayer(
                type = "donut",
                color = c("steelblue", "red", "orange"),
                label = "donut",
                data = df_donut,
                mapping = list(
                    x_var = "x",
                    y_var = "y"
                )
            )
    })

    output$gauge <- renderMyIO({
        myIO() %>%
            addIoLayer(
                type = "gauge",
                color = "steelblue",
                label = "gauge",
                data = data.frame(value = input$slider / 10),
                mapping = list(value = "value")

            )
    })
}

# Run the application
shinyApp(ui = ui, server = server)

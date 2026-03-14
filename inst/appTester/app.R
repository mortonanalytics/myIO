library(shiny)
library(dplyr)
library(myIO)

ui <- fluidPage(
  titlePanel("myIO Chart Gallery"),
  tabsetPanel(
    tabPanel("Grouped Bar",
      fluidRow(
        column(4, sliderInput("gb_scale", "Temperature Scale", min = 0.5, max = 2, value = 1, step = 0.1)),
        column(4, checkboxGroupInput("gb_months", "Months", choices = 5:9, selected = 5:9, inline = TRUE))
      ),
      myIOOutput("groupedBar", height = "400px")
    ),
    tabPanel("Line",
      fluidRow(
        column(4, sliderInput("line_scale", "Temperature Scale", min = 0.5, max = 2, value = 1, step = 0.1))
      ),
      myIOOutput("linePlot", height = "400px")
    ),
    tabPanel("Point + LM",
      myIOOutput("pointPlot", height = "400px")
    ),
    tabPanel("Bar",
      myIOOutput("barPlot", height = "400px")
    ),
    tabPanel("Horizontal Bar",
      myIOOutput("hbarPlot", height = "400px")
    ),
    tabPanel("Area",
      myIOOutput("areaPlot", height = "400px")
    ),
    tabPanel("Histogram",
      fluidRow(
        column(4, sliderInput("hist_n", "Sample size", min = 50, max = 500, value = 200, step = 50))
      ),
      myIOOutput("histPlot", height = "400px")
    ),
    tabPanel("Donut",
      fluidRow(
        column(4, sliderInput("donut_scale", "Scale", min = 0.5, max = 3, value = 1, step = 0.25))
      ),
      myIOOutput("donutPlot", height = "400px")
    ),
    tabPanel("Gauge",
      fluidRow(
        column(4, sliderInput("gauge_val", "Value", min = 0, max = 1, value = 0.65, step = 0.05))
      ),
      myIOOutput("gaugePlot", height = "300px")
    ),
    tabPanel("Treemap",
      myIOOutput("treemapPlot", height = "450px")
    ),
    tabPanel("Hexbin",
      myIOOutput("hexbinPlot", height = "400px")
    ),
    tabPanel("Theme Demo",
      myIOOutput("themePlot", height = "400px")
    )
  )
)

server <- function(input, output) {

  # --- Grouped Bar ---
  output$groupedBar <- renderMyIO({
    df <- datasets::airquality %>%
      mutate(Month = as.character(Month)) %>%
      filter(Month %in% input$gb_months)

    df$Temp <- df$Temp * input$gb_scale

    myIO() %>%
      addIoLayer(
        type = "groupedBar",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temperature by Month",
        data = df,
        mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
      ) %>%
      setAxisLimits(ylim = list(min = 0, max = 200)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)")
  })

  # --- Line ---
  output$linePlot <- renderMyIO({
    df <- datasets::airquality %>%
      mutate(Month = as.character(Month))

    df$Temp <- df$Temp * input$line_scale

    myIO() %>%
      addIoLayer(
        type = "line",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temp",
        data = df,
        mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
      ) %>%
      setAxisLimits(ylim = list(min = 0, max = 200)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature")
  })

  # --- Point + Linear Model ---
  output$pointPlot <- renderMyIO({
    df <- datasets::mtcars %>%
      mutate(wt_col = wt, mpg_col = mpg)

    myIO() %>%
      addIoLayer(
        type = "point",
        color = "#4E79A7",
        label = "Cars",
        data = df,
        mapping = list(x_var = "wt", y_var = "mpg")
      ) %>%
      addIoStatLayer(
        type = "lm",
        color = "#E15759",
        label = "Linear Fit",
        data = df,
        mapping = list(x_var = "wt", y_var = "mpg")
      ) %>%
      setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon")
  })

  # --- Bar ---
  output$barPlot <- renderMyIO({
    df <- data.frame(
      category = c("Alpha", "Beta", "Gamma", "Delta", "Epsilon"),
      value = c(42, 87, 63, 29, 55),
      stringsAsFactors = FALSE
    )

    myIO() %>%
      addIoLayer(
        type = "bar",
        color = "#59A14F",
        label = "Values",
        data = df,
        mapping = list(x_var = "category", y_var = "value")
      ) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(yAxis = ".0f", xLabel = "Category", yLabel = "Value")
  })

  # --- Horizontal Bar (flipped) ---
  output$hbarPlot <- renderMyIO({
    df <- data.frame(
      region = c("North", "South", "East", "West", "Central"),
      sales = c(320, 475, 290, 510, 380),
      stringsAsFactors = FALSE
    )

    myIO() %>%
      addIoLayer(
        type = "bar",
        color = "#F28E2B",
        label = "Sales",
        data = df,
        mapping = list(x_var = "region", y_var = "sales")
      ) %>%
      defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
      flipAxis() %>%
      setAxisFormat(xAxis = ".0f", xLabel = "Sales ($K)", yLabel = "Region")
  })

  # --- Area ---
  output$areaPlot <- renderMyIO({
    set.seed(1)
    months <- 1:12
    base <- cumsum(runif(12, 10, 30))
    df <- data.frame(
      month = rep(months, 2),
      low = c(base * 0.85, base * 0.5),
      high = c(base * 1.15, base * 0.8),
      band = rep(c("Optimistic", "Conservative"), each = 12),
      stringsAsFactors = FALSE
    )

    myIO() %>%
      addIoLayer(
        type = "area",
        color = c("#4E79A7", "#F28E2B"),
        label = "Forecast",
        data = df,
        mapping = list(x_var = "month", low_y = "low", high_y = "high", group = "band")
      ) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Month", yLabel = "Revenue")
  })

  # --- Histogram ---
  output$histPlot <- renderMyIO({
    df <- data.frame(value = rnorm(input$hist_n, mean = 50, sd = 15))

    myIO() %>%
      addIoLayer(
        type = "histogram",
        color = "#76B7B2",
        label = "Distribution",
        data = df,
        mapping = list(value = "value")
      ) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Value", yLabel = "Count")
  })

  # --- Donut ---
  output$donutPlot <- renderMyIO({
    df <- data.frame(
      segment = c("Desktop", "Mobile", "Tablet", "Other"),
      traffic = c(45, 35, 15, 5) * input$donut_scale,
      stringsAsFactors = FALSE
    )

    myIO() %>%
      addIoLayer(
        type = "donut",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
        label = "Traffic",
        data = df,
        mapping = list(x_var = "segment", y_var = "traffic")
      )
  })

  # --- Gauge ---
  output$gaugePlot <- renderMyIO({
    myIO() %>%
      addIoLayer(
        type = "gauge",
        color = "#E15759",
        label = "Completion",
        data = data.frame(value = input$gauge_val),
        mapping = list(value = "value")
      ) %>%
      suppressAxis(xAxis = TRUE, yAxis = TRUE) %>%
      suppressLegend()
  })

  # --- Treemap ---
  output$treemapPlot <- renderMyIO({
    df <- data.frame(
      department = c("Eng", "Eng", "Eng", "Sales", "Sales", "Marketing", "Marketing", "Marketing"),
      team = c("Frontend", "Backend", "Infra", "Enterprise", "SMB", "Content", "Paid", "Brand"),
      headcount = c(25, 30, 15, 20, 18, 12, 10, 8),
      stringsAsFactors = FALSE
    )

    myIO() %>%
      addIoLayer(
        type = "treemap",
        color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Org Chart",
        data = df,
        mapping = list(level_1 = "department", level_2 = "team", y_var = "headcount", x_var = "team")
      )
  })

  # --- Hexbin ---
  output$hexbinPlot <- renderMyIO({
    set.seed(42)
    df <- data.frame(
      x = c(rnorm(200, 3, 1), rnorm(200, 7, 1.5)),
      y = c(rnorm(200, 5, 1), rnorm(200, 8, 1.2))
    )

    myIO() %>%
      addIoLayer(
        type = "hexbin",
        color = "#4E79A7",
        label = "Density",
        data = df,
        mapping = list(x_var = "x", y_var = "y", radius = 20)
      ) %>%
      setAxisFormat(xLabel = "X", yLabel = "Y")
  })

  # --- Theme Demo ---
  output$themePlot <- renderMyIO({
    df <- datasets::mtcars %>%
      mutate(cyl = as.character(cyl))

    myIO() %>%
      addIoLayer(
        type = "point",
        color = c("#FF6B6B", "#4ECDC4", "#45B7D1"),
        label = "MPG by HP",
        data = df,
        mapping = list(x_var = "hp", y_var = "mpg", group = "cyl")
      ) %>%
      setTheme(text_color = "#e0e0e0", grid_color = "#333333", bg = "#1a1a2e", font = "monospace") %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG") %>%
      setReferenceLines(yRef = mean(df$mpg))
  })
}

shinyApp(ui = ui, server = server)

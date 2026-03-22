library(shiny)
library(dplyr)
library(myIO)

# -- Proxy auth filter ----------------------------------------------------
proxy_secret <- Sys.getenv("PROXY_SECRET", "")

auth_filter <- function(req) {
  # Temporarily disabled for debugging — allow all requests
  NULL
}

# -- UI ------------------------------------------------------------------
ui <- navbarPage(
  title = tags$span(
    img(src = "logo.png", height = "28px", style = "margin-right: 8px; margin-top: -3px;"),
    "myIO"
  ),
  id = "nav",
  theme = bslib::bs_theme(version = 5, primary = "#4A5ACB", bg = "#ffffff", fg = "#212529"),
  header = tags$head(tags$style(HTML("
    .navbar { background-color: #1a1a2e !important; }
    .navbar .navbar-brand, .navbar .nav-link { color: rgba(255,255,255,0.85) !important; }
    .navbar .nav-link:hover, .navbar .nav-link.active { color: #fff !important; }
    .feature-card { border: 1px solid #dee2e6; border-radius: 8px; padding: 1.5rem; text-align: center; }
    .feature-card h4 { color: #4A5ACB; margin-top: 0.75rem; }
    .chart-container { padding: 1rem; }
  "))),

  # -- Home tab --
  tabPanel("Home",
    icon = icon("house"),
    div(
      class = "container",
      style = "max-width: 900px; margin: 0 auto; padding-top: 2rem;",
      div(
        style = "text-align: center; margin-bottom: 2rem;",
        img(src = "logo.png", height = "120px"),
        h1("myIO Chart Gallery", style = "margin-top: 1rem; font-weight: 700;"),
        p(class = "lead", style = "color: #6c757d;",
          "Interactive D3.js visualizations, built entirely in R.")
      ),
      fluidRow(
        column(4, div(class = "feature-card",
          icon("layer-group", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("18 Chart Types"),
          p("Scatter, line, bar, grouped bar, area, histogram,
             donut, gauge, treemap, hexbin, heatmap, candlestick,
             waterfall, sankey, boxplot, violin, ridgeline,
             and regression with CI bands.")
        )),
        column(4, div(class = "feature-card",
          icon("sliders", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("Statistical Transforms"),
          p("Built-in CI bands, LOESS smoothing, moving averages,
             mean \u00B1 CI error bars, and regression diagnostics.
             Composable and chainable.")
        )),
        column(4, div(class = "feature-card",
          icon("code", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("Minimal Code"),
          p("A publication-quality chart in 5-6 lines of R.
             No JavaScript required.")
        ))
      ),
      div(
        style = "text-align: center; margin-top: 2rem; margin-bottom: 2rem;",
        p("Use the tabs above to explore each chart type."),
        tags$a(href = "https://mortonanalytics.github.io/myIO/",
          class = "btn btn-outline-primary", target = "_blank",
          icon("book"), " Documentation"),
        tags$a(href = "https://github.com/mortonanalytics/myIO",
          class = "btn btn-outline-secondary ms-2", target = "_blank",
          icon("github"), " Source Code")
      )
    )
  ),

  # -- Basic Charts --
  navbarMenu("Basic Charts", icon = icon("chart-bar"),
    tabPanel("Bar",
      div(class = "chart-container", myIOOutput("barPlot", height = "500px"))
    ),
    tabPanel("Grouped Bar",
      fluidRow(
        column(3,
          wellPanel(
            sliderInput("gb_noise", "Noise", min = 0, max = 50, value = 0, step = 5),
            checkboxGroupInput("gb_months", "Months", choices = 5:9, selected = 5:9, inline = TRUE)
          )
        ),
        column(9, myIOOutput("groupedBar", height = "500px"))
      )
    ),
    tabPanel("Horizontal Bar",
      div(class = "chart-container", myIOOutput("hbarPlot", height = "500px"))
    ),
    tabPanel("Line",
      fluidRow(
        column(3,
          wellPanel(sliderInput("line_noise", "Noise", min = 0, max = 50, value = 0, step = 5))
        ),
        column(9, myIOOutput("linePlot", height = "500px"))
      )
    ),
    tabPanel("Area",
      div(class = "chart-container", myIOOutput("areaPlot", height = "500px"))
    )
  ),

  # -- Statistical --
  navbarMenu("Statistical", icon = icon("chart-line"),
    tabPanel("Scatter + Trend",
      div(class = "chart-container", myIOOutput("pointPlot", height = "500px"))
    ),
    tabPanel("Regression + CI",
      fluidRow(
        column(3,
          wellPanel(
            selectInput("reg_method", "Method",
              choices = c("Linear" = "lm", "LOESS" = "loess", "Polynomial" = "polynomial")),
            sliderInput("reg_level", "Confidence Level", min = 0.80, max = 0.99, value = 0.95, step = 0.01),
            selectInput("reg_interval", "Interval Type",
              choices = c("Confidence" = "confidence", "Prediction" = "prediction"))
          )
        ),
        column(9, myIOOutput("regressionPlot", height = "500px"))
      )
    ),
    tabPanel("LOESS Smoothing",
      fluidRow(
        column(3,
          wellPanel(sliderInput("loess_span", "Span", min = 0.1, max = 1.0, value = 0.5, step = 0.05))
        ),
        column(9, myIOOutput("loessPlot", height = "500px"))
      )
    ),
    tabPanel("Mean \u00B1 CI",
      div(class = "chart-container", myIOOutput("meanCIPlot", height = "500px"))
    ),
    tabPanel("Moving Average",
      fluidRow(
        column(3,
          wellPanel(
            selectInput("ma_method", "Method", choices = c("Simple MA" = "sma", "Exponential MA" = "ema")),
            conditionalPanel("input.ma_method == 'sma'",
              sliderInput("ma_window", "Window", min = 3, max = 30, value = 10, step = 1)),
            conditionalPanel("input.ma_method == 'ema'",
              sliderInput("ma_alpha", "Alpha", min = 0.05, max = 0.5, value = 0.2, step = 0.05))
          )
        ),
        column(9, myIOOutput("movingAvgPlot", height = "500px"))
      )
    ),
    tabPanel("Residuals",
      div(class = "chart-container", myIOOutput("residualPlot", height = "500px"))
    ),
    tabPanel("Histogram",
      fluidRow(
        column(3,
          wellPanel(sliderInput("hist_n", "Sample size", min = 50, max = 500, value = 200, step = 50))
        ),
        column(9, myIOOutput("histPlot", height = "500px"))
      )
    ),
    tabPanel("Hexbin Density",
      div(class = "chart-container", myIOOutput("hexbinPlot", height = "500px"))
    )
  ),

  # -- Specialized --
  navbarMenu("Specialized", icon = icon("shapes"),
    tabPanel("Donut",
      fluidRow(
        column(3,
          wellPanel(sliderInput("donut_noise", "Noise", min = 0, max = 30, value = 0, step = 5))
        ),
        column(9, myIOOutput("donutPlot", height = "500px"))
      )
    ),
    tabPanel("Gauge",
      fluidRow(
        column(3,
          wellPanel(sliderInput("gauge_val", "Value", min = 0, max = 1, value = 0.65, step = 0.05))
        ),
        column(9, myIOOutput("gaugePlot", height = "400px"))
      )
    ),
    tabPanel("Treemap",
      div(class = "chart-container", myIOOutput("treemapPlot", height = "550px"))
    )
  ),

  # -- Financial --
  navbarMenu("Financial", icon = icon("chart-line"),
    tabPanel("Candlestick",
      div(class = "chart-container", myIOOutput("candlestickPlot", height = "500px"))
    ),
    tabPanel("Waterfall",
      div(class = "chart-container", myIOOutput("waterfallPlot", height = "500px"))
    )
  ),

  # -- Distribution --
  navbarMenu("Distribution", icon = icon("chart-area"),
    tabPanel("Boxplot",
      div(class = "chart-container", myIOOutput("boxplotPlot", height = "500px"))
    ),
    tabPanel("Violin",
      div(class = "chart-container", myIOOutput("violinPlot", height = "500px"))
    ),
    tabPanel("Ridgeline",
      div(class = "chart-container", myIOOutput("ridgelinePlot", height = "500px"))
    )
  ),

  # -- Relational --
  navbarMenu("Relational", icon = icon("diagram-project"),
    tabPanel("Heatmap",
      div(class = "chart-container", myIOOutput("heatmapPlot", height = "500px"))
    ),
    tabPanel("Sankey",
      div(class = "chart-container", myIOOutput("sankeyPlot", height = "500px"))
    )
  ),

  # -- Theme Demo --
  tabPanel("Theme Demo",
    icon = icon("palette"),
    div(class = "chart-container", myIOOutput("themePlot", height = "500px"))
  )
)

# -- Server --------------------------------------------------------------
server <- function(input, output) {

  output$barPlot <- renderMyIO({
    df <- data.frame(
      language = c("Python", "JavaScript", "Java", "R", "Go"),
      postings = c(87, 63, 55, 42, 29), stringsAsFactors = FALSE)
    myIO() %>%
      addIoLayer(type = "bar", color = "#59A14F", label = "Job Postings",
        data = df, mapping = list(x_var = "language", y_var = "postings")) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(yAxis = ".0f", xLabel = "Language", yLabel = "Job Postings (K)")
  })

  output$groupedBar <- renderMyIO({
    df <- datasets::airquality %>%
      mutate(Month = as.character(Month)) %>%
      filter(Month %in% input$gb_months)
    df$Temp <- df$Temp + runif(nrow(df), -input$gb_noise, input$gb_noise)
    myIO() %>%
      addIoLayer(type = "groupedBar",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temperature by Month",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")) %>%
      setAxisLimits(ylim = list(min = 0)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)")
  })

  output$hbarPlot <- renderMyIO({
    df <- data.frame(
      region = c("North", "South", "East", "West", "Central"),
      sales = c(320, 475, 290, 510, 380), stringsAsFactors = FALSE)
    myIO() %>%
      addIoLayer(type = "bar", color = "#F28E2B", label = "Sales",
        data = df, mapping = list(x_var = "region", y_var = "sales")) %>%
      defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
      flipAxis() %>%
      setAxisFormat(xAxis = ".0f", xLabel = "Sales ($K)", yLabel = "Region")
  })

  output$linePlot <- renderMyIO({
    df <- datasets::airquality %>% mutate(Month = as.character(Month))
    df$Temp <- df$Temp + runif(nrow(df), -input$line_noise, input$line_noise)
    myIO() %>%
      addIoLayer(type = "line",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temp",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)")
  })

  output$areaPlot <- renderMyIO({
    set.seed(1)
    months_seq <- 1:12
    base <- cumsum(runif(12, 10, 30))
    df <- data.frame(
      month = rep(months_seq, 2), low = c(base * 0.85, base * 0.5),
      high = c(base * 1.15, base * 0.8),
      band = rep(c("Optimistic", "Conservative"), each = 12), stringsAsFactors = FALSE)
    myIO() %>%
      addIoLayer(type = "area", color = c("#4E79A7", "#F28E2B"), label = "Forecast",
        data = df, mapping = list(x_var = "month", low_y = "low", high_y = "high", group = "band")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Month", yLabel = "Revenue")
  })

  output$pointPlot <- renderMyIO({
    df <- datasets::mtcars
    myIO() %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Cars",
        data = df, mapping = list(x_var = "wt", y_var = "mpg")) %>%
      addIoLayer(type = "line", transform = "lm", color = "#E15759", label = "Linear Fit",
        data = df, mapping = list(x_var = "wt", y_var = "mpg")) %>%
      setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon")
  })

  output$histPlot <- renderMyIO({
    set.seed(42)
    n <- input$hist_n
    df <- data.frame(value = c(rnorm(n %/% 2, mean = 35, sd = 8),
                                rnorm(n - n %/% 2, mean = 65, sd = 10)))
    myIO() %>%
      addIoLayer(type = "histogram", color = "#76B7B2", label = "Distribution",
        data = df, mapping = list(value = "value")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Response Time (ms)", yLabel = "Frequency")
  })

  output$hexbinPlot <- renderMyIO({
    set.seed(42)
    df <- data.frame(
      x = c(rnorm(200, 3, 1), rnorm(200, 7, 1.5)),
      y = c(rnorm(200, 5, 1), rnorm(200, 8, 1.2)))
    myIO() %>%
      addIoLayer(type = "hexbin", color = "#4E79A7", label = "Density",
        data = df, mapping = list(x_var = "x", y_var = "y", radius = 20)) %>%
      setAxisFormat(xLabel = "Height (in)", yLabel = "Weight (lbs)")
  })

  output$donutPlot <- renderMyIO({
    df <- data.frame(
      segment = c("Desktop", "Mobile", "Tablet", "Other"),
      traffic = pmax(1, c(45, 35, 15, 5) + runif(4, -input$donut_noise, input$donut_noise)),
      stringsAsFactors = FALSE)
    myIO() %>%
      addIoLayer(type = "donut", color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
        label = "Traffic",
        data = df, mapping = list(x_var = "segment", y_var = "traffic"))
  })

  output$gaugePlot <- renderMyIO({
    myIO() %>%
      addIoLayer(type = "gauge", color = "#E15759", label = "Completion",
        data = data.frame(value = input$gauge_val),
        mapping = list(value = "value")) %>%
      suppressAxis(xAxis = TRUE, yAxis = TRUE) %>%
      suppressLegend()
  })

  output$treemapPlot <- renderMyIO({
    df <- data.frame(
      department = c("Engineering", "Engineering", "Engineering", "Sales", "Sales", "Marketing", "Marketing", "Marketing"),
      team = c("Frontend", "Backend", "Infra", "Enterprise", "SMB", "Content", "Paid", "Brand"),
      headcount = c(25, 30, 15, 20, 18, 12, 10, 8), stringsAsFactors = FALSE)
    myIO() %>%
      addIoLayer(type = "treemap", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Headcount by Department",
        data = df, mapping = list(level_1 = "department", level_2 = "team", y_var = "headcount", x_var = "team"))
  })

  output$heatmapPlot <- renderMyIO({
    df <- expand.grid(
      x = c("Q1", "Q2", "Q3", "Q4"),
      y = c("Basic", "Pro", "Enterprise"),
      stringsAsFactors = FALSE
    )
    df$value <- c(12, 15, 22, 30, 5, 8, 14, 25, 2, 3, 6, 18)
    myIO() %>%
      addIoLayer(type = "heatmap", color = "#4E79A7", label = "Signups",
        data = df, mapping = list(x_var = "x", y_var = "y", value = "value")) %>%
      defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE) %>%
      setAxisFormat(xLabel = "Quarter", yLabel = "Tier")
  })

  output$candlestickPlot <- renderMyIO({
    set.seed(42)
    n <- 30
    prices <- numeric(n)
    prices[1] <- 100
    for (i in 2:n) prices[i] <- prices[i - 1] + rnorm(1, mean = 0.3, sd = 2)
    df <- data.frame(
      day = 1:n,
      open = prices + runif(n, -1, 1),
      close = prices + runif(n, -1, 1),
      stringsAsFactors = FALSE
    )
    df$high <- pmax(df$open, df$close) + abs(rnorm(n, 0, 1.5))
    df$low <- pmin(df$open, df$close) - abs(rnorm(n, 0, 1.5))
    myIO() %>%
      addIoLayer(type = "candlestick", color = "#59A14F", label = "ACME Corp",
        data = df, mapping = list(x_var = "day", open = "open", high = "high", low = "low", close = "close")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Trading Day", yLabel = "Price")
  })

  output$waterfallPlot <- renderMyIO({
    df <- data.frame(
      step = c("Start", "Add Sales", "Discount", "Tax", "End"),
      value = c(100, 35, -15, -10, NA),
      total = c(FALSE, FALSE, FALSE, FALSE, TRUE),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(type = "waterfall", color = "#F28E2B", label = "Revenue Bridge",
        data = df, mapping = list(x_var = "step", y_var = "value", total = "total")) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(yAxis = "$,.0f", xLabel = "Step", yLabel = "Running Total")
  })

  output$sankeyPlot <- renderMyIO({
    df <- data.frame(
      source = c("Organic", "Organic", "Paid", "Paid", "Referral",
                  "Trial", "Trial", "Trial", "Demo", "Demo",
                  "Converted", "Converted"),
      target = c("Trial", "Bounce", "Trial", "Demo", "Trial",
                  "Converted", "Churned", "Demo", "Converted", "Lost",
                  "Annual", "Monthly"),
      value = c(40, 15, 25, 10, 20,
                30, 25, 30, 25, 15,
                35, 20),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(type = "sankey",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
                  "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
                  "#4E79A7", "#F28E2B"),
        label = "Acquisition Funnel",
        data = df, mapping = list(source = "source", target = "target", value = "value"))
  })

  output$boxplotPlot <- renderMyIO({
    myIO() %>%
      addIoLayer(type = "boxplot", color = "#4E79A7", label = "Sepal Length",
        data = iris, mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(showOutliers = TRUE)) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$violinPlot <- renderMyIO({
    myIO() %>%
      addIoLayer(type = "violin", color = "#59A14F", label = "Violin",
        data = iris, mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(showBox = TRUE, showMedian = TRUE, showPoints = FALSE)) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$ridgelinePlot <- renderMyIO({
    df <- datasets::mtcars
    df$cyl <- as.character(df$cyl)
    myIO() %>%
      addIoLayer(type = "ridgeline", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Ridgeline",
        data = df, mapping = list(x_var = "hp", y_var = "mpg", group = "cyl"),
        options = list(overlap = 0.5, bandwidth = "nrd0")) %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "Density")
  })

  output$regressionPlot <- renderMyIO({
    set.seed(42)
    day <- 1:40
    df <- data.frame(day = day, yield = 0.8 * day + sin(day) * 5 + rnorm(40, sd = 3))
    myIO(data = df) %>%
      addIoLayer(type = "regression", label = "Yield Model",
        mapping = list(x_var = "day", y_var = "yield"),
        options = list(
          method = input$reg_method,
          showCI = TRUE,
          level = input$reg_level,
          interval = input$reg_interval,
          showStats = (input$reg_method %in% c("lm", "polynomial")),
          degree = 3,
          span = 0.5
        )) %>%
      setAxisFormat(xLabel = "Day of Experiment", yLabel = "Yield (mg)")
  })

  output$loessPlot <- renderMyIO({
    set.seed(42)
    week <- 1:60
    df <- data.frame(
      week = week,
      reading = sin(seq(0, 4 * pi, length.out = 60)) * 10 + rnorm(60, sd = 2))
    myIO(data = df) %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Readings",
        mapping = list(x_var = "week", y_var = "reading")) %>%
      addIoLayer(type = "line", color = "#E15759", label = "LOESS Trend",
        transform = "loess",
        mapping = list(x_var = "week", y_var = "reading"),
        options = list(span = input$loess_span)) %>%
      addIoLayer(type = "area", color = "#E15759", label = "95% CI",
        transform = "ci",
        mapping = list(x_var = "week", y_var = "reading"),
        options = list(method = "loess", span = input$loess_span, level = 0.95)) %>%
      setAxisFormat(xLabel = "Week", yLabel = "Sensor Reading")
  })

  output$meanCIPlot <- renderMyIO({
    myIO(data = iris) %>%
      addIoLayer(type = "rangeBar", color = "#4E79A7", label = "Mean \u00B1 95% CI",
        transform = "mean_ci",
        mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(level = 0.95)) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$movingAvgPlot <- renderMyIO({
    set.seed(42)
    df <- data.frame(day = 1:100, price = cumsum(rnorm(100, mean = 0.2, sd = 1)) + 50)
    w <- myIO(data = df) %>%
      addIoLayer(type = "line", color = "#CCCCCC", label = "Daily Close",
        mapping = list(x_var = "day", y_var = "price"))
    if (input$ma_method == "sma") {
      w <- w %>%
        addIoLayer(type = "line", color = "#E15759", label = "Smoothed",
          transform = "smooth",
          mapping = list(x_var = "day", y_var = "price"),
          options = list(method = "sma", window = input$ma_window))
    } else {
      w <- w %>%
        addIoLayer(type = "line", color = "#E15759", label = "Smoothed",
          transform = "smooth",
          mapping = list(x_var = "day", y_var = "price"),
          options = list(method = "ema", alpha = input$ma_alpha))
    }
    w %>% setAxisFormat(xLabel = "Trading Day", yLabel = "Price ($)")
  })

  output$residualPlot <- renderMyIO({
    set.seed(42)
    x <- 1:40
    df <- data.frame(x = x, y = 0.05 * x^2 + rnorm(40, sd = 3))
    myIO(data = df) %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Residuals (lm on quadratic data)",
        transform = "residuals",
        mapping = list(x_var = "x", y_var = "y")) %>%
      setReferenceLines(yRef = 0) %>%
      setAxisFormat(xLabel = "Fitted Values", yLabel = "Residuals")
  })

  output$themePlot <- renderMyIO({
    df <- datasets::mtcars %>% mutate(cyl = as.character(cyl))
    myIO() %>%
      addIoLayer(type = "point", color = c("#FF6B6B", "#4ECDC4", "#45B7D1"),
        label = "MPG by HP",
        data = df, mapping = list(x_var = "hp", y_var = "mpg", group = "cyl")) %>%
      setTheme(text_color = "#e0e0e0", grid_color = "#333333", bg = "#1a1a2e", font = "monospace") %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG") %>%
      setReferenceLines(yRef = mean(df$mpg))
  })
}

shinyApp(ui = ui, server = server, options = list(filter = auth_filter))

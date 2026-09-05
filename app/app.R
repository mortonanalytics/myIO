library(shiny)
library(dplyr)
library(crosstalk)
library(myIO)

# -- UI ------------------------------------------------------------------
ui <- navbarPage(
  title = tags$span(
    img(src = "logo.png", height = "28px", style = "margin-right: 8px; margin-top: -3px;"),
    "myIO"
  ),
  id = "nav",
  collapsible = TRUE,
  theme = bslib::bs_theme(version = 5, primary = "#4A5ACB", bg = "#ffffff", fg = "#212529"),
  header = tags$head(tags$style(HTML("
    .navbar { background-color: #1a1a2e !important; }
    .navbar .navbar-brand, .navbar .nav-link { color: rgba(255,255,255,0.85) !important; }
    .navbar .nav-link:hover, .navbar .nav-link.active { color: #fff !important; }
    .navbar .navbar-toggler { color: #fff; border-color: rgba(255,255,255,0.5); }
    .navbar .navbar-toggler-icon { filter: brightness(0) invert(1); }
    .navbar .dropdown-toggle { border-bottom: 0 !important; }
    .navbar .nav-item > .nav-link.active { box-shadow: inset 0 -2px 0 #fff; }
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
        column(3, div(class = "feature-card",
          icon("layer-group", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("36 Chart Types"),
          p("Scatter, line, bar, grouped bar, area, histogram,
             donut, gauge, treemap, hexbin, heatmap, candlestick,
             waterfall, sankey, boxplot, violin, ridgeline,
             regression, Q-Q plots, group comparisons,
             lollipop, dumbbell, waffle, beeswarm, bump,
             radar, funnel, survival curves, distribution fit,
             sparklines, and small multiples.")
        )),
        column(3, div(class = "feature-card",
          icon("sliders", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("Statistical Transforms"),
          p("Built-in CI bands, LOESS smoothing, moving averages,
             mean \u00B1 CI error bars, and regression diagnostics.
             Composable and chainable.")
        )),
        column(3, div(class = "feature-card",
          icon("hand-pointer", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("Bidirectional I/O"),
          p("Brush to select, click to annotate, link charts
             with Crosstalk, and add parameter sliders.
             User actions flow back as structured data.")
        )),
        column(3, div(class = "feature-card",
          icon("palette", style = "font-size: 2rem; color: #4A5ACB;"),
          h4("Dark Mode + Themes"),
          p("14 built-in theme presets including dark, midnight,
             ocean, forest, sunset, neon, corporate, and academic.
             One-line theming with setTheme().")
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
            sliderInput("gb_noise", "Temperature jitter (F)", min = 0, max = 50, value = 0, step = 5),
            checkboxGroupInput("gb_months", "Airquality months", choices = 5:9, selected = 5:9, inline = TRUE)
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
          wellPanel(sliderInput("line_noise", "Temperature jitter (F)", min = 0, max = 50, value = 0, step = 5))
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
    ),
    tabPanel("Q-Q Plot",
      fluidRow(
        column(3,
          wellPanel(
            selectInput("qq_var", "Variable",
              choices = c("Sepal.Length", "Sepal.Width", "Petal.Length", "Petal.Width")),
            checkboxInput("qq_envelope", "Show CI Envelope", value = TRUE),
            checkboxInput("qq_grouped", "Group by Species", value = FALSE)
          )
        ),
        column(9, myIOOutput("qqPlot", height = "500px"))
      )
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
  tabPanel("Financial",
    icon = icon("chart-line"),
    tabsetPanel(
      tabPanel("Candlestick",
        div(class = "chart-container", myIOOutput("candlestickPlot", height = "500px"))
      ),
      tabPanel("Waterfall",
        div(class = "chart-container", myIOOutput("waterfallPlot", height = "500px"))
      )
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
    ),
    tabPanel("Comparison",
      fluidRow(
        column(3,
          wellPanel(
            selectInput("cmp_method", "Test Method",
              choices = c("t-test" = "t.test", "Wilcoxon" = "wilcox.test")),
            selectInput("cmp_adjust", "P-value Adjustment",
              choices = c("None" = "none", "Bonferroni" = "bonferroni", "Holm" = "holm", "BH" = "BH"))
          )
        ),
        column(9, myIOOutput("comparisonPlot", height = "500px"))
      )
    )
  ),

  # -- Relational --
  tabPanel("Relational",
    icon = icon("diagram-project"),
    tabsetPanel(
      tabPanel("Heatmap",
        div(class = "chart-container", myIOOutput("heatmapPlot", height = "500px"))
      ),
      tabPanel("Sankey",
        div(class = "chart-container", myIOOutput("sankeyPlot", height = "500px"))
      )
    )
  ),

  # -- Interactions --
  navbarMenu("Interactions", icon = icon("hand-pointer"),
    tabPanel("Brush Selection",
      fluidRow(
        column(8, myIOOutput("brushPlot", height = "450px")),
        column(4,
          wellPanel(
            h4("Selected Points"),
            verbatimTextOutput("brushInfo"),
            selectInput("brush_dir", "Brush Direction",
              choices = c("Both axes" = "xy", "X only" = "x", "Y only" = "y"))
          )
        )
      )
    ),
    tabPanel("Click-to-Annotate",
      fluidRow(
        column(8, myIOOutput("annotatePlot", height = "450px")),
        column(4,
          wellPanel(
            h4("Annotations"),
            tableOutput("annotationTable"),
            p(class = "text-muted", style = "font-size: 12px;",
              "Click any point to add a label. Click an annotated point to edit or remove.")
          )
        )
      )
    ),
    tabPanel("Linked Brushing",
      p(class = "text-muted", style = "padding: 0 1rem;",
        "Brush points in the left chart to highlight them in the right chart."),
      fluidRow(
        column(6, myIOOutput("linkedA", height = "400px")),
        column(6, myIOOutput("linkedB", height = "400px"))
      )
    ),
    tabPanel("Parameter Slider",
      div(class = "chart-container", myIOOutput("sliderPlot", height = "500px"))
    )
  ),

  # -- New Charts --
  navbarMenu("New Charts", icon = icon("star"),
    tabPanel("Lollipop",
      div(class = "chart-container", myIOOutput("lollipopPlot", height = "500px"))
    ),
    tabPanel("Dumbbell",
      div(class = "chart-container", myIOOutput("dumbbellPlot", height = "500px"))
    ),
    tabPanel("Waffle",
      div(class = "chart-container", myIOOutput("wafflePlot", height = "500px"))
    ),
    tabPanel("Beeswarm",
      div(class = "chart-container", myIOOutput("beeswarmPlot", height = "500px"))
    ),
    tabPanel("Bump",
      div(class = "chart-container", myIOOutput("bumpPlot", height = "500px"))
    ),
    tabPanel("Radar",
      div(class = "chart-container", myIOOutput("radarPlot", height = "500px"))
    ),
    tabPanel("Funnel",
      div(class = "chart-container", myIOOutput("funnelPlot", height = "500px"))
    ),
    tabPanel("Calendar Heatmap",
      div(class = "chart-container", myIOOutput("calendarPlot", height = "220px"))
    )
  ),

  # -- Advanced --
  navbarMenu("Advanced", icon = icon("flask"),
    tabPanel("Survival Curve",
      div(class = "chart-container", myIOOutput("survivalPlot", height = "500px"))
    ),
    tabPanel("Distribution Fit",
      fluidRow(
        column(3,
          wellPanel(
            selectInput("dist_family", "Distribution Family",
              choices = c("Normal" = "normal", "Log-Normal" = "lognormal", "Exponential" = "exponential"))
          )
        ),
        column(9, myIOOutput("distFitPlot", height = "500px"))
      )
    ),
    tabPanel("Sparklines",
      div(class = "chart-container",
        h4("Inline Sparklines"),
        fluidRow(
          column(4,
            wellPanel(
              h5("Revenue Trend"),
              myIOOutput("sparkline1", height = "60px")
            )
          ),
          column(4,
            wellPanel(
              h5("User Growth"),
              myIOOutput("sparkline2", height = "60px")
            )
          ),
          column(4,
            wellPanel(
              h5("Error Rate"),
              myIOOutput("sparkline3", height = "60px")
            )
          )
        )
      )
    ),
    tabPanel("Small Multiples",
      div(class = "chart-container", myIOOutput("facetPlot", height = "500px"))
    )
  ),

  # -- Theme Demo --
  tabPanel("Theme Demo",
    icon = icon("palette"),
    fluidRow(
      column(3,
        wellPanel(
          selectInput("theme_preset", "Theme Preset",
            choices = c("light", "dark", "midnight", "ocean", "forest",
                        "sunset", "monochrome", "neon", "corporate", "academic",
                        "nature", "minimal", "retro", "warm"))
        )
      ),
      column(9,
        fluidRow(
          column(6, myIOOutput("themeBar", height = "230px")),
          column(6, myIOOutput("themeLine", height = "230px"))
        ),
        fluidRow(
          column(6, myIOOutput("themeHeatmap", height = "230px")),
          column(6, myIOOutput("themeGauge", height = "230px"))
        ),
        fluidRow(
          column(6, myIOOutput("themeSankey", height = "230px")),
          column(6, myIOOutput("themeScatter", height = "230px"))
        )
      )
    )
  ),

  # -- Export Demo --
  tabPanel("Export Demo",
    icon = icon("download"),
    fluidRow(
      column(3,
        wellPanel(
          h5("Export Options"),
          p(class = "text-muted", style = "font-size: 0.85rem;",
            "Toggle which export buttons appear in the chart toolbar."),
          checkboxInput("exp_png", "PNG download", TRUE),
          checkboxInput("exp_svg", "SVG download", TRUE),
          checkboxInput("exp_pdf", "PDF download", TRUE),
          checkboxInput("exp_csv", "CSV download", TRUE),
          checkboxInput("exp_clipboard", "Clipboard copy", TRUE),
          hr(),
          selectInput("exp_theme", "Theme",
            choices = c("light", "dark", "midnight", "ocean"),
            selected = "light"),
          helpText("Try exporting in dark mode to verify CSS variable resolution.")
        )
      ),
      column(9, myIOOutput("exportPlot", height = "500px"))
    )
  )
)

# -- Server --------------------------------------------------------------
server <- function(input, output) {

  output$barPlot <- renderMyIO({
    df <- data.frame(
      language = c("Python", "JavaScript", "Java", "R", "Go"),
      postings = c(87, 63, 55, 42, 29), stringsAsFactors = FALSE)
    myIO(title = "Programming Language Job Postings") %>%
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
    myIO(title = "Daily Temperature by Month") %>%
      addIoLayer(type = "groupedBar",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temperature by Month",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")) %>%
      setAxisLimits(ylim = list(min = 0)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)") %>%
      setLegendTitle("Month")
  })

  output$hbarPlot <- renderMyIO({
    df <- data.frame(
      region = c("North", "South", "East", "West", "Central"),
      sales = c(320, 475, 290, 510, 380), stringsAsFactors = FALSE)
    myIO(title = "Regional Sales by Territory") %>%
      addIoLayer(type = "bar", color = "#F28E2B", label = "Sales",
        data = df, mapping = list(x_var = "region", y_var = "sales")) %>%
      defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
      flipAxis() %>%
      setAxisFormat(xAxis = ".0f", xLabel = "Sales ($K)", yLabel = "Region") %>%
      setMargin(top = 48, bottom = 72, left = 86, right = 16)
  })

  output$linePlot <- renderMyIO({
    df <- datasets::airquality %>% mutate(Month = as.character(Month))
    df$Temp <- df$Temp + runif(nrow(df), -input$line_noise, input$line_noise)
    myIO(title = "Daily Temperature Trends") %>%
      addIoLayer(type = "line",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temp",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)") %>%
      setLegendTitle("Month")
  })

  output$areaPlot <- renderMyIO({
    set.seed(1)
    months_seq <- 1:12
    base <- cumsum(runif(12, 10, 30))
    df <- data.frame(
      month = rep(months_seq, 2), low = c(base * 0.85, base * 0.5),
      high = c(base * 1.15, base * 0.8),
      band = rep(c("Optimistic", "Conservative"), each = 12), stringsAsFactors = FALSE)
    myIO(title = "Revenue Forecast Bands") %>%
      addIoLayer(type = "area", color = c("#4E79A7", "#F28E2B"), label = "Forecast",
        data = df, mapping = list(x_var = "month", low_y = "low", high_y = "high", group = "band")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Month", yLabel = "Revenue") %>%
      setLegendTitle("Scenario")
  })

  output$pointPlot <- renderMyIO({
    df <- datasets::mtcars
    myIO(title = "Vehicle Efficiency Trend") %>%
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
    myIO(title = "Response Time Distribution") %>%
      addIoLayer(type = "histogram", color = "#76B7B2", label = "Distribution",
        data = df, mapping = list(value = "value")) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Response Time (ms)", yLabel = "Frequency")
  })

  output$hexbinPlot <- renderMyIO({
    set.seed(42)
    df <- data.frame(
      x = c(rnorm(200, 3, 1), rnorm(200, 7, 1.5)),
      y = c(rnorm(200, 5, 1), rnorm(200, 8, 1.2)))
    myIO(title = "Density of Product Measurements") %>%
      addIoLayer(type = "hexbin", color = "#4E79A7", label = "Density",
        data = df, mapping = list(x_var = "x", y_var = "y", radius = 20)) %>%
      setAxisFormat(xLabel = "Height (in)", yLabel = "Weight (lbs)")
  })

  output$donutPlot <- renderMyIO({
    df <- data.frame(
      segment = c("Desktop", "Mobile", "Tablet", "Other"),
      traffic = pmax(1, c(45, 35, 15, 5) + runif(4, -input$donut_noise, input$donut_noise)),
      stringsAsFactors = FALSE)
    myIO(title = "Traffic Share by Device") %>%
      addIoLayer(type = "donut", color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
        label = "Traffic",
        data = df, mapping = list(x_var = "segment", y_var = "traffic"))
  })

  output$gaugePlot <- renderMyIO({
    myIO(title = "Activation Completion") %>%
      addIoLayer(type = "gauge", label = "Completion",
        data = data.frame(value = input$gauge_val),
        mapping = list(value = "value"),
        options = list(metric = "Activation rate")) %>%
      suppressAxis(xAxis = TRUE, yAxis = TRUE) %>%
      suppressLegend()
  })

  output$treemapPlot <- renderMyIO({
    df <- data.frame(
      department = c("Engineering", "Engineering", "Engineering", "Sales", "Sales", "Marketing", "Marketing", "Marketing"),
      team = c("Frontend", "Backend", "Infra", "Enterprise", "SMB", "Content", "Paid", "Brand"),
      headcount = c(25, 30, 15, 20, 18, 12, 10, 8), stringsAsFactors = FALSE)
    myIO(title = "Headcount by Department and Team") %>%
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
    myIO(title = "Quarterly Signups by Tier") %>%
      addIoLayer(type = "heatmap", color = "#4E79A7", label = "Signups",
        data = df, mapping = list(x_var = "x", y_var = "y", value = "value")) %>%
      defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE) %>%
      setAxisFormat(xLabel = "Quarter", yLabel = "Tier") %>%
      setMargin(top = 48, bottom = 72, left = 92, right = 16)
  })

  output$candlestickPlot <- renderMyIO({
    set.seed(42)
    n <- 30
    dates <- as.Date("2026-04-01") + 0:(n - 1)
    prices <- numeric(n)
    prices[1] <- 100
    for (i in 2:n) prices[i] <- prices[i - 1] + rnorm(1, mean = 0.3, sd = 2)
    df <- data.frame(
      day = as.numeric(dates),
      open = prices + runif(n, -1, 1),
      close = prices + runif(n, -1, 1),
      stringsAsFactors = FALSE
    )
    df$high <- pmax(df$open, df$close) + abs(rnorm(n, 0, 1.5))
    df$low <- pmin(df$open, df$close) - abs(rnorm(n, 0, 1.5))
    myIO(title = "ACME 30-Day Price Movement") %>%
      addIoLayer(type = "candlestick", color = "#59A14F", label = "ACME Corp",
        data = df, mapping = list(x_var = "day", open = "open", high = "high", low = "low", close = "close")) %>%
      setAxisFormat(xAxis = "yearMon", yAxis = "$,.0f", xLabel = "Date", yLabel = "Price")
  })

  output$waterfallPlot <- renderMyIO({
    df <- data.frame(
      step = c("Start", "Add Sales", "Discount", "Tax", "End"),
      value = c(100, 35, -15, -10, NA),
      total = c(FALSE, FALSE, FALSE, FALSE, TRUE),
      stringsAsFactors = FALSE
    )
    myIO(title = "Revenue Bridge from Start to End") %>%
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
    myIO(title = "Acquisition Funnel Flow") %>%
      addIoLayer(type = "sankey",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F",
                  "#EDC948", "#B07AA1", "#FF9DA7", "#9C755F", "#BAB0AC",
                  "#4E79A7", "#F28E2B"),
        label = "Acquisition Funnel",
        data = df, mapping = list(source = "source", target = "target", value = "value"))
  })

  output$boxplotPlot <- renderMyIO({
    myIO(title = "Sepal Length by Species") %>%
      addIoLayer(type = "boxplot", color = "#4E79A7", label = "Sepal Length",
        data = iris, mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(showOutliers = TRUE)) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$violinPlot <- renderMyIO({
    myIO(title = "Sepal Length Distribution by Species") %>%
      addIoLayer(type = "violin", color = "#59A14F", label = "Violin",
        data = iris, mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(showBox = TRUE, showMedian = TRUE, showPoints = FALSE)) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$ridgelinePlot <- renderMyIO({
    df <- datasets::mtcars
    df$cyl <- as.character(df$cyl)
    myIO(title = "Horsepower Distribution by Cylinder Count") %>%
      addIoLayer(type = "ridgeline", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Ridgeline",
        data = df, mapping = list(x_var = "hp", y_var = "mpg", group = "cyl"),
        options = list(overlap = 0.5, bandwidth = "nrd0")) %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "Cylinders")
  })

  output$qqPlot <- renderMyIO({
    mapping <- list(y_var = input$qq_var)
    if (input$qq_grouped) mapping$group <- "Species"
    myIO(data = iris, title = "Normal Q-Q Diagnostic") %>%
      addIoLayer(type = "qq", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Q-Q",
        mapping = mapping,
        options = list(envelope = input$qq_envelope)) %>%
      setAxisFormat(xLabel = "Theoretical Quantiles", yLabel = "Sample Quantiles")
  })

  output$comparisonPlot <- renderMyIO({
    myIO(data = iris, title = "Species Comparison with Significance") %>%
      addIoLayer(type = "comparison", color = "#4E79A7",
        label = "Sepal Width",
        mapping = list(x_var = "Species", y_var = "Sepal.Width"),
        options = list(
          method = input$cmp_method,
          p_adjust = input$cmp_adjust,
          showOutliers = TRUE)) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Width")
  })

  output$regressionPlot <- renderMyIO({
    set.seed(42)
    day <- 1:40
    df <- data.frame(day = day, yield = 0.8 * day + sin(day) * 5 + rnorm(40, sd = 3))
    myIO(data = df, title = "Yield Regression with Confidence Band") %>%
      addIoLayer(type = "regression", label = "Yield Model",
        mapping = list(x_var = "day", y_var = "yield"),
        options = list(
          method = input$reg_method,
          showCI = TRUE,
          level = input$reg_level,
          interval = input$reg_interval,
          showStats = (input$reg_method %in% c("lm", "polynomial")),
          degree = if (identical(input$reg_method, "polynomial")) 3 else 2,
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
    myIO(data = df, title = "Sensor Reading LOESS Smoothing") %>%
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
    myIO(data = iris, title = "Mean Sepal Length with 95% CI") %>%
      addIoLayer(type = "rangeBar", color = "#4E79A7", label = "Mean \u00B1 95% CI",
        transform = "mean_ci",
        mapping = list(x_var = "Species", y_var = "Sepal.Length"),
        options = list(level = 0.95, style = "errorbar")) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(xLabel = "Species", yLabel = "Sepal Length")
  })

  output$movingAvgPlot <- renderMyIO({
    set.seed(42)
    dates <- as.Date("2026-01-02") + 0:99
    df <- data.frame(day = as.numeric(dates), price = cumsum(rnorm(100, mean = 0.2, sd = 1)) + 50)
    w <- myIO(data = df, title = "Daily Close with Moving Average") %>%
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
    w %>% setAxisFormat(xAxis = "yearMon", xLabel = "Date", yLabel = "Price ($)")
  })

  output$residualPlot <- renderMyIO({
    set.seed(42)
    x <- 1:40
    df <- data.frame(x = x, y = 0.05 * x^2 + rnorm(40, sd = 3))
    myIO(data = df, title = "Residual Pattern Diagnostic") %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Residuals (lm on quadratic data)",
        transform = "residuals",
        mapping = list(x_var = "x", y_var = "y")) %>%
      setReferenceLines(yRef = 0) %>%
      setAxisFormat(xLabel = "Fitted Values", yLabel = "Residuals")
  })

  # -- Interactions: Brush Selection --
  output$brushPlot <- renderMyIO({
    myIO(title = "Brush Selection: Vehicle Efficiency") %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Cars",
        data = mtcars, mapping = list(x_var = "wt", y_var = "mpg")) %>%
      setBrush(direction = input$brush_dir) %>%
      setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon") %>%
      setMargin(top = 20, bottom = 70, left = 60, right = 10)
  })

  output$brushInfo <- renderPrint({
    brushed <- input$`myIO-brushPlot-brushed`
    if (is.null(brushed)) return("Drag on the chart to select points.")
    sel <- jsonlite::fromJSON(brushed)
    if (length(sel$keys) == 0) return("No points selected.")
    cat(length(sel$keys), "of", nrow(mtcars), "points selected\n\n")
    if (!is.null(sel$extent$x)) {
      cat("X range:", round(sel$extent$x[1], 2), "-", round(sel$extent$x[2], 2), "\n")
    }
    if (!is.null(sel$extent$y)) {
      cat("Y range:", round(sel$extent$y[1], 2), "-", round(sel$extent$y[2], 2), "\n")
    }
  })

  # -- Interactions: Annotation --
  output$annotatePlot <- renderMyIO({
    myIO(title = "Click-to-Annotate Iris Measurements") %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "Iris",
        data = iris, mapping = list(x_var = "Sepal.Length", y_var = "Petal.Length")) %>%
      setAnnotation(
        labels = c("outlier", "cluster edge", "typical"),
        colors = c(outlier = "#E63946", `cluster edge` = "#F4A261", typical = "#2A9D8F")
      ) %>%
      setAxisFormat(xLabel = "Sepal Length", yLabel = "Petal Length")
  })

  output$annotationTable <- renderTable({
    ann <- input$`myIO-annotatePlot-annotated`
    if (is.null(ann)) return(data.frame(Label = character(), X = numeric(), Y = numeric()))
    parsed <- jsonlite::fromJSON(ann)
    if (length(parsed$annotations) == 0) {
      return(data.frame(Label = character(), X = numeric(), Y = numeric()))
    }
    df <- parsed$annotations
    data.frame(
      Label = df$label,
      X = round(as.numeric(df$x), 2),
      Y = round(as.numeric(df$y), 2)
    )
  }, striped = TRUE, spacing = "s", width = "100%")

  # -- Interactions: Linked Brushing --
  shared_mtcars <- crosstalk::SharedData$new(mtcars, key = ~rownames(mtcars))

  output$linkedA <- renderMyIO({
    myIO(title = "Linked View: Weight vs MPG") %>%
      addIoLayer(type = "point", color = "#4E79A7", label = "wt vs mpg",
        data = shared_mtcars$data(), mapping = list(x_var = "wt", y_var = "mpg")) %>%
      setBrush() %>%
      setLinked(shared_mtcars, mode = "source") %>%
      setAxisFormat(xLabel = "Weight", yLabel = "MPG")
  })

  output$linkedB <- renderMyIO({
    myIO(title = "Linked View: Horsepower vs MPG") %>%
      addIoLayer(type = "point", color = "#E15759", label = "hp vs mpg",
        data = shared_mtcars$data(), mapping = list(x_var = "hp", y_var = "mpg")) %>%
      setLinked(shared_mtcars, mode = "target") %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG")
  })

  # -- Interactions: Slider --
  output$sliderPlot <- renderMyIO({
    ci <- input$`myIO-sliderPlot-slider-ci_level`
    if (is.null(ci)) ci <- 0.95
    set.seed(42)
    day <- 1:40
    df <- data.frame(day = day, yield = 0.8 * day + sin(day) * 5 + rnorm(40, sd = 3))
    myIO(data = df, title = "Interactive Confidence Level Slider") %>%
      addIoLayer(type = "regression", label = "Yield Model",
        mapping = list(x_var = "day", y_var = "yield"),
        options = list(method = "lm", showCI = TRUE, level = ci, showStats = TRUE)) %>%
      setSlider("ci_level", "Confidence Level", 0.80, 0.99, ci, 0.01) %>%
      setAxisFormat(xLabel = "Day of Experiment", yLabel = "Yield (mg)")
  })

  # -- New Charts --

  output$lollipopPlot <- renderMyIO({
    df <- data.frame(
      channel = c("Organic", "Paid search", "Referral", "Email", "Partner", "Direct"),
      conversion = c(6.8, 4.9, 5.7, 8.1, 3.8, 5.2)
    )
    myIO(title = "Conversion Rate by Acquisition Channel") |>
      addIoLayer("lollipop", label = "Conversion rate", color = "#4269D0",
        data = df, mapping = list(x_var = "channel", y_var = "conversion")) |>
      defineCategoricalAxis(xAxis = TRUE) |>
      setAxisFormat(yAxis = ".1f", xLabel = "Channel", yLabel = "Conversion Rate (%)")
  })

  output$dumbbellPlot <- renderMyIO({
    df <- data.frame(
      dept = c("Engineering", "Marketing", "Sales", "Support", "Design"),
      q1 = c(3.2, 3.5, 3.8, 3.1, 4.0),
      q4 = c(4.5, 4.2, 3.6, 4.1, 4.3))
    myIO(title = "Customer Satisfaction Shift") |>
      addIoLayer("dumbbell", label = "Satisfaction", color = "#E15759",
        data = df, mapping = list(x_var = "dept", low_y = "q1", high_y = "q4")) |>
      defineCategoricalAxis(xAxis = TRUE) |>
      setAxisFormat(yAxis = ".1f", xLabel = "Department", yLabel = "Satisfaction Score")
  })

  output$wafflePlot <- renderMyIO({
    df <- data.frame(
      cat = c("Renewable", "Natural Gas", "Coal", "Nuclear", "Other"),
      val = c(22, 38, 20, 12, 8))
    myIO(title = "Energy Mix by Source") |>
      addIoLayer("waffle", label = "Energy Mix",
        data = df, mapping = list(category = "cat", value = "val"))
  })

  output$beeswarmPlot <- renderMyIO({
    myIO(title = "Iris Measurement Beeswarm") |>
      addIoLayer("beeswarm", label = "Iris", color = "#76B7B2",
        data = iris, mapping = list(x_var = "Sepal.Length", y_var = "Species"),
        options = list(radius = 3)) |>
      defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) |>
      setAxisFormat(xLabel = "Sepal length (cm)", yLabel = "Species")
  })

  output$bumpPlot <- renderMyIO({
    df <- data.frame(
      quarter = rep(c("Q1", "Q2", "Q3", "Q4", "Q5", "Q6"), each = 5),
      rank = c(1,2,3,4,5, 1,3,2,5,4, 2,1,3,4,5, 2,1,4,3,5, 1,2,3,5,4, 1,3,2,4,5),
      team = rep(c("Core", "Growth", "Lifecycle", "Partner", "Support"), 6))
    myIO(title = "Product Team Priority Ranking") |>
      addIoLayer("bump", label = "Rankings",
        data = df, mapping = list(x_var = "quarter", y_var = "rank", group = "team")) |>
      defineCategoricalAxis(xAxis = TRUE) |>
      setAxisFormat(xLabel = "Quarter", yLabel = "Rank") |>
      setLegendTitle("Team")
  })

  output$radarPlot <- renderMyIO({
    df <- data.frame(
      axis = c("Speed", "Power", "Range", "Armor", "Stealth"),
      value = c(85, 70, 90, 45, 75))
    myIO(title = "Capability Radar") |>
      addIoLayer("radar", label = "Fighter Stats", color = "#4E79A7",
        data = df, mapping = list(axis = "axis", value = "value"))
  })

  output$calendarPlot <- renderMyIO({
    set.seed(1)
    df <- data.frame(
      day = as.Date("2026-01-01") + 0:364,
      activity = rpois(365, lambda = 4)
    )
    myIO(title = "Daily Product Activity") |>
      addIoLayer(type = "calendarHeatmap", color = "#4E79A7",
                 label = "Daily activity",
                 data = df,
                 mapping = list(date = "day", value = "activity"))
  })

  output$funnelPlot <- renderMyIO({
    df <- data.frame(
      stage = c("Visitors", "Leads", "Qualified", "Proposals", "Closed"),
      value = c(10000, 5200, 2800, 1100, 450))
    myIO(title = "Sales Pipeline Funnel") |>
      addIoLayer("funnel", label = "Sales Pipeline",
        data = df, mapping = list(stage = "stage", value = "value"))
  })

  # -- Advanced --

  output$survivalPlot <- renderMyIO({
    set.seed(42)
    n <- 80
    df <- data.frame(
      time = rexp(n, rate = 0.05),
      status = rbinom(n, 1, 0.7))
    myIO(title = "Customer Retention Survival Curve") |>
      addIoLayer("survfit", label = "Survival",
        data = df, mapping = list(time = "time", status = "status")) |>
      setAxisLimits(ylim = list(min = 0, max = 1)) |>
      setAxisFormat(xLabel = "Time (months)", yLabel = "Survival Probability")
  })

  output$distFitPlot <- renderMyIO({
    set.seed(123)
    df <- data.frame(x = rnorm(500, mean = 50, sd = 10))
    myIO(title = "Distribution Fit Diagnostic") |>
      addIoLayer("histogram_fit", label = "Fit",
        data = df, mapping = list(value = "x"),
        options = list(family = input$dist_family)) |>
      setAxisFormat(xLabel = "Value", yLabel = "Count")
  })

  output$sparkline1 <- renderMyIO({
    set.seed(1)
    df <- data.frame(x = 1:20, y = cumsum(rnorm(20, 0.5, 1)))
    myIO(data = df, sparkline = TRUE) |>
      addIoLayer("line", label = "Revenue", color = "#59A14F",
        mapping = list(x_var = "x", y_var = "y"))
  })

  output$sparkline2 <- renderMyIO({
    set.seed(2)
    df <- data.frame(x = 1:20, y = cumsum(rnorm(20, 0.3, 0.8)))
    myIO(data = df, sparkline = TRUE) |>
      addIoLayer("line", label = "Users", color = "#4E79A7",
        mapping = list(x_var = "x", y_var = "y"))
  })

  output$sparkline3 <- renderMyIO({
    set.seed(3)
    df <- data.frame(x = 1:20, y = pmax(0, 5 + cumsum(rnorm(20, -0.1, 0.5))))
    myIO(data = df, sparkline = TRUE) |>
      addIoLayer("line", label = "Errors", color = "#E15759",
        mapping = list(x_var = "x", y_var = "y"))
  })

  output$facetPlot <- renderMyIO({
    myIO(iris, title = "Iris Small Multiples by Species") |>
      addIoLayer("point", label = "Iris",
        mapping = list(x_var = "Sepal.Length", y_var = "Sepal.Width")) |>
      setFacet("Species", ncol = 3) |>
      setAxisFormat(xLabel = "Sepal Length", yLabel = "Sepal Width")
  })

  # -- Theme Demo --

  output$themeBar <- renderMyIO({
    df <- data.frame(channel = c("Organic", "Paid", "Referral", "Email"), signups = c(240, 180, 120, 95))
    myIO(title = "Theme Preview: Bar") %>%
      addIoLayer(type = "bar", label = "Signups", data = df,
        mapping = list(x_var = "channel", y_var = "signups")) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setTheme(preset = input$theme_preset) %>%
      setAxisFormat(xLabel = "Channel", yLabel = "Signups")
  })

  output$themeLine <- renderMyIO({
    df <- data.frame(day = 1:12, revenue = c(8, 9, 12, 15, 14, 18, 19, 22, 21, 25, 27, 31))
    myIO(title = "Theme Preview: Trend") %>%
      addIoLayer(type = "line", label = "Revenue", data = df,
        mapping = list(x_var = "day", y_var = "revenue")) %>%
      setTheme(preset = input$theme_preset) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Day", yLabel = "Revenue")
  })

  output$themeHeatmap <- renderMyIO({
    df <- expand.grid(quarter = c("Q1", "Q2", "Q3"), tier = c("Basic", "Pro", "Enterprise"))
    df$value <- c(12, 18, 26, 9, 17, 29, 5, 12, 21)
    myIO(title = "Theme Preview: Heatmap") %>%
      addIoLayer(type = "heatmap", label = "Activation", data = df,
        mapping = list(x_var = "quarter", y_var = "tier", value = "value")) %>%
      defineCategoricalAxis(xAxis = TRUE, yAxis = TRUE) %>%
      setTheme(preset = input$theme_preset) %>%
      setAxisFormat(xLabel = "Quarter", yLabel = "Tier") %>%
      setMargin(top = 48, bottom = 60, left = 88, right = 12)
  })

  output$themeGauge <- renderMyIO({
    myIO(title = "Theme Preview: Gauge") %>%
      addIoLayer(type = "gauge", label = "Activation",
        data = data.frame(value = 0.72), mapping = list(value = "value"),
        options = list(metric = "Activation")) %>%
      setTheme(preset = input$theme_preset) %>%
      suppressAxis(xAxis = TRUE, yAxis = TRUE) %>%
      suppressLegend()
  })

  output$themeSankey <- renderMyIO({
    df <- data.frame(
      source = c("Visit", "Visit", "Trial", "Trial"),
      target = c("Trial", "Exit", "Paid", "Churn"),
      value = c(70, 30, 42, 28)
    )
    myIO(title = "Theme Preview: Flow") %>%
      addIoLayer(type = "sankey", label = "Flow", data = df,
        mapping = list(source = "source", target = "target", value = "value")) %>%
      setTheme(preset = input$theme_preset)
  })

  output$themeScatter <- renderMyIO({
    df <- datasets::mtcars %>% mutate(cyl = as.character(cyl))
    myIO(title = "Theme Preview: Scatter") %>%
      addIoLayer(type = "point", color = c("#FF6B6B", "#4ECDC4", "#45B7D1"),
        label = "MPG by HP",
        data = df, mapping = list(x_var = "hp", y_var = "mpg", group = "cyl")) %>%
      setTheme(preset = input$theme_preset) %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG") %>%
      setReferenceLines(yRef = mean(df$mpg)) %>%
      setLegendTitle("Cylinders")
  })

  # -- Export Demo --

  output$exportPlot <- renderMyIO({
    df <- datasets::mtcars %>% mutate(cyl = as.character(cyl))
    myIO(title = "Export Demo: MPG by Weight") %>%
      addIoLayer(type = "point", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "MPG by Weight",
        data = df, mapping = list(x_var = "wt", y_var = "mpg", group = "cyl")) %>%
      addIoLayer(type = "line", transform = "lm",
        data = df, mapping = list(x_var = "wt", y_var = "mpg"),
        color = "#999999", label = "Trend") %>%
      setTheme(preset = input$exp_theme) %>%
      setAxisFormat(xAxis = ".1f", yAxis = ".0f",
        xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon") %>%
      setLegendTitle("Cylinders") %>%
      setExportOptions(
        png = input$exp_png,
        svg = input$exp_svg,
        pdf = input$exp_pdf,
        csv = input$exp_csv,
        clipboard = input$exp_clipboard,
        title = "MPG by Weight — myIO Export Demo"
      )
  })
}

shinyApp(ui = ui, server = server)

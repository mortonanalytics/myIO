library(shiny)
library(bslib)
library(dplyr)
library(myIO)

# -- Proxy auth filter ----------------------------------------------------
proxy_secret <- Sys.getenv("PROXY_SECRET", "")

auth_filter <- function(req) {
  # Health checks from DO use GET / with no headers — allow them

  if (identical(req$HTTP_USER_AGENT, "DigitalOcean Health Check")) return(NULL)
  secret <- req$HTTP_X_PROXY_SECRET
  if (nzchar(proxy_secret) && !identical(secret, proxy_secret)) {
    return(httpResponse(status = 403L, content = "Forbidden"))
  }
  NULL
}

# -- Landing page --------------------------------------------------------
home_tab <- nav_panel(
  title = "Home",
  icon = icon("house"),
  div(
    class = "container-fluid",
    style = "max-width: 900px; margin: 0 auto; padding-top: 2rem;",
    div(
      style = "text-align: center; margin-bottom: 2rem;",
      img(src = "logo.png", height = "120px"),
      h1("myIO Chart Gallery", style = "margin-top: 1rem; font-weight: 700;"),
      p(
        class = "lead",
        "Interactive D3.js visualizations, built entirely in R.",
        style = "color: #6c757d;"
      )
    ),
    layout_column_wrap(
      width = 1 / 3,
      card(
        card_header(class = "bg-primary text-white", icon("layer-group"), " 10 Chart Types"),
        card_body(
          "Scatter, line, bar, grouped bar, area, histogram,",
          "donut, gauge, treemap, and hexbin \u2014 all from a single piped API."
        )
      ),
      card(
        card_header(class = "bg-primary text-white", icon("sliders"), " Reactive & Composable"),
        card_body(
          "Every chart is a Shiny-ready htmlwidget. Layer, theme, and",
          "customize with chainable functions like setTheme() and flipAxis()."
        )
      ),
      card(
        card_header(class = "bg-primary text-white", icon("code"), " Minimal Code"),
        card_body(
          "A publication-quality chart in 5\u20136 lines of R.",
          "No JavaScript required \u2014 D3 is handled under the hood."
        )
      )
    ),
    div(
      style = "text-align: center; margin-top: 1.5rem; margin-bottom: 2rem;",
      p("Use the tabs above to explore each chart type. Controls on the left let you tweak parameters in real time."),
      tags$a(
        href = "https://mortonanalytics.github.io/myIO/",
        class = "btn btn-outline-primary",
        target = "_blank",
        icon("book"), " Documentation"
      ),
      tags$a(
        href = "https://github.com/mortonanalytics/myIO",
        class = "btn btn-outline-secondary ms-2",
        target = "_blank",
        icon("github"), " Source Code"
      )
    )
  )
)

# -- Helper: chart panel with sidebar controls ---------------------------
chart_panel <- function(title, output_id, height = "500px", ...) {
  nav_panel(
    title = title,
    layout_sidebar(
      sidebar = sidebar(width = "260px", ...),
      card(
        full_screen = TRUE,
        card_body(
          class = "p-0",
          myIOOutput(output_id, height = height)
        )
      )
    )
  )
}

chart_panel_no_sidebar <- function(title, output_id, height = "500px") {
  nav_panel(
    title = title,
    card(
      full_screen = TRUE,
      card_body(
        class = "p-0",
        myIOOutput(output_id, height = height)
      )
    )
  )
}

# -- UI ------------------------------------------------------------------
ui <- page_navbar(
  title = tags$span(
    img(src = "logo.png", height = "30px", style = "margin-right: 8px; margin-top: -3px;"),
    "myIO"
  ),
  id = "nav",
  theme = bs_theme(
    version = 5,
    primary = "#4A5ACB",
    bg = "#ffffff",
    fg = "#212529",
    font_scale = 0.95
  ),
  navbar_options = navbar_options(bg = "#1a1a2e", theme = "dark"),

  home_tab,

  nav_menu(
    title = "Basic Charts",
    icon = icon("chart-bar"),
    chart_panel(
      "Bar", "barPlot"
    ),
    chart_panel(
      "Grouped Bar", "groupedBar",
      sliderInput("gb_noise", "Noise", min = 0, max = 50, value = 0, step = 5),
      checkboxGroupInput("gb_months", "Months", choices = 5:9, selected = 5:9, inline = TRUE)
    ),
    chart_panel_no_sidebar("Horizontal Bar", "hbarPlot"),
    chart_panel(
      "Line", "linePlot",
      sliderInput("line_noise", "Noise", min = 0, max = 50, value = 0, step = 5)
    ),
    chart_panel_no_sidebar("Area", "areaPlot")
  ),

  nav_menu(
    title = "Statistical",
    icon = icon("chart-line"),
    chart_panel_no_sidebar("Scatter + Trend", "pointPlot"),
    chart_panel(
      "Histogram", "histPlot",
      sliderInput("hist_n", "Sample size", min = 50, max = 500, value = 200, step = 50)
    ),
    chart_panel_no_sidebar("Hexbin Density", "hexbinPlot")
  ),

  nav_menu(
    title = "Specialized",
    icon = icon("shapes"),
    chart_panel(
      "Donut", "donutPlot",
      sliderInput("donut_noise", "Noise", min = 0, max = 30, value = 0, step = 5)
    ),
    chart_panel(
      "Gauge", "gaugePlot",
      sliderInput("gauge_val", "Value", min = 0, max = 1, value = 0.65, step = 0.05)
    ),
    chart_panel_no_sidebar("Treemap", "treemapPlot", height = "550px")
  ),

  nav_panel(
    title = "Theme Demo",
    icon = icon("palette"),
    card(
      full_screen = TRUE,
      card_body(
        class = "p-0",
        myIOOutput("themePlot", height = "500px")
      )
    )
  ),

  nav_spacer(),
  nav_item(
    tags$a(
      icon("github"),
      href = "https://github.com/mortonanalytics/myIO",
      target = "_blank",
      style = "color: rgba(255,255,255,0.8);"
    )
  )
)

# -- Server --------------------------------------------------------------
server <- function(input, output) {

  # --- Bar ---
  output$barPlot <- renderMyIO({
    df <- data.frame(
      category = c("Alpha", "Beta", "Gamma", "Delta", "Epsilon"),
      value = c(42, 87, 63, 29, 55),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(
        type = "bar", color = "#59A14F", label = "Values",
        data = df, mapping = list(x_var = "category", y_var = "value")
      ) %>%
      defineCategoricalAxis(xAxis = TRUE) %>%
      setAxisFormat(yAxis = ".0f", xLabel = "Category", yLabel = "Value")
  })

  # --- Grouped Bar ---
  output$groupedBar <- renderMyIO({
    df <- datasets::airquality %>%
      mutate(Month = as.character(Month)) %>%
      filter(Month %in% input$gb_months)
    df$Temp <- df$Temp + runif(nrow(df), -input$gb_noise, input$gb_noise)
    myIO() %>%
      addIoLayer(
        type = "groupedBar",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temperature by Month",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
      ) %>%
      setAxisLimits(ylim = list(min = 0)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature (F)")
  })

  # --- Horizontal Bar ---
  output$hbarPlot <- renderMyIO({
    df <- data.frame(
      region = c("North", "South", "East", "West", "Central"),
      sales = c(320, 475, 290, 510, 380),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(
        type = "bar", color = "#F28E2B", label = "Sales",
        data = df, mapping = list(x_var = "region", y_var = "sales")
      ) %>%
      defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
      flipAxis() %>%
      setAxisFormat(xAxis = ".0f", xLabel = "Sales ($K)", yLabel = "Region")
  })

  # --- Line ---
  output$linePlot <- renderMyIO({
    df <- datasets::airquality %>%
      mutate(Month = as.character(Month))
    df$Temp <- df$Temp + runif(nrow(df), -input$line_noise, input$line_noise)
    myIO() %>%
      addIoLayer(
        type = "line",
        color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2", "#59A14F"),
        label = "Temp",
        data = df, mapping = list(x_var = "Day", y_var = "Temp", group = "Month")
      ) %>%
      setAxisLimits(ylim = list(min = 0)) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Day", yLabel = "Temperature")
  })

  # --- Area ---
  output$areaPlot <- renderMyIO({
    set.seed(1)
    months_seq <- 1:12
    base <- cumsum(runif(12, 10, 30))
    df <- data.frame(
      month = rep(months_seq, 2),
      low = c(base * 0.85, base * 0.5),
      high = c(base * 1.15, base * 0.8),
      band = rep(c("Optimistic", "Conservative"), each = 12),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(
        type = "area", color = c("#4E79A7", "#F28E2B"), label = "Forecast",
        data = df, mapping = list(x_var = "month", low_y = "low", high_y = "high", group = "band")
      ) %>%
      setAxisFormat(xAxis = ".0f", yAxis = "$,.0f", xLabel = "Month", yLabel = "Revenue")
  })

  # --- Scatter + Trend ---
  output$pointPlot <- renderMyIO({
    df <- datasets::mtcars
    myIO() %>%
      addIoLayer(
        type = "point", color = "#4E79A7", label = "Cars",
        data = df, mapping = list(x_var = "wt", y_var = "mpg")
      ) %>%
      addIoLayer(
        type = "line", transform = "lm", color = "#E15759", label = "Linear Fit",
        data = df, mapping = list(x_var = "wt", y_var = "mpg")
      ) %>%
      setAxisFormat(xLabel = "Weight (1000 lbs)", yLabel = "Miles per Gallon")
  })

  # --- Histogram ---
  output$histPlot <- renderMyIO({
    df <- data.frame(value = rnorm(input$hist_n, mean = 50, sd = 15))
    myIO() %>%
      addIoLayer(
        type = "histogram", color = "#76B7B2", label = "Distribution",
        data = df, mapping = list(value = "value")
      ) %>%
      setAxisFormat(xAxis = ".0f", yAxis = ".0f", xLabel = "Value", yLabel = "Count")
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
        type = "hexbin", color = "#4E79A7", label = "Density",
        data = df, mapping = list(x_var = "x", y_var = "y", radius = 20)
      ) %>%
      setAxisFormat(xLabel = "X", yLabel = "Y")
  })

  # --- Donut ---
  output$donutPlot <- renderMyIO({
    df <- data.frame(
      segment = c("Desktop", "Mobile", "Tablet", "Other"),
      traffic = pmax(1, c(45, 35, 15, 5) + runif(4, -input$donut_noise, input$donut_noise)),
      stringsAsFactors = FALSE
    )
    myIO() %>%
      addIoLayer(
        type = "donut", color = c("#4E79A7", "#F28E2B", "#E15759", "#76B7B2"),
        label = "Traffic",
        data = df, mapping = list(x_var = "segment", y_var = "traffic")
      )
  })

  # --- Gauge ---
  output$gaugePlot <- renderMyIO({
    myIO() %>%
      addIoLayer(
        type = "gauge", color = "#E15759", label = "Completion",
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
        type = "treemap", color = c("#4E79A7", "#F28E2B", "#E15759"),
        label = "Org Chart",
        data = df, mapping = list(level_1 = "department", level_2 = "team", y_var = "headcount", x_var = "team")
      )
  })

  # --- Theme Demo ---
  output$themePlot <- renderMyIO({
    df <- datasets::mtcars %>% mutate(cyl = as.character(cyl))
    myIO() %>%
      addIoLayer(
        type = "point", color = c("#FF6B6B", "#4ECDC4", "#45B7D1"),
        label = "MPG by HP",
        data = df, mapping = list(x_var = "hp", y_var = "mpg", group = "cyl")
      ) %>%
      setTheme(text_color = "#e0e0e0", grid_color = "#333333", bg = "#1a1a2e", font = "monospace") %>%
      setAxisFormat(xLabel = "Horsepower", yLabel = "MPG") %>%
      setReferenceLines(yRef = mean(df$mpg))
  })
}

shinyApp(ui = ui, server = server, options = list(filter = auth_filter))

library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("This Is the Month of ", Month),
         Temp_low = Temp * c(0.8,0.9,0.75),
         Temp_high = Temp * c(1.2,1.1,1.3)) %>%
  group_by(Day) %>%
  mutate(Percent = Temp/sum(Temp)) %>%
  ungroup() %>%
  mutate(Day2 = Day * c(1.02, 1.03, 1.01, 1.05, 1.1, 1.08))%>%
  arrange(Day)

colors <- substr(viridis(5), 1, 7)

myIO()%>%
  addIoLayer(type = "line",
             color = colors,
             label = "Month",
             data = df ,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               # low_y = "Temp_low",
               # high_y = "Temp_high",
               group = "Month"
             )) %>%
  setToggle(newY = "Percent", newScaleY = ".0%") %>%
  setAxisFormat(xAxis = ".0f",yAxis = ".0f")


myIO() %>%
  addIoLayer(type = "bar",
             color = colors[1],
             label = "This Is the Month of 5",
             data = df %>% filter(Month == "This Is the Month of 5"),
             mapping = list(
               x_var = "Day",
               y_var = "Temp"
             ))%>%
  addIoLayer(type = "bar",
             color = colors[2],
             label = "This Is the Month of 7",
             data = df %>% filter(Month == "This Is the Month of 7"),
             mapping = list(
               x_var = "Day",
               y_var = "Temp"
             ),
             options = list(barSize = "small")
             )%>%
  setAxisLimits(ylim = list(min = "0")) %>%
  #defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
  flipAxis()

df_hexbin <- data.frame(x = rnorm(1000),
                        y = rnorm(1000))

myIO(elementId = "tester", height = "600px") %>%
  addIoLayer(type = "hexbin",
             label = "test",
             data = df_hexbin,
             mapping = list(x_var = "x",
                            y_var = "y",
                            radius = 20))


df <- mtcars %>% mutate(cars = rownames(.))
class(df$cyl) <- "character"
class(df$vs) <- "character"
class(df$am) <- "character"
class(df$gear) <- "character"
class(df$carb) <- "character"

colors <- substr(viridis(6), 1, 7)

myIO(height = "600px") %>%
  addIoLayer(
    type = "treemap",
    color = c("steelblue", "red", "orange", "green", "brown", "purple"),
    label = "treemap",
    data = df,
    mapping = list(
      level_2 = "cyl",
      level_1 = "carb",
      x_var = "cars",
      y_var = "mpg"
    )
  )

df_donut <- data.frame(x = c("Apples", "Oranges", "Berries"),
                       y = c(2, 9,5),
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

myIO() %>%
  addIoLayer(
    type = "gauge",
    color = "orange",
    label = "gauge",
    data = data.frame(value = 0.9),
    mapping = list(value = "value")

  )

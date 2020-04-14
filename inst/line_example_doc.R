library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("This Is the Month of ", Month),
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
  setToggle(newY = "Percent", newScaleY = ".0%") %>%
  setAxisFormat(yAxis = ".0f")

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
  defineCategoricalAxis(xAxis = TRUE, yAxis = FALSE)

df_hexbin <- data.frame(x = rnorm(1000),
                        y = rnorm(1000))

myIO(elementId = "tester") %>%
  addIoLayer(type = "hexbin",
             label = "test",
             data = df_hexbin,
             mapping = list(x_var = "x",
                            y_var = "y",
                            radius = 20))


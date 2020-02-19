library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("M", Month))

colors <- substr(viridis(5), 1, 7)

myIO()%>%
  addIoLayer(type = "point",
             color = colors,
             label = "Month",
             data = df,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               group = "Month"
             ))


myIO() %>%
  addIoLayer(type = "bar",
             color = colors[1],
             label = "Temp",
             data = df %>%
               filter(Day == 5),
             mapping = list(
               x_var = "Month",
               y_var = "Temp"
             )) %>%
  #flipAxis() %>%
  defineCategoricalAxis() %>%
  setColorScheme(colorShceme = colors, setCategories = unique(df$Month)) %>%
  setAxisFormat(xAxis = "text") %>%
  suppressLegend()

library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("M", Month))

colors <- substr(viridis(5), 1, 7)

myIO()%>%
  addIoLayer(type = "line",
             color = colors,
             label = "Month",
             data = df,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               group = "Month"
             ))


library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("M", Month))

for(i in 1:ncol(df)){
  df[is.na(df[,i]), i] <- mean(df[,i], na.rm = TRUE)
}

colors <- substr(viridis(5), 1, 7)

myIO(elementId = "tester")%>%
  addIoLayer(type = "line",
             color = colors,
             label = "Month",
             data = df,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               group = "Month"
             ))


myIO() %>%
  addIoLayer(type = "line",
             color = colors,
             label = "Temp",
             data = df,
             mapping = list(
               x_var = "Day",
               y_var = "Temp",
               group = "Month"
             )) %>%
  setColorScheme(colorShceme = colors, setCategories = unique(df$Month))

library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("M", Month)) %>%
  group_by(Day) %>%
  mutate(Percent = Temp/sum(Temp)) %>%
  ungroup() %>%
  filter(Day != 31)

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
             )) %>%
  #setAxisLimits(xlim = list(min = "1"))%>%
  setToggle(newY = "Percent", newScaleY = ".0%") %>%
  setAxisFormat(yAxis = ".0f")


myIO() %>%
  addIoLayer(type = "bar",
             color = colors[1],
             label = "Temp",
             data = df %>% filter(Day ==1),
             mapping = list(
               x_var = "Month",
               y_var = "Temp"
             )) %>%
  defineCategoricalAxis()%>%
  flipAxis()

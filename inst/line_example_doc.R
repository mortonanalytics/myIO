library(dplyr)
library(myIO)
library(viridis)

df <- datasets::airquality %>%
  mutate(Month = paste0("M", Month),
         Temp_low = Temp * c(0.8,0.9,0.75),
         Temp_high = Temp * c(1.2,1.1,1.3)) %>%
  group_by(Day) %>%
  mutate(Percent = Temp/sum(Temp)) %>%
  ungroup()

for(i in 1:ncol(df)){
  df[is.na(df[,i]), i] <- mean(df[,i], na.rm = TRUE)
}

colors <- substr(viridis(5), 1, 7)

myIO(elementId = "tester")%>%
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
  #setAxisLimits(xlim = list(min = "1"))%>%
  setToggle(newY = "Percent", newScaleY = ".0%") %>%
  setAxisFormat(yAxis = ".0f")


myIO() %>%
  addIoLayer(type = "bar",
             color = colors[1],
             label = "M5",
             data = df %>% filter(Month == "M5"),
             mapping = list(
               x_var = "Day",
               y_var = "Temp"
             ))%>%
  addIoLayer(type = "bar",
             color = colors[2],
             label = "M6",
             data = df %>% filter(Month == "M7"),
             mapping = list(
               x_var = "Day",
               y_var = "Temp"
             ),
             options = list(barSize = "small")
             )%>%
  setAxisLimits(ylim = list(min = "0")) %>%
  defineCategoricalAxis(xAxis = FALSE, yAxis = TRUE) %>%
  flipAxis()

df_hexbin <- data.frame(x = rnorm(1000),
                        y = rnorm(1000))

myIO(elementId = "tester") %>%
  addIoLayer(type = "hexbin",
             label = "test",
             data = df_hexbin,
             mapping = list(x_var = "x",
                            y_var = "y",
                            radius = 20))


FROM rocker/shiny:4.4.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    git \
  && rm -rf /var/lib/apt/lists/*

RUN R -e "install.packages(c('dplyr', 'bslib', 'fontawesome', 'remotes'), repos = 'https://cloud.r-project.org')"
RUN R -e "remotes::install_github('mortonanalytics/myIO')"

COPY app/ /srv/shiny-server/

RUN rm -rf /srv/shiny-server/sample-apps /srv/shiny-server/index.html

# Verify app parses without error
RUN R -e "library(shiny); library(bslib); library(dplyr); library(myIO); parse('/srv/shiny-server/app.R'); cat('All OK\n')"

EXPOSE 3838

CMD ["R", "-e", "shiny::runApp('/srv/shiny-server', host = '0.0.0.0', port = 3838)"]

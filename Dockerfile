FROM rocker/shiny:4.4.0

RUN apt-get update && apt-get install -y --no-install-recommends \
    libcurl4-openssl-dev \
    libssl-dev \
    libxml2-dev \
    git \
  && rm -rf /var/lib/apt/lists/*

RUN R -e "install.packages(c('dplyr', 'remotes'), repos = 'https://cloud.r-project.org')"
RUN R -e "remotes::install_github('mortonanalytics/myIO')"

COPY app/ /srv/shiny-server/

RUN rm -rf /srv/shiny-server/sample-apps /srv/shiny-server/index.html

EXPOSE 3838

CMD ["/usr/bin/shiny-server"]

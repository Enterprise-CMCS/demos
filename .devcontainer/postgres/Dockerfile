FROM postgres:17-bookworm

RUN apt-get update && apt-get install -y postgresql-17-cron

RUN echo "shared_preload_libraries='pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample
RUN echo "cron.database_name='demos'" >> /usr/share/postgresql/postgresql.conf.sample

